import Link from 'next/link';
import {
  ArrowRight,
  CalendarCheck2,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileClock,
  ListTodo,
  Target,
} from 'lucide-react';
import {
  PERIODOS_METRICAS,
  ROTULO_PERIODO,
  type ContagemComercial,
  type MetricasComerciais,
} from '@/lib/metricas/modelo';
import styles from '../pagina.module.css';

const FORMATADOR_NUMERO = new Intl.NumberFormat('pt-BR');
const FORMATADOR_MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

type ChaveContagem = keyof ContagemComercial;

const INDICADORES: Array<{
  id: ChaveContagem;
  rotulo: string;
  detalhe: string;
}> = [
  { id: 'prospeccoes', rotulo: 'Prospecções', detalhe: 'empresas encontradas' },
  { id: 'abordagens', rotulo: 'Abordagens', detalhe: 'empresas contatadas' },
  { id: 'oportunidades', rotulo: 'Oportunidades', detalhe: 'vendas abertas no CRM' },
  { id: 'propostas', rotulo: 'Propostas', detalhe: 'enviadas ao cliente' },
  { id: 'ganhos', rotulo: 'Ganhos', detalhe: 'vendas concluídas' },
  { id: 'perdas', rotulo: 'Perdas', detalhe: 'vendas encerradas' },
];

function numero(valor: number): string {
  return FORMATADOR_NUMERO.format(valor);
}

function moeda(valorCentavos: number): string {
  return FORMATADOR_MOEDA.format(valorCentavos / 100);
}

function comparacao(atual: number, anterior: number | undefined): string {
  if (anterior === undefined) return 'desde o primeiro registro';
  if (anterior === 0 && atual === 0) return 'sem atividade no período';
  if (anterior === 0) return 'novo neste período';

  const variacao = Math.round(((atual - anterior) / anterior) * 100);
  if (variacao === 0) return 'mesmo volume anterior';
  return `${variacao > 0 ? '+' : ''}${variacao}% vs. período anterior`;
}

function taxa(valor: number | null, complemento: string): string {
  return valor === null ? 'sem base para calcular' : `${valor}% ${complemento}`;
}

