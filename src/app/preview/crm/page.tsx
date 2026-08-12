import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Bot,
  BriefcaseBusiness,
  CircleDollarSign,
  ContactRound,
  GraduationCap,
  House,
  Layers3,
  Radar,
  UsersRound,
} from 'lucide-react';
import { FormularioNovoLead } from '@/app/(app)/crm/_components/FormularioNovoLead';
import { PipelineCrm } from '@/app/(app)/crm/_components/PipelineCrm';
import pagina from '@/app/(app)/crm/pagina.module.css';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { OportunidadeCrm } from '@/lib/crm/queries';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · CRM' };

const AGORA = new Date().toISOString();

/**
 * Fixture exclusivamente visual. A rota devolve 404 em produção; o CRM real
 * nunca recebe estes dados e continua nascendo vazio para cada profissional.
 */
const OPORTUNIDADES: OportunidadeCrm[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Automação do atendimento',
    etapa: 'novo_lead',
    empresaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    empresa: 'Clínica Aurora',
    dominio: 'clinicaaurora.com.br',
    enriquecidoEm: null,
    enriquecimentoStatus: null,
    contatoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    contato: 'Camila Rios',
    contatoEmail: 'camila@exemplo.com',
    valorCentavos: null,
    proximaAcao: null,
    proximaAcaoEm: null,
    ultimoFato: 'Lead adicionado ao CRM',
    ultimoFatoEm: AGORA,
    atualizadoEm: AGORA,
    criadoEm: AGORA,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    titulo: 'Agente de qualificação de leads',
    etapa: 'descoberta',
    empresaId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    empresa: 'Moura Imóveis',
    dominio: 'mouraimoveis.com.br',
    enriquecidoEm: AGORA,
    enriquecimentoStatus: 'concluido',
    contatoId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    contato: 'Lucas Moura',
    contatoEmail: 'lucas@exemplo.com',
    valorCentavos: null,
    proximaAcao: 'Realizar chamada de descoberta',
    proximaAcaoEm: null,
    ultimoFato: 'Etapa do pipeline alterada',
    ultimoFatoEm: AGORA,
    atualizadoEm: AGORA,
    criadoEm: AGORA,
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    titulo: 'Copiloto comercial',
    etapa: 'proposta',
    empresaId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    empresa: 'Orbe Contabilidade',
    dominio: null,
    enriquecidoEm: null,
    enriquecimentoStatus: 'processando',
    contatoId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    contato: 'Marina Freitas',
    contatoEmail: 'marina@exemplo.com',
    valorCentavos: null,
    proximaAcao: 'Apresentar proposta',
    proximaAcaoEm: null,
    ultimoFato: 'Etapa do pipeline alterada',
    ultimoFatoEm: AGORA,
    atualizadoEm: AGORA,
    criadoEm: AGORA,
  },
];

export default async function PreviewCrmPage({ searchParams }: PageProps<'/preview/crm'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;

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
          <a className={styles.ativo} href="#conteudo">
            <ContactRound size={18} strokeWidth={1.7} aria-hidden="true" /> CRM
          </a>
          <span>
            <BriefcaseBusiness size={18} strokeWidth={1.7} aria-hidden="true" /> Projetos
          </span>
          <span>
            <GraduationCap size={18} strokeWidth={1.7} aria-hidden="true" /> Formações
          </span>
          <span>
            <Bot size={18} strokeWidth={1.7} aria-hidden="true" /> Sobral AI
          </span>
          <span>
            <UsersRound size={18} strokeWidth={1.7} aria-hidden="true" /> Mentorias
          </span>
        </nav>
      </aside>

      <main id="conteudo" className={styles.conteudo}>
        <div className={pagina.pagina}>
          <header className={pagina.topo}>
            <div className={pagina.introducao}>
              <p className={pagina.sobretitulo}>Operação comercial</p>
              <h1>Pipeline comercial</h1>
              <p>
                Quatro fases para saber quem precisa de atenção agora — com todo o histórico no
                mesmo lugar.
              </p>
            </div>
            <FormularioNovoLead abertoInicial={parametros.modal === '1'} />
          </header>

          <section className={pagina.resumo} aria-label="Resumo do pipeline">
            <article>
              <span className={pagina.iconeResumo}>
                <Radar size={18} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <strong>3</strong>
                <span>abertas</span>
              </div>
            </article>
            <article>
              <span className={pagina.iconeResumo}>
                <CircleDollarSign size={18} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <strong>1</strong>
                <span>em proposta</span>
              </div>
            </article>
            <article>
              <span className={pagina.iconeResumo}>
                <Layers3 size={18} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <strong>0</strong>
                <span>ganhos</span>
              </div>
            </article>
          </section>

          <section className={pagina.quadro} aria-labelledby="preview-pipeline-titulo">
            <div className={pagina.quadroTopo}>
              <div>
                <h2 id="preview-pipeline-titulo">Pipeline</h2>
                <p>Avance cada oportunidade quando a conversa realmente mudar de fase.</p>
              </div>
              <span>3 no total</span>
            </div>
            <PipelineCrm oportunidades={OPORTUNIDADES} />
          </section>
        </div>
      </main>
    </div>
  );
}
