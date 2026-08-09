import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Bot,
  BriefcaseBusiness,
  ContactRound,
  FileSignature,
  FolderKanban,
  House,
  Video,
} from 'lucide-react';
import { SalaEntrega } from '@/app/(app)/solucoes/_components/SalaEntrega';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ProjetoExecucaoCompleto } from '@/lib/projetos-execucao/queries';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Sala de Entrega' };

const PROJETO: ProjetoExecucaoCompleto = {
  id: '11111111-1111-4111-8111-111111111111',
  propostaId: '22222222-2222-4222-8222-222222222222',
  oportunidadeId: '33333333-3333-4333-8333-333333333333',
  titulo: 'Atendimento inteligente para clínicas',
  empresa: 'Clínica Aurora',
  status: 'em_execucao',
  inicioEm: '2026-08-05T12:00:00.000Z',
  prazoEm: '2026-08-28T12:00:00.000Z',
  atualizadoEm: '2026-08-09T12:00:00.000Z',
  feitas: 2,
  total: 7,
  proximaTarefa: 'Montar a base aprovada',
  portalAtivo: true,
  portalCodigo: '44444444-4444-4444-8444-444444444444',
  portalAtivadoEm: '2026-08-09T12:00:00.000Z',
  documento: {
    cliente: {
      empresa: 'Clínica Aurora',
      contato: 'Camila Rios',
      cargo: 'Diretora de operações',
      email: 'camila@clinicaaurora.com.br',
    },
    projeto: {
      titulo: 'Atendimento inteligente para clínicas',
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
      clienteStatus: 'aguardando',
      clienteNota:
        'A matriz separa o que a IA pode responder e os cenários que precisam da recepção.',
      entregavelUrl: 'https://example.com/matriz-limites',
      clienteSolicitadoEm: '2026-08-09T09:00:00.000Z',
      clienteRespondidoEm: null,
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
      status: 'em_andamento',
      evidencia: 'Documento em revisão: drive.google.com/base-aurora',
      evidenciaEm: '2026-08-09T12:00:00.000Z',
      concluidaEm: null,
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
      status: 'pendente',
      evidencia: null,
      evidenciaEm: null,
      concluidaEm: null,
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
      status: 'pendente',
      evidencia: null,
      evidenciaEm: null,
      concluidaEm: null,
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
      status: 'pendente',
      evidencia: null,
      evidenciaEm: null,
      concluidaEm: null,
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
      status: 'pendente',
      evidencia: null,
      evidenciaEm: null,
      concluidaEm: null,
      clienteStatus: 'nao_solicitada',
      clienteNota: null,
      entregavelUrl: null,
      clienteSolicitadoEm: null,
      clienteRespondidoEm: null,
      clienteComentario: null,
    },
  ],
};

export default function PreviewSalaEntregaPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <SubidoLogo size={18} />
        </div>
        <nav aria-label="Preview da navegação">
          <span>
            <House size={18} strokeWidth={1.7} aria-hidden="true" /> Início
          </span>
          <span>
            <ContactRound size={18} strokeWidth={1.7} aria-hidden="true" /> CRM
          </span>
          <span>
            <Video size={18} strokeWidth={1.7} aria-hidden="true" /> Calls
          </span>
          <span>
            <FileSignature size={18} strokeWidth={1.7} aria-hidden="true" /> Propostas
          </span>
          <a className={styles.ativo} href="#conteudo">
            <BriefcaseBusiness size={18} strokeWidth={1.7} aria-hidden="true" /> Projetos
          </a>
          <span>
            <FolderKanban size={18} strokeWidth={1.7} aria-hidden="true" /> Estúdio
          </span>
          <span>
            <Bot size={18} strokeWidth={1.7} aria-hidden="true" /> Sobral AI
          </span>
        </nav>
      </aside>

      <main id="conteudo" className={styles.conteudo}>
        <SalaEntrega projeto={PROJETO} />
      </main>
    </div>
  );
}
