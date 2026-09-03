import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SalaEntrega } from '@/app/(app)/solucoes/_components/SalaEntrega';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import { ACOES_PLANO } from './acoes-preview';
import * as estados from './estado-inicial';
import { PreviewSidebar } from './PreviewSidebar';
import { ENCERRAMENTO_PREVIEW } from '../encerramento-preview';
import { EVOLUCAO_PREVIEW } from '../evolucao-preview';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Sala de Entrega' };

const PROJETO: ProjetoExecucaoCompleto = {
  id: '11111111-1111-4111-8111-111111111111',
  propostaId: '22222222-2222-4222-8222-222222222222',
  oportunidadeId: '33333333-3333-4333-8333-333333333333',
  titulo: 'Atendimento com IA para clínicas',
  empresa: 'Clínica Aurora',
  status: 'concluido',
  inicioEm: '2026-08-05T12:00:00.000Z',
  aceiteVenda: { versao: 3, aceitoEm: '2026-08-05T11:42:00.000Z', aceitoPor: 'Camila Rios' },
  prazoEm: '2026-08-28T12:00:00.000Z',
  atualizadoEm: '2026-08-09T12:00:00.000Z',
  feitas: 7,
  total: 7,
  proximaTarefa: null,
  proximaAcaoPrazoEm: null,
  tarefasBloqueadas: 0,
  validacoesAguardando: 0,
  ajustesSolicitados: 0,
  encerramento: ENCERRAMENTO_PREVIEW,
  evolucao: EVOLUCAO_PREVIEW,
  portalAtivo: true,
  portalCodigo: '44444444-4444-4444-8444-444444444444',
  portalAtivadoEm: '2026-08-09T12:00:00.000Z',
  briefingOrigem: 'salvo',
  briefing: {
    objetivo:
      'Responder novos contatos em poucos segundos, organizar a triagem e entregar cada oportunidade pronta para a recepção.',
    criterioSucesso:
      '90% dos novos contatos recebem a primeira resposta em até um minuto durante o piloto.',
    responsavelCliente: 'Camila Rios · Diretora de operações',
    responsavelTecnico: 'Mateus Silva · Implementador',
    acessos: ['WhatsApp Business · liberação por Camila', 'Agenda da recepção · leitura'],
    limites: [
      'Dúvidas clínicas seguem para a recepção',
      'Urgências não recebem resposta automática',
    ],
    proximosPassos: ['Iniciar o piloto em uma unidade', 'Revisar os indicadores em sete dias'],
    observacoes: '',
    confirmadoEm: '2026-08-05T15:00:00.000Z',
    fonteCallId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  },
  kickoff: null,
  acoesPlano: ACOES_PLANO,
  mudancasEscopo: [],
  eventos: [
    {
      id: '99999999-9999-4999-8999-999999999991',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
      tipo: 'entrega_aprovada',
      autor: 'cliente',
      comentario: 'Entrega final aprovada pela diretoria de operações.',
      criadoEm: '2026-08-10T18:20:00.000Z',
    },
    {
      id: '99999999-9999-4999-8999-999999999992',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
      tipo: 'aprovacao_solicitada',
      autor: 'prestador',
      comentario: null,
      criadoEm: '2026-08-10T17:10:00.000Z',
    },
    {
      id: '99999999-9999-4999-8999-999999999993',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
      tipo: 'arquivo_liberado',
      autor: 'prestador',
      comentario: 'Manual da operação · v1',
      criadoEm: '2026-08-10T16:40:00.000Z',
    },
    {
      id: '99999999-9999-4999-8999-999999999994',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      tipo: 'entrega_aprovada',
      autor: 'cliente',
      comentario: null,
      criadoEm: '2026-08-08T10:00:00.000Z',
    },
  ],
  documento: {
    cliente: {
      empresa: 'Clínica Aurora',
      contato: 'Camila Rios',
      cargo: 'Diretora de operações',
      email: 'camila@clinicaaurora.com.br',
    },
    projeto: {
      titulo: 'Atendimento com IA para clínicas',
      resumo:
        'Uma operação de atendimento contínua, organizada e mensurável no WhatsApp da clínica.',
      origem: 'catalogo',
    },
    desafio:
      'A clínica perde conversas fora do horário comercial e a recepção repete a mesma triagem.',
    objetivo:
      'Responder novos contatos em poucos segundos, organizar a triagem e entregar cada oportunidade pronta para a recepção.',
    escopo: [
      {
        titulo: 'Mapeamento do atendimento',
        descricao: 'Leitura das conversas, regras e critérios de encaminhamento.',
      },
      {
        titulo: 'Agente de atendimento',
        descricao: 'Configuração, testes e publicação assistida.',
      },
    ],
    entregaveis: [
      'Fluxo de atendimento documentado',
      'Agente configurado e testado',
      'Painel de acompanhamento',
    ],
    cronograma: [
      {
        fase: 'Descoberta e desenho',
        duracao: '1 semana',
        descricao: 'Mapeamento das regras e mensagens.',
      },
    ],
    investimento: {
      valorCentavos: 1850000,
      condicoes: '50% no início e 50% após a validação.',
    },
    validadeDias: 10,
    proximosPassos: ['Aprovação', 'Kick-off', 'Liberação dos acessos'],
    observacoes: null,
  },
  arquivos: [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
      grupoId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      versao: 2,
      titulo: 'Mapa de demanda do atendimento',
      descricao: 'Consolidado final após a revisão da diretora de operações.',
      nomeOriginal: 'mapa-demanda-aurora-v2.pdf',
      mimeType: 'application/pdf',
      tamanhoBytes: 1840000,
      visivelCliente: true,
      publicadoEm: '2026-08-09T13:00:00.000Z',
      criadoEm: '2026-08-09T12:45:00.000Z',
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      grupoId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      versao: 1,
      titulo: 'Mapa de demanda do atendimento',
      descricao: 'Primeira leitura das conversas da clínica.',
      nomeOriginal: 'mapa-demanda-aurora-v1.pdf',
      mimeType: 'application/pdf',
      tamanhoBytes: 1620000,
      visivelCliente: false,
      publicadoEm: null,
      criadoEm: '2026-08-07T13:00:00.000Z',
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      grupoId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      versao: 1,
      titulo: 'Matriz de limites e escalonamento',
      descricao: 'Cenários que exigem transferência para a equipe humana.',
      nomeOriginal: 'matriz-limites.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      tamanhoBytes: 384000,
      visivelCliente: false,
      publicadoEm: null,
      criadoEm: '2026-08-08T14:00:00.000Z',
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5',
      grupoId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
      versao: 1,
      titulo: 'Manual da operação e indicadores',
      descricao: 'Rotina final, responsáveis e agenda da primeira revisão.',
      nomeOriginal: 'manual-operacao-aurora.pdf',
      mimeType: 'application/pdf',
      tamanhoBytes: 2240000,
      visivelCliente: true,
      publicadoEm: '2026-08-10T16:40:00.000Z',
      criadoEm: '2026-08-10T16:35:00.000Z',
    },
  ],
  tarefas: [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      faseId: 'entender',
      faseTitulo: 'Entender',
      passoId: 'entender:mapear-demanda',
      titulo: 'Medir a demanda real',
      acao: 'Exporte sete dias de conversas e registre volume por horário, assuntos recorrentes e tempo até a primeira resposta.',
      concluidoQuando: 'O mapa mostra volume, horários e os dez assuntos mais frequentes.',
      entregavel: 'Mapa de demanda do atendimento.',
      ordem: 1,
      status: 'concluida',
      evidencia: 'Mapa validado com a recepção em 07/08.',
      evidenciaEm: '2026-08-07T12:00:00.000Z',
      concluidaEm: '2026-08-07T12:00:00.000Z',
      clienteStatus: 'aprovada',
      clienteNota:
        'Mapeamos os horários de pico e os dez assuntos que concentram 82% das conversas.',
      entregavelUrl: 'https://example.com/mapa-demanda',
      clienteSolicitadoEm: '2026-08-07T14:00:00.000Z',
      clienteRespondidoEm: '2026-08-08T10:00:00.000Z',
      clienteComentario: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      faseId: 'entender',
      faseTitulo: 'Entender',
      passoId: 'entender:definir-limites',
      titulo: 'Definir os limites da IA',
      acao: 'Liste situações de risco, pedidos que exigem uma pessoa e o responsável por cada transferência.',
      concluidoQuando: 'Todo cenário de risco tem gatilho, destino e prazo humano definidos.',
      entregavel: 'Matriz de limites e escalonamento.',
      ordem: 2,
      status: 'concluida',
      evidencia: 'Matriz aprovada pela diretora de operações.',
      evidenciaEm: '2026-08-08T12:00:00.000Z',
      concluidaEm: '2026-08-08T12:00:00.000Z',
      clienteStatus: 'aprovada',
      clienteNota:
        'A matriz separa o que a IA pode responder e os cenários que precisam da recepção.',
      entregavelUrl: 'https://example.com/matriz-limites',
      clienteSolicitadoEm: '2026-08-09T09:00:00.000Z',
      clienteRespondidoEm: '2026-08-09T11:00:00.000Z',
      clienteComentario: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      faseId: 'preparar',
      faseTitulo: 'Preparar',
      passoId: 'preparar:montar-base',
      titulo: 'Montar a base aprovada',
      acao: 'Converta políticas, serviços, horários e perguntas frequentes em respostas curtas. Registre a fonte e a data de revisão de cada resposta.',
      concluidoQuando: 'As dez perguntas mais frequentes têm resposta e fonte aprovadas.',
      entregavel: 'Base de conhecimento versionada.',
      ordem: 1001,
      status: 'concluida',
      evidencia: 'Base aprovada e versionada.',
      evidenciaEm: '2026-08-09T12:00:00.000Z',
      concluidaEm: '2026-08-09T15:00:00.000Z',
      clienteStatus: 'nao_solicitada',
      clienteNota: null,
      entregavelUrl: null,
      clienteSolicitadoEm: null,
      clienteRespondidoEm: null,
      clienteComentario: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      faseId: 'preparar',
      faseTitulo: 'Preparar',
      passoId: 'preparar:configurar-canal',
      titulo: 'Configurar o canal oficial',
      acao: 'Valide a conta comercial, número, templates e webhook em ambiente de teste.',
      concluidoQuando: 'Uma mensagem entra e uma resposta autorizada retorna pelo canal oficial.',
      entregavel: 'Canal de teste conectado.',
      ordem: 1002,
      status: 'concluida',
      evidencia: 'Canal oficial validado em ambiente controlado.',
      evidenciaEm: '2026-08-09T17:00:00.000Z',
      concluidaEm: '2026-08-09T17:00:00.000Z',
      clienteStatus: 'nao_solicitada',
      clienteNota: null,
      entregavelUrl: null,
      clienteSolicitadoEm: null,
      clienteRespondidoEm: null,
      clienteComentario: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
      faseId: 'construir',
      faseTitulo: 'Construir',
      passoId: 'construir:agente',
      titulo: 'Construir o agente e o handoff',
      acao: 'Classifique a intenção, use apenas a base aprovada e transfira com contexto.',
      concluidoQuando: 'A recepção recebe conversa, resumo e motivo no mesmo painel.',
      entregavel: 'Agente com handoff humano.',
      ordem: 2001,
      status: 'concluida',
      evidencia: 'Agente ativo com handoff para a recepção.',
      evidenciaEm: '2026-08-10T12:00:00.000Z',
      concluidaEm: '2026-08-10T12:00:00.000Z',
      clienteStatus: 'nao_solicitada',
      clienteNota: null,
      entregavelUrl: null,
      clienteSolicitadoEm: null,
      clienteRespondidoEm: null,
      clienteComentario: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
      faseId: 'validar',
      faseTitulo: 'Validar',
      passoId: 'validar:cenarios',
      titulo: 'Rodar vinte cenários',
      acao: 'Teste perguntas simples, ambíguas, sensíveis e com cliente irritado.',
      concluidoQuando: 'Nenhum cenário crítico inventa informação ou deixa de transferir.',
      entregavel: 'Relatório de testes com evidências.',
      ordem: 3001,
      status: 'concluida',
      evidencia: 'Vinte cenários executados sem falhas críticas.',
      evidenciaEm: '2026-08-10T14:00:00.000Z',
      concluidaEm: '2026-08-10T14:00:00.000Z',
      clienteStatus: 'nao_solicitada',
      clienteNota: null,
      entregavelUrl: null,
      clienteSolicitadoEm: null,
      clienteRespondidoEm: null,
      clienteComentario: null,
    },
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
      faseId: 'entregar',
      faseTitulo: 'Entregar',
      passoId: 'entregar:manual',
      titulo: 'Entregar operação e indicadores',
      acao: 'Treine responsáveis, entregue a rotina e agende a primeira revisão.',
      concluidoQuando: 'A equipe opera e explica os indicadores sem o implementador.',
      entregavel: 'Manual e agenda de acompanhamento.',
      ordem: 4001,
      status: 'concluida',
      evidencia: 'Treinamento concluído e manual entregue.',
      evidenciaEm: '2026-08-10T16:00:00.000Z',
      concluidaEm: '2026-08-10T16:00:00.000Z',
      clienteStatus: 'aprovada',
      clienteNota: 'A operação está ativa e a equipe recebeu a rotina de acompanhamento.',
      entregavelUrl: 'https://example.com/entrega-final',
      clienteSolicitadoEm: '2026-08-10T17:10:00.000Z',
      clienteRespondidoEm: '2026-08-10T18:20:00.000Z',
      clienteComentario: null,
    },
  ],
};

