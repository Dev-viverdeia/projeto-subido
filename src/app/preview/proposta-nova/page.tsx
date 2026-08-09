import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Bot, ContactRound, FileSignature, House, Video } from 'lucide-react';
import { MontadorProposta } from '@/app/(app)/propostas/nova/_components/MontadorProposta';
import pagina from '@/app/(app)/propostas/nova/pagina.module.css';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { OpcoesNovaProposta } from '@/lib/propostas/queries';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Nova proposta' };

const AGORA = '2026-08-08T18:00:00.000Z';
const OPCOES: OpcoesNovaProposta = {
  oportunidades: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      titulo: 'Automação do atendimento',
      etapa: 'descoberta',
      empresa: 'Clínica Aurora',
      dominio: 'clinicaaurora.com.br',
      contato: 'Camila Rios',
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      titulo: 'Agente de qualificação de leads',
      etapa: 'proposta',
      empresa: 'Moura Imóveis',
      dominio: 'mouraimoveis.com.br',
      contato: 'Lucas Moura',
    },
  ],
  projetos: [],
  projetosEstudio: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      titulo: 'Atendimento inteligente para clínicas',
      ideiaOriginal: 'Triagem e agendamento conectados ao WhatsApp.',
      status: 'pronta',
      criadoEm: AGORA,
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      titulo: 'Qualificação de leads imobiliários',
      ideiaOriginal: 'Priorizar leads e orientar o primeiro contato comercial.',
      status: 'pronta',
      criadoEm: AGORA,
    },
  ],
};

export default function PreviewNovaPropostaPage() {
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
        <div className={pagina.pagina}>
          <header className={pagina.hero}>
            <div>
              <p className={pagina.sobretitulo}>Novo documento</p>
              <h1>Conecte o contexto ao que você vai entregar.</h1>
            </div>
            <p>
              A plataforma usa os fatos do CRM e a estrutura do Projeto para preparar o primeiro
              rascunho. Você continua no controle de cada palavra.
            </p>
          </header>
          <MontadorProposta
            opcoes={OPCOES}
            oportunidadeInicial=""
            origemInicial=""
            reuniaoInicial="55555555-5555-4555-8555-555555555555"
            diagnosticoInicial=""
            erro={false}
          />
        </div>
      </main>
    </div>
  );
}
