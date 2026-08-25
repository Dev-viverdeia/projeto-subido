import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';
import type { Tables } from '@/lib/supabase/types.generated';

/**
 * Leitura da agenda de mentorias — do BANCO, agora.
 *
 * O QUE ISTO SUBSTITUI: `gerarAgendaExemplo(new Date())`, um gerador em código
 * que posicionava sessões em volta do instante da visita para que todos os
 * estados da matriz aparecessem. Horário, vagas e lotação eram inventados a cada
 * request. A agenda agora nasce vazia e enche quando o admin cadastrar — o que é
 * a verdade, e é o que destrava a tela para assinante.
 */

import { ehTrilha, type SessaoMentoria } from './tipos';

export type { MentorDaSessao, SessaoMentoria, TrilhaMentor } from './tipos';
export { TRILHAS } from './tipos';

type LinhaComMentor = Pick<
  Tables<'mentorias'>,
  'id' | 'titulo' | 'descricao' | 'inicio' | 'fim' | 'vagas' | 'custo_creditos' | 'sala_url'
> & {
  mentores: Pick<Tables<'mentores'>, 'id' | 'nome' | 'headline' | 'foto_url' | 'trilha'> | null;
  mentoria_inscricoes: Pick<Tables<'mentoria_inscricoes'>, 'mentoria_id' | 'creditos_usados'>[];
};

/**
 * A agenda inteira publicada, do passado recente ao futuro.
 *
 * SÃO DUAS IDAS AO BANCO:
 *
 * 1. as sessões + o mentor + a inscrição desta pessoa aninhados. A RLS de
 *    `mentoria_inscricoes` garante que o join só devolve a própria linha;
 * 2. a OCUPAÇÃO, por rpc — a policy de `mentoria_inscricoes` mostra à pessoa só
 *    a linha dela, então `count(*)` feito daqui devolveria 0 ou 1 sempre. A
 *    função é `security definer` com escopo mínimo e não devolve identidade.
 *
 * O dado pessoal continua separado do agregado: só deixou de exigir uma terceira
 * viagem porque já existe uma relação direta entre sessão e inscrição.
 */
export async function listarAgenda(): Promise<SessaoMentoria[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mentorias')
    .select(
      'id, titulo, descricao, inicio, fim, vagas, custo_creditos, sala_url, mentores(id, nome, headline, foto_url, trilha), mentoria_inscricoes(mentoria_id, creditos_usados)',
    )
    .eq('status', 'publicado')
    .order('inicio', { ascending: true })
    .returns<LinhaComMentor[]>();

  if (error) throw handleError(error, 'mentorias:agenda');

  /* Sessão sem mentor é impossível pelo schema (`mentor_id` é NOT NULL com FK),
     mas o join tipado admite null. Descartar é mais honesto que renderizar uma
     sessão sem quem a dá. */
  const linhas = (data ?? []).filter((l) => l.mentores !== null);
  if (linhas.length === 0) return [];

  const ids = linhas.map((l) => l.id);

  const ocupacao = await supabase.rpc('mentoria_ocupacao', { _ids: ids });

  if (ocupacao.error) throw handleError(ocupacao.error, 'mentorias:ocupacao');

  const porId = new Map((ocupacao.data ?? []).map((o) => [o.mentoria_id, o.inscritos]));

  return linhas.map((l) => {
    const m = l.mentores!;
    return {
      id: l.id,
      titulo: l.titulo,
      descricao: l.descricao,
      inicioIso: l.inicio,
      fimIso: l.fim,
      vagas: l.vagas,
      custoCreditos: l.custo_creditos,
      salaUrl: l.sala_url,
      mentor: {
        id: m.id,
        nome: m.nome,
        headline: m.headline,
        foto_url: m.foto_url,
        /* Narrowing do CHECK. Trilha desconhecida cai em `implementacao` em vez
           de quebrar a tela — o valor só decide rótulo e intensidade de navy. */
        trilha: ehTrilha(m.trilha) ? m.trilha : 'implementacao',
      },
      inscritos: porId.get(l.id) ?? 0,
      euInscrito: l.mentoria_inscricoes.length > 0,
      creditosUsados: l.mentoria_inscricoes[0]?.creditos_usados ?? null,
    };
  });
}

/**
 * UMA sessão pela id — a leitura da SALA. Mesmas duas idas da agenda, no
 * singular, pelo mesmo motivo (ver `listarAgenda`). `cache()` evita repetir as
 * duas leituras quando `generateMetadata` e a página pedem a mesma sessão no
 * mesmo render.
 */
export const obterSessao = cache(async (id: string): Promise<SessaoMentoria | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mentorias')
    .select(
      'id, titulo, descricao, inicio, fim, vagas, custo_creditos, sala_url, mentores(id, nome, headline, foto_url, trilha), mentoria_inscricoes(mentoria_id, creditos_usados)',
    )
    .eq('id', id)
    .maybeSingle<LinhaComMentor>();

  if (error) throw handleError(error, 'mentorias:sessao');
  if (!data || !data.mentores) return null;

  const ocupacao = await supabase.rpc('mentoria_ocupacao', { _ids: [data.id] });

  if (ocupacao.error) throw handleError(ocupacao.error, 'mentorias:ocupacao');

  const m = data.mentores;
  return {
    id: data.id,
    titulo: data.titulo,
    descricao: data.descricao,
    inicioIso: data.inicio,
    fimIso: data.fim,
    vagas: data.vagas,
    custoCreditos: data.custo_creditos,
    salaUrl: data.sala_url,
    mentor: {
      id: m.id,
      nome: m.nome,
      headline: m.headline,
      foto_url: m.foto_url,
      trilha: ehTrilha(m.trilha) ? m.trilha : 'implementacao',
    },
    inscritos: ocupacao.data?.[0]?.inscritos ?? 0,
    euInscrito: data.mentoria_inscricoes.length > 0,
    creditosUsados: data.mentoria_inscricoes[0]?.creditos_usados ?? null,
  };
});

/** Mentores ativos — alimenta o seletor do admin. */
export async function listarMentores(): Promise<Tables<'mentores'>[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('mentores')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw handleError(error, 'mentorias:mentores');
  return data ?? [];
}
