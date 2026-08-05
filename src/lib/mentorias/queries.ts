import 'server-only';

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
  'id' | 'titulo' | 'descricao' | 'inicio' | 'fim' | 'vagas' | 'sala_url'
> & {
  mentores: Pick<Tables<'mentores'>, 'id' | 'nome' | 'headline' | 'foto_url' | 'trilha'> | null;
};

/**
 * A agenda inteira publicada, do passado recente ao futuro.
 *
 * SÃO TRÊS IDAS AO BANCO, e nenhuma delas é evitável sem abrir mão de algo:
 *
 * 1. as sessões + o mentor aninhado (uma query, RLS filtrando `publicado`);
 * 2. a OCUPAÇÃO, por rpc — a policy de `mentoria_inscricoes` mostra à pessoa só
 *    a linha dela, então `count(*)` feito daqui devolveria 0 ou 1 sempre. A
 *    função é `security definer` com escopo mínimo e não devolve identidade;
 * 3. as inscrições DESTA pessoa, que a RLS já limita sozinha.
 *
 * Juntar 2 e 3 numa rpc só economizaria um round trip e devolveria o dado de
 * participação misturado ao agregado — exatamente a fronteira que a migration
 * separou de propósito.
 */
export async function listarAgenda(): Promise<SessaoMentoria[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mentorias')
    .select(
      'id, titulo, descricao, inicio, fim, vagas, sala_url, mentores(id, nome, headline, foto_url, trilha)',
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

  const [ocupacao, minhas] = await Promise.all([
    supabase.rpc('mentoria_ocupacao', { _ids: ids }),
    supabase.from('mentoria_inscricoes').select('mentoria_id').in('mentoria_id', ids),
  ]);

  if (ocupacao.error) throw handleError(ocupacao.error, 'mentorias:ocupacao');
  if (minhas.error) throw handleError(minhas.error, 'mentorias:inscricoes');

  const porId = new Map((ocupacao.data ?? []).map((o) => [o.mentoria_id, o.inscritos]));
  const meus = new Set((minhas.data ?? []).map((i) => i.mentoria_id));

  return linhas.map((l) => {
    const m = l.mentores!;
    return {
      id: l.id,
      titulo: l.titulo,
      descricao: l.descricao,
      inicioIso: l.inicio,
      fimIso: l.fim,
      vagas: l.vagas,
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
      euInscrito: meus.has(l.id),
    };
  });
}

/**
 * UMA sessão pela id — a leitura da SALA. Mesmas três idas da agenda, no
 * singular, pelo mesmo motivo (ver `listarAgenda`): a RLS filtra `publicado`,
 * a ocupação vem por rpc sem identidade, e `euInscrito` é a linha que a RLS
 * deixa a pessoa ver.
 */
export async function obterSessao(id: string): Promise<SessaoMentoria | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mentorias')
    .select(
      'id, titulo, descricao, inicio, fim, vagas, sala_url, mentores(id, nome, headline, foto_url, trilha)',
    )
    .eq('id', id)
    .maybeSingle<LinhaComMentor>();

  if (error) throw handleError(error, 'mentorias:sessao');
  if (!data || !data.mentores) return null;

  const [ocupacao, minha] = await Promise.all([
    supabase.rpc('mentoria_ocupacao', { _ids: [data.id] }),
    supabase.from('mentoria_inscricoes').select('mentoria_id').eq('mentoria_id', data.id),
  ]);

  if (ocupacao.error) throw handleError(ocupacao.error, 'mentorias:ocupacao');
  if (minha.error) throw handleError(minha.error, 'mentorias:inscricoes');

  const m = data.mentores;
  return {
    id: data.id,
    titulo: data.titulo,
    descricao: data.descricao,
    inicioIso: data.inicio,
    fimIso: data.fim,
    vagas: data.vagas,
    salaUrl: data.sala_url,
    mentor: {
      id: m.id,
      nome: m.nome,
      headline: m.headline,
      foto_url: m.foto_url,
      trilha: ehTrilha(m.trilha) ? m.trilha : 'implementacao',
    },
    inscritos: ocupacao.data?.[0]?.inscritos ?? 0,
    euInscrito: (minha.data ?? []).length > 0,
  };
}

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
