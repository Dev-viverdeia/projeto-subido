import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import {
  PERIODOS_METRICAS,
  type ContagemComercial,
  type MetricasComerciais,
} from '@/lib/metricas/modelo';
import styles from '../pagina.module.css';

const NUMERO = new Intl.NumberFormat('pt-BR');
const MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const ETAPAS: { id: keyof ContagemComercial; rotulo: string }[] = [
  { id: 'prospeccoes', rotulo: 'Empresas encontradas' },
  { id: 'abordagens', rotulo: 'Abordagens' },
  { id: 'oportunidades', rotulo: 'Oportunidades' },
  { id: 'propostas', rotulo: 'Propostas enviadas' },
  { id: 'ganhos', rotulo: 'Vendas ganhas' },
];
const INDICADORES = [...ETAPAS, { id: 'perdas' as const, rotulo: 'Vendas perdidas' }];

function comparacao(atual: number, anterior: number): string {
  if (anterior === 0) return atual === 0 ? 'Sem movimento' : 'Sem base anterior';
  const variacao = Math.round(((atual - anterior) / anterior) * 100);
  return variacao === 0 ? 'Sem mudança' : `${variacao > 0 ? '+' : ''}${variacao}%`;
}
function percentual(valor: number | null): string {
  return valor === null ? 'Sem base' : `${valor}%`;
}

export function PainelMetricas({ metricas }: { metricas: MetricasComerciais }) {
  // Escala comum de volumes, não uma coorte: entradas manuais podem superar
  // as abordagens. Zero permanece sem preenchimento, sem largura decorativa.
  const maiorVolume = Math.max(1, ...ETAPAS.map(({ id }) => metricas.funil[id]));
  const anterior = metricas.periodoAnterior;
  const relacoes = [
    ['Abordagens / empresas encontradas', metricas.taxas.abordagem],
    ['Oportunidades / abordagens', metricas.taxas.oportunidade],
    ['Propostas / oportunidades', metricas.taxas.proposta],
    ['Ganhos / empresas encontradas', metricas.taxas.total],
  ] as const;

  return (
    <div className={styles.pagina}>
      <header className={styles.hero}>
        <h1>Métricas</h1>
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

      <div className={styles.principal}>
        <section
          className={styles.funil}
          aria-labelledby="funil-titulo"
          aria-describedby="funil-nota"
        >
          <header className={styles.topoSecao}>
            <h2 id="funil-titulo">Funil de vendas</h2>
            <span>{metricas.rotuloPeriodo}</span>
          </header>
          <ol className={styles.etapas}>
            {ETAPAS.map(({ id, rotulo }) => (
              <li key={id} data-indicador={id}>
                <div>
                  <span>{rotulo}</span>
                  <strong>{NUMERO.format(metricas.funil[id])}</strong>
                </div>
                <div className={styles.trilho} aria-hidden="true">
                  <span
                    style={
                      {
                        '--volume': `${(metricas.funil[id] / maiorVolume) * 100}%`,
                      } as CSSProperties
                    }
                  />
                </div>
              </li>
            ))}
          </ol>
          <p className={styles.nota} id="funil-nota">
            Volumes do período, não etapas das mesmas empresas.
          </p>
          <dl className={styles.resultados}>
            <div>
              <dt>Vendas perdidas</dt>
              <dd>{NUMERO.format(metricas.funil.perdas)}</dd>
            </div>
            <div>
              <dt>Ganhos entre decisões</dt>
              <dd>{percentual(metricas.taxas.fechamento)}</dd>
            </div>
          </dl>
        </section>

        <div className={styles.acompanhamento}>
          <section className={styles.diagnostico} aria-labelledby="diagnostico-titulo">
            <span className={styles.rotulo}>Próximo passo</span>
            <h2 id="diagnostico-titulo">{metricas.diagnostico.titulo}</h2>
            <p>{metricas.diagnostico.descricao}</p>
            <Link href={metricas.diagnostico.acao.href} className={styles.acaoDiagnostico}>
              {metricas.diagnostico.acao.rotulo}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            {metricas.diagnostico.observacoes.length > 0 && (
              <details className={styles.motivo}>
                <summary>
                  Por que este passo?
                  <ChevronDown size={17} aria-hidden="true" />
                </summary>
                <ul>
                  {metricas.diagnostico.observacoes.map((observacao) => (
                    <li key={observacao}>{observacao}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>
          <section className={styles.saude} aria-label="Vendas em aberto">
            <dl>
              <div>
                <dt>Valor em aberto</dt>
                <dd>{MOEDA.format(metricas.saude.valorPipelineCentavos / 100)}</dd>
              </div>
              <div>
                <dt>Sem próxima ação</dt>
                <dd>{NUMERO.format(metricas.saude.semProximaAcao)}</dd>
              </div>
              <div>
                <dt>Aguardando resposta</dt>
                <dd>{NUMERO.format(metricas.saude.propostasAguardando)}</dd>
              </div>
              <div>
                <dt>Reuniões no período</dt>
                <dd>
                  {NUMERO.format(metricas.saude.callsConcluidas)} <small>concluídas</small>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <details className={styles.detalhes}>
        <summary>
          Comparações e taxas
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <div className={styles.detalhesCorpo}>
          {anterior ? (
            <table className={styles.comparacoes}>
              <caption>Comparação com o período anterior</caption>
              <thead>
                <tr>
                  <th scope="col">Indicador</th>
                  <th scope="col">Anterior</th>
                  <th scope="col">Atual</th>
                  <th scope="col">Variação</th>
                </tr>
              </thead>
              <tbody>
                {INDICADORES.map(({ id, rotulo }) => (
                  <tr key={id}>
                    <th scope="row">{rotulo}</th>
                    <td>{NUMERO.format(anterior[id])}</td>
                    <td>{NUMERO.format(metricas.funil[id])}</td>
                    <td>{comparacao(metricas.funil[id], anterior[id])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.nota}>
              Todo o histórico selecionado. Não há período anterior para comparar.
            </p>
          )}
          <h3>Relações entre volumes</h3>
          <p className={styles.nota}>
            Podem superar 100%: cada registro entra pela data da sua atividade, sem acompanhar um
            mesmo grupo de empresas.
          </p>
          <dl className={styles.relacoes}>
            {relacoes.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt>{rotulo}</dt>
                <dd>{percentual(valor)}</dd>
              </div>
            ))}
          </dl>
          <dl className={styles.relacoes}>
            <div>
              <dt>Ticket médio ganho</dt>
              <dd>
                {metricas.saude.ticketMedioGanhoCentavos === null
                  ? 'Sem base'
                  : MOEDA.format(metricas.saude.ticketMedioGanhoCentavos / 100)}
              </dd>
            </div>
          </dl>
        </div>
      </details>
      <details className={styles.detalhes}>
        <summary>
          Motivos de perda
          <span className={styles.contagem}>{NUMERO.format(metricas.funil.perdas)}</span>
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <div className={styles.detalhesCorpo}>
          {metricas.perdasPorMotivo.length ? (
            <ul className={styles.motivosPerda}>
              {metricas.perdasPorMotivo.map((item) => (
                <li key={item.motivo}>
                  <span>{item.motivo}</span>
                  <strong>{NUMERO.format(item.quantidade)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.nota}>Nenhuma perda registrada neste período.</p>
          )}
        </div>
      </details>
    </div>
  );
}
