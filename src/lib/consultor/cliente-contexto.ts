import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/supabase/types.generated';
import { lerDossie } from '@/lib/crm/enriquecimento';
import { formatarReais, lerDocumentoProposta } from '@/lib/propostas/schema';
import {
  confirmaNome,
  empresasDoPedido,
  mencionados,
  textoCliente,
  type ClienteSobral,
} from './cliente';
import type { SinaisSobral } from './sinais';

function itensJson(valor: Json, limite = 2): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.slice(0, limite).flatMap((item) => {
    const texto = textoCliente(
      typeof item === 'object' && item && !Array.isArray(item)
        ? (item.descricao ?? item.texto ?? item.acao ?? item.titulo)
        : item,
    );
    return texto ? [texto] : [];
  });
}

/** Leitura da ficha citada, sem nova pesquisa paga nem transcrições integrais.
 * Mesmo no worker, o cliente recebido carrega a sessão do usuário e a RLS.
 * Cada consulta também restringe dono e oportunidade; não há service_role aqui. */
export async function completarSinaisComCliente(
  supabase: SupabaseClient<Database>,
  usuarioId: string,
  sinais: SinaisSobral,
  pedido: string,
  historico: { papel: string; conteudo: string }[],
): Promise<SinaisSobral> {
  const cliente: ClienteSobral = { estado: 'sem_cliente', opcoes: [], ficha: null, fatos: [] };
  const resultado = { ...sinais, foco: null, cliente } as SinaisSobral;
  const empresas = await supabase
    .from('crm_empresas')
    .select('id, nome')
    .eq('dono', usuarioId)
    .order('atualizado_em', { ascending: false })
    .limit(500);
  if (empresas.error) {
    cliente.estado = 'indisponivel';
    return resultado;
  }
  let candidatas = empresasDoPedido(pedido, historico, empresas.data ?? []);
  let escolhaPorTitulo = false;
  if (!candidatas.length && /\b(venda|oportunidade|ficha) em foco\b/i.test(pedido) && sinais.foco) {
    candidatas = (empresas.data ?? []).filter((empresa) => empresa.nome === sinais.foco?.empresa);
  }
  if (!candidatas.length) {
    const anterior = historico
      .filter((item) => item.papel === 'usuario' && item.conteudo !== pedido)
      .at(-1);
    const anteriores = anterior ? mencionados(anterior.conteudo, empresas.data ?? []) : [];
    if (anteriores.length === 1) {
      candidatas = anteriores;
      escolhaPorTitulo = true;
    }
  }
  if (!candidatas.length) return resultado;
  if (candidatas.length !== 1) {
    cliente.estado = 'ambiguo';
    cliente.opcoes = candidatas.slice(0, 4).map((empresa) => empresa.nome.slice(0, 160));
    return resultado;
  }
  const empresaId = candidatas[0]!.id;
  const oportunidades = await supabase
    .from('crm_oportunidades')
    .select(
      'id, titulo, etapa, situacao, contato_principal_id, proxima_acao, proxima_acao_em, atualizado_em',
    )
    .eq('dono', usuarioId)
    .eq('empresa_id', empresaId)
    .order('atualizado_em', { ascending: false })
    .limit(21);
  if (oportunidades.error) {
    cliente.estado = 'indisponivel';
    return resultado;
  }
  const linhas = oportunidades.data ?? [];
  const nomeadas = escolhaPorTitulo
    ? linhas.filter((item) => confirmaNome(pedido, item.titulo))
    : mencionados(
        pedido,
        linhas.map((item) => ({ ...item, nome: item.titulo })),
      );
  if (escolhaPorTitulo && !nomeadas.length) return resultado;
  const selecionadas = nomeadas.length ? nomeadas : linhas;
  if (selecionadas.length !== 1 || linhas.length > 20) {
    cliente.estado = selecionadas.length ? 'ambiguo' : 'sem_cliente';
    cliente.opcoes = selecionadas
      .slice(0, 4)
      .map((item) => `${candidatas[0]!.nome}: ${item.titulo}`.slice(0, 340));
    return resultado;
  }
  const oportunidade = selecionadas[0]!;
  const [empresa, eventos, pesquisa, reunioes, propostas, entregas, tarefas, contato] =
    await Promise.all([
      supabase
        .from('crm_empresas')
        .select('nome, setor, porte, resumo, cidade, estado, atualizado_em')
        .eq('dono', usuarioId)
        .eq('id', empresaId)
        .maybeSingle(),
      supabase
        .from('crm_eventos')
        .select('titulo, descricao, ocorrido_em')
        .eq('dono', usuarioId)
        .eq('oportunidade_id', oportunidade.id)
        .order('ocorrido_em', { ascending: false })
        .limit(6),
      supabase
        .from('crm_enriquecimentos')
        .select('resultado, concluido_em, status')
        .eq('dono', usuarioId)
        .eq('oportunidade_id', oportunidade.id)
        .eq('status', 'concluido')
        .order('concluido_em', { ascending: false })
        .limit(2),
      supabase
        .from('calls_reunioes')
        .select('id, titulo, status, agendada_para')
        .eq('dono', usuarioId)
        .eq('oportunidade_id', oportunidade.id)
        .order('agendada_para', { ascending: false })
        .limit(3),
      supabase
        .from('propostas')
        .select('titulo, status, documento, atualizado_em')
        .eq('dono', usuarioId)
        .eq('oportunidade_id', oportunidade.id)
        .order('atualizado_em', { ascending: false })
        .limit(2),
      supabase
        .from('projetos_execucao')
        .select('id, titulo, status, tipo_servico, prazo_em, concluido_em, atualizado_em')
        .eq('dono', usuarioId)
        .eq('oportunidade_id', oportunidade.id)
        .order('atualizado_em', { ascending: false })
        .limit(3),
      supabase
        .from('projeto_acoes')
        .select('titulo, status, prazo_em, atualizado_em')
        .eq('dono', usuarioId)
        .eq('oportunidade_id', oportunidade.id)
        .order('atualizado_em', { ascending: false })
        .limit(6),
      oportunidade.contato_principal_id
        ? supabase
            .from('crm_contatos')
            .select('nome, cargo, atualizado_em')
            .eq('dono', usuarioId)
            .eq('empresa_id', empresaId)
            .eq('id', oportunidade.contato_principal_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
  if (empresa.error || !empresa.data) {
    cliente.estado = 'indisponivel';
    return resultado;
  }
  let incompleta = [eventos, pesquisa, reunioes, propostas, entregas, tarefas, contato].some(
    (item) => item.error,
  );
  function adicionar(
    fonte: ClienteSobral['fatos'][number]['fonte'],
    texto: string | null,
    data: string | null,
    natureza: 'registro' | 'hipotese' = 'registro',
  ) {
    const curto = textoCliente(texto, 500);
    if (!curto) return;
    cliente.fatos.push({ fonte, texto: curto, data, natureza });
  }
  adicionar(
    'Cadastro',
    `${empresa.data.nome} · ${oportunidade.titulo} · etapa: ${oportunidade.etapa} · situação: ${oportunidade.situacao}`,
    oportunidade.atualizado_em,
  );
  adicionar(
    'Cadastro',
    [empresa.data.setor, empresa.data.porte, empresa.data.cidade, empresa.data.estado]
      .filter(Boolean)
      .join(' · '),
    empresa.data.atualizado_em,
  );
  adicionar('Cadastro', empresa.data.resumo, empresa.data.atualizado_em);
  if (contato.data)
    adicionar(
      'Cadastro',
      `Contato cadastrado: ${contato.data.nome}${contato.data.cargo ? ` · ${contato.data.cargo}` : ''}`,
      contato.data.atualizado_em,
    );
  if (oportunidade.proxima_acao)
    adicionar(
      'Cadastro',
      `Próxima ação: ${oportunidade.proxima_acao}${oportunidade.proxima_acao_em ? ` · ${oportunidade.proxima_acao_em}` : ''}`,
      oportunidade.atualizado_em,
    );
  for (const evento of eventos.data ?? [])
    adicionar(
      'Histórico',
      `${evento.titulo}${evento.descricao ? `: ${evento.descricao}` : ''}`,
      evento.ocorrido_em,
    );
  const pesquisas = (pesquisa.data ?? []).map((item) => ({
    ...item,
    dossie: lerDossie(item.resultado),
  }));
  const enriquecimento = pesquisas.find((item) => item.dossie);
  if ((pesquisa.data?.length ?? 0) && !enriquecimento) incompleta = true;
  if (enriquecimento?.dossie) {
    const { dossie, concluido_em: data } = enriquecimento;
    for (const fato of dossie.fatos.slice(0, 4))
      adicionar('Pesquisa', `${fato.titulo}: ${fato.valor} (origem: ${fato.origem})`, data);
    for (const hipotese of dossie.hipoteses.slice(0, 2))
      adicionar(
        'Pesquisa',
        `${hipotese.titulo}: ${hipotese.explicacao}. Validar: ${hipotese.comoValidar}`,
        data,
        'hipotese',
      );
    for (const alerta of dossie.alertas.slice(0, 2))
      adicionar('Pesquisa', `Limitação da pesquisa: ${alerta}`, data);
  }
  const ids = (reunioes.data ?? []).map((item) => item.id);
  const analises = ids.length
    ? await supabase
        .from('calls_analises')
        .select('reuniao_id, resumo, objecoes, compromissos, proximos_passos, atualizada_em')
        .eq('dono', usuarioId)
        .in('reuniao_id', ids)
        .eq('status', 'concluida')
        .order('atualizada_em', { ascending: false })
        .limit(2)
    : { data: [], error: null };
  if (analises.error) incompleta = true;
  const idsEntregas = (entregas.data ?? []).map((item) => item.id);
  const passos = idsEntregas.length
    ? await supabase
        .from('projeto_tarefas')
        .select('titulo, status, concluido_quando, atualizado_em')
        .eq('dono', usuarioId)
        .in('projeto_execucao_id', idsEntregas)
        .neq('status', 'concluida')
        .order('atualizado_em', { ascending: false })
        .limit(4)
    : { data: [], error: null };
  if (passos.error) incompleta = true;
  for (const reuniao of reunioes.data ?? [])
    adicionar(
      'Reunião',
      `${reuniao.titulo}: ${reuniao.status} · ${reuniao.agendada_para}`,
      reuniao.agendada_para,
    );
  for (const analise of analises.data ?? []) {
    adicionar('Reunião', analise.resumo, analise.atualizada_em);
    for (const item of itensJson(analise.objecoes, 1))
      adicionar('Reunião', `Objeção registrada: ${item}`, analise.atualizada_em);
    for (const item of itensJson(analise.compromissos, 1))
      adicionar('Reunião', `Compromisso registrado: ${item}`, analise.atualizada_em);
    for (const item of itensJson(analise.proximos_passos, 1))
      adicionar('Reunião', `Próximo passo sugerido pela análise: ${item}`, analise.atualizada_em);
  }
  for (const proposta of propostas.data ?? []) {
    adicionar('Proposta', `${proposta.titulo}: ${proposta.status}`, proposta.atualizado_em);
    const documento = lerDocumentoProposta(proposta.documento);
    if (!documento) incompleta = true;
    if (documento) {
      adicionar(
        'Proposta',
        `Objetivo registrado (${proposta.status}): ${documento.objetivo}`,
        proposta.atualizado_em,
      );
      adicionar(
        'Proposta',
        `Escopo registrado (${proposta.status}): ${documento.escopo
          .slice(0, 3)
          .map((item) => `${item.titulo}: ${item.descricao}`)
          .join('; ')}`,
        proposta.atualizado_em,
      );
      adicionar(
        'Proposta',
        `Investimento registrado (${proposta.status}): ${formatarReais(documento.investimento.valorCentavos)}. ${documento.investimento.condicoes}`,
        proposta.atualizado_em,
      );
      adicionar(
        'Proposta',
        `Prazos registrados (${proposta.status}): ${documento.cronograma
          .slice(0, 4)
          .map((item) => `${item.fase}: ${item.duracao}`)
          .join('; ')}`,
        proposta.atualizado_em,
      );
    }
  }
  for (const entrega of entregas.data ?? [])
    adicionar(
      'Entrega',
      `${entrega.titulo}: ${entrega.status} · serviço ${entrega.tipo_servico}${entrega.prazo_em ? ` · prazo ${entrega.prazo_em}` : ''}${entrega.concluido_em ? ` · concluído em ${entrega.concluido_em}` : ''}`,
      entrega.atualizado_em,
    );
  for (const passo of passos.data ?? [])
    adicionar(
      'Tarefa',
      `${passo.titulo}: ${passo.status}. Critério de conclusão: ${passo.concluido_quando}`,
      passo.atualizado_em,
    );
  for (const tarefa of tarefas.data ?? [])
    adicionar(
      'Tarefa',
      `${tarefa.titulo}: ${tarefa.status}${tarefa.prazo_em ? ` · prazo ${tarefa.prazo_em}` : ''}`,
      tarefa.atualizado_em,
    );
  // Reserva espaço para todas as fontes antes de completar o orçamento. Um CRM
  // movimentado não pode expulsar a entrega ou o escopo do resumo de 32 trechos.
  const essenciais = [...new Set(cliente.fatos.map((item) => item.fonte))].flatMap((fonte) =>
    cliente.fatos.filter((item) => item.fonte === fonte).slice(0, 2),
  );
  cliente.fatos = [
    ...essenciais,
    ...cliente.fatos.filter((item) => !essenciais.includes(item)),
  ].slice(0, 32);
  cliente.estado = 'consultado';
  cliente.ficha = {
    oportunidadeId: oportunidade.id,
    empresa: empresa.data.nome.slice(0, 160),
    consultadaEm: sinais.momento,
    incompleta,
    fontes: [...new Set(cliente.fatos.map((item) => item.fonte))].map((nome) => {
      const fatos = cliente.fatos.filter((item) => item.fonte === nome);
      return {
        nome,
        registros: fatos.length,
        atualizadaEm:
          fatos
            .flatMap((item) => (item.data ? [item.data] : []))
            .sort()
            .at(-1) ?? null,
      };
    }),
  };
  // Uma ficha arquivada ou encerrada pode ser lida, mas não vira tarefa comercial.
  resultado.foco =
    oportunidade.situacao === 'ativa' && !['ganho', 'perdido'].includes(oportunidade.etapa)
      ? {
          oportunidadeId: oportunidade.id,
          titulo: oportunidade.titulo,
          empresa: empresa.data.nome,
          etapa: oportunidade.etapa,
          proximaAcao: oportunidade.proxima_acao,
          proximaAcaoEm: oportunidade.proxima_acao_em,
        }
      : null;
  return resultado;
}