export function PainelMetricas({ metricas }: { metricas: MetricasComerciais }) {
  const maximoAtividade = Math.max(1, ...INDICADORES.map((item) => metricas.funil[item.id]));
  const etapasFunil = [
    {
      id: 'prospeccoes' as const,
      numero: '01',
      rotulo: 'Empresas encontradas',
      conversao: 'base do período',
    },
    {
      id: 'abordagens' as const,
      numero: '02',
      rotulo: 'Empresas abordadas',
      conversao: taxa(metricas.taxas.abordagem, 'da lista'),
    },
    {
      id: 'oportunidades' as const,
      numero: '03',
      rotulo: 'Oportunidades',
      conversao: taxa(metricas.taxas.oportunidade, 'das abordagens'),
    },
    {
      id: 'propostas' as const,
      numero: '04',
      rotulo: 'Propostas enviadas',
      conversao: taxa(metricas.taxas.proposta, 'das oportunidades'),
    },
    {
      id: 'ganhos' as const,
      numero: '05',
      rotulo: 'Vendas ganhas',
      conversao: taxa(metricas.taxas.fechamento, 'das decisões'),
    },
  ];

  return (
    <div className={styles.pagina}>
      <header className={styles.hero}>
        <div className={styles.heroMarca} aria-hidden="true">
          <ChartNoAxesCombined size={24} strokeWidth={1.6} />
        </div>
        <div className={styles.heroTexto}>
          <p className={styles.sobretitulo}>Diagnóstico comercial</p>
          <h1>Métricas</h1>
          <p>Veja onde suas vendas avançam e qual etapa precisa de atenção agora.</p>
        </div>

        <nav className={styles.periodos} aria-label="Período das métricas">
          {PERIODOS_METRICAS.map((periodo) => (
            <Link
              href={periodo === '30d' ? '/metricas' : `/metricas?periodo=${periodo}`}
              aria-current={metricas.periodo === periodo ? 'page' : undefined}
              key={periodo}
            >
              {periodo === '30d' ? '30 dias' : periodo === '90d' ? '90 dias' : 'Tudo'}
            </Link>
          ))}
        </nav>
      </header>

      <section className={styles.resumo} aria-label={`Resumo de ${metricas.rotuloPeriodo}`}>
        {INDICADORES.map((indicador) => {
          const valor = metricas.funil[indicador.id];
          const anterior = metricas.periodoAnterior?.[indicador.id];
          return (
            <article key={indicador.id} data-indicador={indicador.id}>
              <span>{indicador.rotulo}</span>
              <strong>{numero(valor)}</strong>
              <small>{indicador.detalhe}</small>
              <em>{comparacao(valor, anterior)}</em>
            </article>
          );
        })}
      </section>

      <section className={styles.funil} data-on-dark aria-labelledby="funil-titulo">
        <header className={styles.funilTopo}>
          <div>
            <p className={styles.sobretituloEscuro}>Funil de vendas</p>
            <h2 id="funil-titulo">Da lista ao cliente.</h2>
            <p>Uma leitura simples do método comercial, sem misturar rascunhos com propostas.</p>
          </div>
          <span>{metricas.rotuloPeriodo}</span>
        </header>

        <ol className={styles.etapasFunil}>
          {etapasFunil.map((etapa) => (
            <li key={etapa.id}>
              <span className={styles.numeroEtapa}>{etapa.numero}</span>
              <strong>{numero(metricas.funil[etapa.id])}</strong>
              <h3>{etapa.rotulo}</h3>
              <small>{etapa.conversao}</small>
            </li>
          ))}
        </ol>

        <footer className={styles.funilRodape}>
          <div>
            <span>Conversão total</span>
            <strong>
              {metricas.taxas.total === null ? 'Sem base' : `${metricas.taxas.total}%`}
            </strong>
            <small>das empresas encontradas até a venda</small>
          </div>
          <div>
            <span>Vendas perdidas</span>
            <strong>{numero(metricas.funil.perdas)}</strong>
            <small>saídas registradas no período</small>
          </div>
        </footer>
      </section>

      <div className={styles.gradeDiagnostico}>
        <section className={styles.diagnostico} aria-labelledby="diagnostico-titulo">
          <div className={styles.diagnosticoCabecalho}>
            <span className={styles.alvo} aria-hidden="true">
              <Target size={21} strokeWidth={1.7} />
            </span>
            <div>
              <p className={styles.sobretitulo}>Leitura para consultoria</p>
              <h2 id="diagnostico-titulo">{metricas.diagnostico.titulo}</h2>
            </div>
          </div>
          <p className={styles.diagnosticoDescricao}>{metricas.diagnostico.descricao}</p>
          <ul>
            {metricas.diagnostico.observacoes.map((observacao) => (
              <li key={observacao}>{observacao}</li>
            ))}
          </ul>
          <Link href={metricas.diagnostico.acao.href} className={styles.acaoDiagnostico}>
            {metricas.diagnostico.acao.rotulo}
            <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
          </Link>
        </section>

        <section className={styles.saude} aria-labelledby="saude-titulo">
          <header>
            <p className={styles.sobretitulo}>Agora</p>
            <h2 id="saude-titulo">Saúde do pipeline</h2>
          </header>
          <div className={styles.saudeGrade}>
            <article>
              <CircleDollarSign size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>Valor em aberto</span>
              <strong>{moeda(metricas.saude.valorPipelineCentavos)}</strong>
            </article>
            <article>
              <ListTodo size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>Sem próxima ação</span>
              <strong>{numero(metricas.saude.semProximaAcao)}</strong>
            </article>
            <article>
              <FileClock size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>Aguardando resposta</span>
              <strong>{numero(metricas.saude.propostasAguardando)}</strong>
            </article>
            <article>
              <CalendarCheck2 size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>Reuniões concluídas</span>
              <strong>{numero(metricas.saude.callsConcluidas)}</strong>
            </article>
          </div>
          <footer>
            <span>Ticket médio ganho</span>
            <strong>
              {metricas.saude.ticketMedioGanhoCentavos === null
                ? 'Ainda sem base'
                : moeda(metricas.saude.ticketMedioGanhoCentavos)}
            </strong>
          </footer>
        </section>
      </div>

      <div className={styles.gradeDetalhes}>
        <section className={styles.atividade} aria-labelledby="atividade-titulo">
          <header>
            <div>
              <p className={styles.sobretitulo}>Volume do período</p>
              <h2 id="atividade-titulo">Atividade comercial</h2>
            </div>
            <span>{ROTULO_PERIODO[metricas.periodo]}</span>
          </header>
          <div className={styles.barras}>
            {INDICADORES.map((indicador) => {
              const valor = metricas.funil[indicador.id];
              return (
                <div className={styles.barra} key={indicador.id}>
                  <div>
                    <span>{indicador.rotulo}</span>
                    <strong>{numero(valor)}</strong>
                  </div>
                  <progress max={maximoAtividade} value={valor} aria-label={indicador.rotulo} />
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.perdas} aria-labelledby="perdas-titulo">
          <header>
            <p className={styles.sobretitulo}>Aprendizado comercial</p>
            <h2 id="perdas-titulo">Motivos de perda</h2>
          </header>
          {metricas.perdasPorMotivo.length ? (
            <ol>
              {metricas.perdasPorMotivo.map((item) => (
                <li key={item.motivo}>
                  <span>{item.motivo}</span>
                  <strong>{numero(item.quantidade)}</strong>
                  <progress
                    max={Math.max(1, metricas.funil.perdas)}
                    value={item.quantidade}
                    aria-label={`${item.motivo}: ${item.quantidade}`}
                  />
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.semPerdas}>
              <strong>Nenhuma perda registrada.</strong>
              <p>Quando uma venda for encerrada, registre o motivo para orientar a consultoria.</p>
            </div>
          )}
          <p className={styles.notaPerdas}>
            Motivos bem registrados ajudam a revisar qualificação, proposta e follow-up.
          </p>
        </section>
      </div>
    </div>
  );
}