export default async function PreviewSalaEntregaPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const estado = (await searchParams).estado;
  const projeto =
    estado === 'inicio'
      ? estados.prepararProjetoNoInicio(PROJETO)
      : estado === 'execucao'
        ? estados.prepararProjetoEmExecucao(PROJETO)
        : estado === 'aprovacao'
          ? estados.prepararProjetoAposAprovacao(PROJETO)
          : estado === 'validacao'
            ? estados.prepararProjetoEmValidacao(PROJETO)
            : estado === 'ajustes'
              ? estados.prepararProjetoComAjustes(PROJETO)
              : estado === 'escopo'
                ? {
                    ...estados.prepararProjetoEmExecucao(PROJETO),
                    mudancasEscopoParaAnalisar: 1,
                    mudancasEscopo: [
                      {
                        id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
                        titulo: 'Incluir atendimento pelo Instagram',
                        descricao:
                          'Queremos usar a mesma triagem também nas mensagens que chegam pelo Instagram da clínica.',
                        solicitadoPor: 'cliente' as const,
                        status: 'em_analise' as const,
                        classificacao: null,
                        resposta: null,
                        impactoPrazoDias: null,
                        impactoValorCentavos: null,
                        criadoEm: '2026-08-30T13:40:00.000Z',
                        analisadoEm: null,
                        decididoEm: null,
                      },
                    ],
                  }
                : PROJETO;
  return (
    <div className={styles.shell}>
      <PreviewSidebar />
      <main id="conteudo" className={styles.conteudo}>
        <SalaEntrega projeto={projeto} />
      </main>
    </div>
  );
}
