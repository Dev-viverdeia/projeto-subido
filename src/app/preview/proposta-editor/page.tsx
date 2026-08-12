import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Bot, ContactRound, FileSignature, House, Video } from 'lucide-react';
import { EditorProposta } from '@/app/(app)/propostas/_components/EditorProposta';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { DocumentoProposta } from '@/lib/propostas/schema';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Editor de proposta' };

const DOCUMENTO: DocumentoProposta = {
  cliente: {
    empresa: 'Clínica Aurora',
    contato: 'Camila Rios',
    cargo: 'Diretora de operações',
    email: 'camila@clinicaaurora.com.br',
  },
  projeto: {
    titulo: 'Atendimento inteligente para clínicas',
    resumo: 'Uma operação de atendimento contínua, organizada e mensurável no WhatsApp.',
    origem: 'catalogo',
  },
  desafio:
    'A clínica perde conversas fora do horário comercial e a recepção repete a mesma triagem antes de cada agendamento.',
  objetivo:
    'Responder novos contatos em poucos segundos, organizar a triagem e entregar cada oportunidade pronta para a recepção.',
  escopo: [
    {
      titulo: 'Mapeamento do atendimento',
      descricao: 'Leitura das conversas atuais, regras de triagem e critérios de encaminhamento.',
    },
    {
      titulo: 'Agente de atendimento',
      descricao: 'Configuração do fluxo, base de conhecimento, testes e publicação assistida.',
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
      descricao: 'Mapeamento das regras, mensagens e exceções do atendimento.',
    },
    {
      fase: 'Implementação e validação',
      duracao: '2 semanas',
      descricao: 'Construção, testes com a equipe e publicação controlada.',
    },
  ],
  investimento: {
    valorCentavos: 1850000,
    condicoes: '50% no início e 50% após a validação da operação.',
  },
  validadeDias: 10,
  proximosPassos: ['Aprovação da proposta', 'Call de kick-off', 'Liberação dos acessos'],
  observacoes: 'Mensalidades das ferramentas contratadas pela clínica não estão inclusas.',
};

export default function PreviewEditorPropostaPage() {
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
          <a className={styles.ativo} href="#conteudo">
            <FileSignature size={18} strokeWidth={1.7} aria-hidden="true" /> Propostas
          </a>
          <span>
            <Bot size={18} strokeWidth={1.7} aria-hidden="true" /> Sobral AI
          </span>
        </nav>
      </aside>

      <main id="conteudo" className={styles.conteudo}>
        <EditorProposta
          id="11111111-1111-4111-8111-111111111111"
          tituloInicial="Automação do atendimento da Clínica Aurora"
          documentoInicial={DOCUMENTO}
          statusInicial="apresentada"
          versaoInicial={2}
          oportunidadeId="22222222-2222-4222-8222-222222222222"
          execucaoId={null}
        />
      </main>
    </div>
  );
}
