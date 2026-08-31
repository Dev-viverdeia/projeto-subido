import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PortalProjeto } from '@/app/portal/[codigo]/PortalProjeto';
import type { ProjetoPortalCliente, TarefaPortalCliente } from '@/lib/portal-cliente/servico';

export const metadata: Metadata = { title: 'Preview · Portal do Cliente' };

const CODIGO = '44444444-4444-4444-8444-444444444444';

function tarefa(
  dados: Pick<
    TarefaPortalCliente,
    'id' | 'faseId' | 'faseTitulo' | 'titulo' | 'entregavel' | 'ordem' | 'status' | 'clienteStatus'
  > &
    Partial<TarefaPortalCliente>,
): TarefaPortalCliente {
  return {
    concluidoQuando: 'O material foi revisado com o responsável e atende ao escopo combinado.',
    clienteNota: null,
    entregavelUrl: null,
    solicitadoEm: null,
    respondidoEm: null,
    comentario: null,
    ...dados,
  };
}

const PROJETO: ProjetoPortalCliente = {
  id: '11111111-1111-4111-8111-111111111111',
  titulo: 'Atendimento com IA para clínicas',
  empresa: 'Clínica Aurora',
  resumo: 'Uma operação de atendimento contínua, organizada e mensurável no WhatsApp da clínica.',
  objetivo:
    'Responder novos contatos em poucos segundos, organizar a triagem e entregar cada oportunidade pronta para a recepção.',
  status: 'concluido',
  inicioEm: '2026-08-05T12:00:00.000Z',
  prazoEm: '2026-08-28T12:00:00.000Z',
  feitas: 7,
  total: 7,
  dependencias: [],
  mudancasEscopo: [],
  briefing: {
    objetivo:
      'Responder novos contatos em poucos segundos, organizar a triagem e entregar cada oportunidade pronta para a recepção.',
    criterioSucesso:
      '90% dos novos contatos recebem a primeira resposta em até um minuto durante o piloto.',
    responsavelCliente: 'Camila Rios · Diretora de operações',
    responsavelTecnico: 'Mateus Silva · Implementador',
    proximosPassos: [
      'Liberar os acessos do WhatsApp Business e da agenda',
      'Validar a matriz de transferência com a recepção',
      'Iniciar o piloto em uma unidade',
    ],
  },
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
  arquivos: [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      titulo: 'Mapa de demanda do atendimento',
      descricao: 'Consolidado final após a revisão da diretora de operações.',
      nomeOriginal: 'mapa-demanda-aurora-v2.pdf',
      mimeType: 'application/pdf',
      tamanhoBytes: 1840000,
      versao: 2,
      publicadoEm: '2026-08-09T13:00:00.000Z',
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      titulo: 'Matriz de limites da IA',
      descricao: 'Regras validadas para transferência segura à recepção.',
      nomeOriginal: 'matriz-limites.pdf',
      mimeType: 'application/pdf',
      tamanhoBytes: 920000,
      versao: 1,
      publicadoEm: '2026-08-09T13:30:00.000Z',
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5',
      tarefaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
      titulo: 'Manual da operação e indicadores',
      descricao: 'Rotina final, responsáveis e agenda da primeira revisão.',
      nomeOriginal: 'manual-operacao-aurora.pdf',
      mimeType: 'application/pdf',
      tamanhoBytes: 2240000,
      versao: 1,
      publicadoEm: '2026-08-10T16:40:00.000Z',
    },
  ],
  tarefas: [
    tarefa({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      faseId: 'entender',
      faseTitulo: 'Entender',
      titulo: 'Medir a demanda real',
      entregavel: 'Mapa de demanda do atendimento.',
      ordem: 1,
      status: 'concluida',
      clienteStatus: 'aprovada',
      clienteNota:
        'Mapeamos os horários de pico e os dez assuntos que concentram 82% das conversas.',
      entregavelUrl: 'https://example.com/mapa-demanda',
      solicitadoEm: '2026-08-07T14:00:00.000Z',
      respondidoEm: '2026-08-08T10:00:00.000Z',
    }),
    tarefa({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      faseId: 'entender',
      faseTitulo: 'Entender',
      titulo: 'Definir os limites da IA',
      entregavel: 'Matriz de limites e escalonamento.',
      ordem: 2,
      status: 'concluida',
      clienteStatus: 'aprovada',
      clienteNota:
        'A matriz separa o que a IA pode responder e os cenários que precisam da recepção.',
      entregavelUrl: 'https://example.com/matriz-limites',
      solicitadoEm: '2026-08-09T09:00:00.000Z',
      respondidoEm: '2026-08-09T11:00:00.000Z',
    }),
    tarefa({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      faseId: 'preparar',
      faseTitulo: 'Preparar',
      titulo: 'Montar a base aprovada',
      entregavel: 'Base de conhecimento versionada.',
      ordem: 1001,
      status: 'concluida',
      clienteStatus: 'nao_solicitada',
    }),
    tarefa({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      faseId: 'preparar',
      faseTitulo: 'Preparar',
      titulo: 'Configurar o canal oficial',
      entregavel: 'Canal de teste conectado.',
      ordem: 1002,
      status: 'concluida',
      clienteStatus: 'nao_solicitada',
    }),
    tarefa({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
      faseId: 'construir',
      faseTitulo: 'Construir',
      titulo: 'Construir o agente e o handoff',
      entregavel: 'Agente com handoff humano.',
      ordem: 2001,
      status: 'concluida',
      clienteStatus: 'nao_solicitada',
    }),
    tarefa({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6',
      faseId: 'validar',
      faseTitulo: 'Validar',
      titulo: 'Rodar vinte cenários',
      entregavel: 'Relatório de testes com evidências.',
      ordem: 3001,
      status: 'concluida',
      clienteStatus: 'nao_solicitada',
    }),
    tarefa({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7',
      faseId: 'entregar',
      faseTitulo: 'Entregar',
      titulo: 'Entregar operação e indicadores',
      entregavel: 'Manual e agenda de acompanhamento.',
      ordem: 4001,
      status: 'concluida',
      clienteStatus: 'aprovada',
      clienteNota:
        'A operação está ativa, a equipe foi treinada e os indicadores de acompanhamento estão organizados neste portal.',
      entregavelUrl: 'https://example.com/entrega-final',
      solicitadoEm: '2026-08-10T12:00:00.000Z',
      respondidoEm: '2026-08-10T18:20:00.000Z',
    }),
  ],
};

