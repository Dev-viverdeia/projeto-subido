import type { ComponentProps } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BriefcaseBusiness, Coins, ContactRound, GraduationCap, House, Search } from 'lucide-react';
import { FormularioBusca } from '@/app/(app)/prospeccao/_components/FormularioBusca';
import { ListaResultados } from '@/app/(app)/prospeccao/_components/ListaResultados';
import pagina from '@/app/(app)/prospeccao/pagina.module.css';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import styles from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Prospecção' };

const LEADS: ComponentProps<typeof ListaResultados>['leads'] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    nome: 'Clínica Aurora',
    categoria: 'Clínica odontológica',
    endereco: 'Av. do Contorno, 1850 · Belo Horizonte, MG',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    site_url: 'https://example.com',
    telefone: '+55 31 3333-4444',
    avaliacao: 4.8,
    total_avaliacoes: 127,
    descricao:
      'Clínica com atendimento multicanal, agendamento online e presença ativa no WhatsApp.',
    fontes: ['Google Maps · dados públicos'],
    crm_oportunidade_id: null,
    enviado_crm_em: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    nome: 'Odonto Savassi',
    categoria: 'Dentista',
    endereco: 'Rua Pernambuco, 920 · Belo Horizonte, MG',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    site_url: 'https://example.org',
    telefone: '+55 31 3222-7788',
    avaliacao: 4.6,
    total_avaliacoes: 89,
    descricao: 'Atendimento odontológico com agendamento por telefone e formulário no site.',
    fontes: ['Google Maps · dados públicos'],
    crm_oportunidade_id: '33333333-3333-4333-8333-333333333333',
    enviado_crm_em: new Date().toISOString(),
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    nome: 'Centro Oral Minas',
    categoria: 'Clínica odontológica',
    endereco: 'Rua da Bahia, 1440 · Belo Horizonte, MG',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    site_url: null,
    telefone: '+55 31 3000-1010',
    avaliacao: 4.4,
    total_avaliacoes: 52,
    descricao: null,
    fontes: ['Google Maps · dados públicos'],
    crm_oportunidade_id: null,
    enviado_crm_em: null,
  },
];

export default function PreviewProspeccaoPage() {
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
            <GraduationCap size={18} strokeWidth={1.7} aria-hidden="true" /> Formações
          </span>
          <span>
            <BriefcaseBusiness size={18} strokeWidth={1.7} aria-hidden="true" /> Projetos
          </span>
          <a className={styles.ativo} href="#conteudo">
            <Search size={18} strokeWidth={1.7} aria-hidden="true" /> Prospecção
          </a>
          <span>
            <ContactRound size={18} strokeWidth={1.7} aria-hidden="true" /> CRM
          </span>
        </nav>
      </aside>

      <main id="conteudo" className={styles.conteudo}>
        <div className={pagina.pagina}>
          <header className={pagina.cabecalho}>
            <div>
              <p className={pagina.sobretitulo}>Prospecção</p>
              <h1>Encontre empresas. Escolha quais viram oportunidade.</h1>
              <p>
                Busque por tipo e região, confira os dados e envie apenas os melhores leads para o
                CRM.
              </p>
            </div>
            <div className={pagina.saldo}>
              <Coins size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>
                Saldo disponível
                <strong>42</strong>
              </span>
              <small>1 empresa encontrada = 1 crédito</small>
            </div>
          </header>

          <FormularioBusca saldo={42} pronto />

          <section className={pagina.areaListas} aria-labelledby="preview-listas-titulo">
            <aside className={pagina.historico}>
              <div className={pagina.historicoTopo}>
                <div>
                  <p className={pagina.sobretitulo}>Suas buscas</p>
                  <h2 id="preview-listas-titulo">Listas</h2>
                </div>
                <span>2</span>
              </div>
              <nav aria-label="Listas de prospecção">
                <a href="#resultados" aria-current="page">
                  <span>
                    <strong>Clínicas odontológicas</strong>
                    <small>Belo Horizonte, MG</small>
                  </span>
                  <span>
                    <small>17 ago.</small>
                    <em data-status="concluida">Concluída</em>
                  </span>
                </a>
                <a href="#resultados">
                  <span>
                    <strong>Imobiliárias</strong>
                    <small>Campinas, SP</small>
                  </span>
                  <span>
                    <small>15 ago.</small>
                    <em data-status="concluida">Concluída</em>
                  </span>
                </a>
              </nav>
            </aside>

            <div className={pagina.resultados} id="resultados">
              <header className={pagina.resultadosTopo}>
                <div>
                  <p className={pagina.sobretitulo}>Lista selecionada</p>
                  <h2>Clínicas odontológicas</h2>
                  <span>Belo Horizonte, MG</span>
                </div>
                <div className={pagina.metricasLista}>
                  <span>
                    <strong>3</strong>
                    encontradas
                  </span>
                  <span>
                    <strong>10</strong>
                    solicitados
                  </span>
                </div>
              </header>
              <ListaResultados leads={LEADS} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
