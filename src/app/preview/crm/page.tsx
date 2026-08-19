import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Bot,
  BriefcaseBusiness,
  ContactRound,
  GraduationCap,
  House,
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
    ganhaEm: null,
    perdidaEm: null,
    motivoPerda: null,
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
    ganhaEm: null,
    perdidaEm: null,
    motivoPerda: null,
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
    ganhaEm: null,
    perdidaEm: null,
    motivoPerda: null,
    ultimoFato: 'Etapa do pipeline alterada',
    ultimoFatoEm: AGORA,
    atualizadoEm: AGORA,
    criadoEm: AGORA,
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    titulo: 'Assistente de follow-up',
    etapa: 'ganho',
    empresaId: '11111111-aaaa-4aaa-8aaa-111111111111',
    empresa: 'Norte Seguros',
    dominio: 'norteseguros.com.br',
    enriquecidoEm: AGORA,
    enriquecimentoStatus: 'concluido',
    contatoId: '22222222-bbbb-4bbb-8bbb-222222222222',
    contato: 'Paulo Nunes',
    contatoEmail: 'paulo@exemplo.com',
    valorCentavos: 850000,
    proximaAcao: null,
    proximaAcaoEm: null,
    ganhaEm: AGORA,
    perdidaEm: null,
    motivoPerda: null,
    ultimoFato: 'Oportunidade marcada como ganha',
    ultimoFatoEm: AGORA,
    atualizadoEm: AGORA,
    criadoEm: AGORA,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    titulo: 'Automação de agendamento',
    etapa: 'perdido',
    empresaId: '33333333-aaaa-4aaa-8aaa-333333333333',
    empresa: 'Studio Forma',
    dominio: null,
    enriquecidoEm: null,
    enriquecimentoStatus: null,
    contatoId: '44444444-bbbb-4bbb-8bbb-444444444444',
    contato: 'Ana Costa',
    contatoEmail: 'ana@exemplo.com',
    valorCentavos: null,
    proximaAcao: null,
    proximaAcaoEm: null,
    ganhaEm: null,
    perdidaEm: AGORA,
    motivoPerda: 'momento_inadequado',
    ultimoFato: 'Oportunidade marcada como perdida',
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
            <div className={pagina.linhaTopo}>
              <div className={pagina.introducao}>
                <p className={pagina.sobretitulo}>Sua operação comercial</p>
                <h1>Oportunidades</h1>
                <p>Um método simples para vender projetos de IA com a próxima ação clara.</p>
              </div>
              <FormularioNovoLead abertoInicial={parametros.modal === '1'} />
            </div>
          </header>

          <section className={pagina.quadro} aria-labelledby="preview-pipeline-titulo">
            <h2 id="preview-pipeline-titulo" className={pagina.tituloOculto}>
              Pipeline de oportunidades
            </h2>
            <PipelineCrm oportunidades={OPORTUNIDADES} />
          </section>
        </div>
      </main>
    </div>
  );
}
