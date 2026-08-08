import 'server-only';

// Este módulo roda somente no Route Handler autenticado e grava a saída do modelo.
// eslint-disable-next-line no-restricted-imports
import { createAdminClient } from '@/lib/supabase/admin';
import { gerarRelatorioDiagnostico, type ContextoModeloDiagnostico } from './modelo';
import { calcularNotaGeral, type FonteDiagnostico } from './schema';
import { coletarJornadaPublica, ErroColetaSite, normalizarSite } from './site';

export type ResultadoExecucaoDiagnostico =
  { estado: 'concluido' } | { estado: 'processando' } | { estado: 'falhou'; mensagem: string };

export async function executarDiagnostico(
  diagnosticoId: string,
  usuarioId: string,
): Promise<ResultadoExecucaoDiagnostico> {
  const admin = createAdminClient();
  const { data: diagnostico, error } = await admin
    .from('diagnosticos_atendimento')
    .select(
      'id, dono, empresa_id, contato_id, oportunidade_id, status, canal, site_url, cenario, evidencia_informada, iniciado_em',
    )
    .eq('id', diagnosticoId)
    .eq('dono', usuarioId)
    .maybeSingle();
  if (error || !diagnostico) return { estado: 'falhou', mensagem: 'Diagnóstico não encontrado.' };
  if (diagnostico.status === 'concluido') return { estado: 'concluido' };
  if (diagnostico.status === 'processando' && execucaoAindaAtiva(diagnostico.iniciado_em)) {
    return { estado: 'processando' };
  }

  const inicio = new Date().toISOString();
  const { data: travado, error: erroInicio } = await admin
    .from('diagnosticos_atendimento')
    .update({ status: 'processando', iniciado_em: inicio, concluido_em: null, erro: null })
    .eq('id', diagnostico.id)
    .eq('dono', usuarioId)
    .in('status', ['na_fila', 'falhou', 'processando'])
    .select('id')
    .maybeSingle();
  if (erroInicio || !travado) return { estado: 'processando' };

  try {
    const contexto = await carregarContexto(admin, diagnostico);
    const fontes: FonteDiagnostico[] = [
      { tipo: 'crm', titulo: 'Histórico da oportunidade', status: 'lida' },
    ];
    let paginas: Awaited<ReturnType<typeof coletarJornadaPublica>>['paginas'] = [];
    const site = normalizarSite(diagnostico.site_url);

    if (diagnostico.site_url && !site) throw new ErroColetaSite('url_invalida');
    if (site) {
      try {
        const coleta = await coletarJornadaPublica(site);
        paginas = coleta.paginas;
        fontes.push(...coleta.fontes);
      } catch (erroColeta) {
        fontes.push({
          tipo: 'site',
          titulo: site.hostname,
          url: site.toString(),
          status: 'indisponivel',
        });
        if (!diagnostico.evidencia_informada) throw erroColeta;
      }
    }
    if (diagnostico.evidencia_informada) {
      fontes.push({ tipo: 'conversa', titulo: 'Conversa autorizada', status: 'informada' });
    }

    const gerado = await gerarRelatorioDiagnostico({
      usuarioId,
      canal: diagnostico.canal,
      cenario: diagnostico.cenario,
      evidencia: diagnostico.evidencia_informada,
      paginas,
      contexto,
    });
    const nota = calcularNotaGeral(gerado.relatorio);
    const { error: erroGravacao } = await admin
      .from('diagnosticos_atendimento')
      .update({
        status: 'concluido',
        resultado: gerado.relatorio,
        fontes,
        nota_geral: nota,
        modelo: gerado.modelo,
        resposta_id: gerado.respostaId,
        concluido_em: new Date().toISOString(),
        erro: null,
      })
      .eq('id', diagnostico.id)
      .eq('dono', usuarioId);
    if (erroGravacao) throw erroGravacao;
    return { estado: 'concluido' };
  } catch (erroExecucao) {
    console.error(`[diagnosticos:executar] ${diagnostico.id}:`, erroExecucao);
    const mensagem = mensagemSegura(erroExecucao);
    const { error: erroFalha } = await admin
      .from('diagnosticos_atendimento')
      .update({ status: 'falhou', erro: mensagem, concluido_em: new Date().toISOString() })
      .eq('id', diagnostico.id)
      .eq('dono', usuarioId);
    if (erroFalha) console.error('[diagnosticos:falha] não foi possível registrar:', erroFalha);
    return { estado: 'falhou', mensagem };
  }
}

function execucaoAindaAtiva(iniciadoEm: string | null): boolean {
  if (!iniciadoEm) return false;
  return Date.now() - new Date(iniciadoEm).getTime() < 4 * 60_000;
}

async function carregarContexto(
  admin: ReturnType<typeof createAdminClient>,
  diagnostico: {
    dono: string;
    empresa_id: string;
    contato_id: string | null;
    oportunidade_id: string;
  },
): Promise<ContextoModeloDiagnostico> {
  const [empresa, contato, oportunidade, eventos, projetos] = await Promise.all([
    admin
      .from('crm_empresas')
      .select('nome, dominio, setor, porte')
      .eq('id', diagnostico.empresa_id)
      .eq('dono', diagnostico.dono)
      .single(),
    diagnostico.contato_id
      ? admin
          .from('crm_contatos')
          .select('nome, cargo')
          .eq('id', diagnostico.contato_id)
          .eq('dono', diagnostico.dono)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin
      .from('crm_oportunidades')
      .select('titulo, etapa, proxima_acao')
      .eq('id', diagnostico.oportunidade_id)
      .eq('dono', diagnostico.dono)
      .single(),
    admin
      .from('crm_eventos')
      .select('titulo, descricao, tipo, ocorrido_em')
      .eq('oportunidade_id', diagnostico.oportunidade_id)
      .eq('dono', diagnostico.dono)
      .order('ocorrido_em', { ascending: false })
      .limit(30),
    admin
      .from('solucoes')
      .select('slug, titulo, resumo')
      .eq('status', 'publicado')
      .order('ordem', { ascending: true })
      .limit(20),
  ]);

  if (empresa.error || contato.error || oportunidade.error || eventos.error || projetos.error) {
    throw new Error('contexto_indisponivel');
  }

  return {
    empresa: empresa.data,
    contato: contato.data,
    oportunidade: {
      titulo: oportunidade.data.titulo,
      etapa: oportunidade.data.etapa,
      proximaAcao: oportunidade.data.proxima_acao,
    },
    eventos: (eventos.data ?? []).map((evento) => ({
      titulo: evento.titulo,
      descricao: evento.descricao,
      tipo: evento.tipo,
      ocorridoEm: evento.ocorrido_em,
    })),
    projetos: projetos.data ?? [],
  };
}

function mensagemSegura(erro: unknown): string {
  if (erro instanceof ErroColetaSite) {
    if (erro.codigo === 'url_invalida') return 'Revise o endereço do site informado.';
    if (erro.codigo === 'destino_bloqueado') return 'Esse endereço não pode ser analisado.';
    return 'Não foi possível ler a jornada pública desse site. Informe uma conversa autorizada ou tente outro endereço.';
  }
  if (erro && typeof erro === 'object' && 'tipo' in erro) {
    const mensagem = 'message' in erro ? String(erro.message) : '';
    return mensagem.slice(0, 500) || 'A análise não conseguiu concluir este relatório agora.';
  }
  return 'O diagnóstico não conseguiu concluir agora. Tente novamente em instantes.';
}