const DEPENDENCIAS_PENDENTES: ProjetoPortalCliente['dependencias'] = [
  {
    id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    titulo: 'Liberar os acessos do WhatsApp Business e da agenda da recepção',
    categoria: 'acesso',
    prazoEm: '2026-08-31T18:00:00-03:00',
    status: 'pendente',
    responsavelNome: 'Camila Rios · Diretora de operações',
  },
  {
    id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
    titulo: 'Validar a matriz de transferência com a recepção',
    categoria: 'dependencia',
    prazoEm: '2026-09-01T18:00:00-03:00',
    status: 'pendente',
    responsavelNome: 'Camila Rios · Diretora de operações',
  },
];

export default async function PreviewPortalClientePage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const estado = (await searchParams).estado;
  const projeto =
    estado === 'pendencias'
      ? {
          ...PROJETO,
          status: 'em_execucao' as const,
          feitas: 2,
          dependencias: DEPENDENCIAS_PENDENTES,
          tarefas: PROJETO.tarefas.map((tarefa, indice) => ({
            ...tarefa,
            status: indice < 2 ? ('concluida' as const) : ('pendente' as const),
            clienteStatus: indice < 2 ? tarefa.clienteStatus : ('nao_solicitada' as const),
            clienteNota: indice < 2 ? tarefa.clienteNota : null,
            entregavelUrl: indice < 2 ? tarefa.entregavelUrl : null,
          })),
        }
      : estado === 'escopo'
        ? {
            ...PROJETO,
            status: 'em_execucao' as const,
            feitas: 4,
            mudancasEscopo: [
              {
                id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
                titulo: 'Incluir atendimento pelo Instagram',
                descricao:
                  'Queremos usar a mesma triagem também nas mensagens que chegam pelo Instagram da clínica.',
                solicitadoPor: 'cliente' as const,
                status: 'aguardando_cliente' as const,
                classificacao: 'fora_escopo' as const,
                resposta:
                  'Para incluir o Instagram, precisamos configurar um novo canal, adaptar a triagem e validar o handoff com a recepção.',
                impactoPrazoDias: 4,
                impactoValorCentavos: 240000,
                criadoEm: '2026-08-30T13:40:00.000Z',
                analisadoEm: '2026-08-30T14:20:00.000Z',
                decididoEm: null,
              },
            ],
          }
        : PROJETO;

  return <PortalProjeto codigo={CODIGO} projeto={projeto} />;
}
