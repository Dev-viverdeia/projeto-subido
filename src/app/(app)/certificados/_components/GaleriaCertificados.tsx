'use client';

import Link from 'next/link';
import type { FormacaoResumo, SolucaoResumo } from '@/lib/conteudo/queries';
import {
  contarConcluidas,
  contarEtapasFeitas,
  estadoDoProgresso,
  percentual,
  useProgresso,
} from '@/lib/progresso/local';
import { dataCurta } from '../../builder/_components/statusBuilder';
import { Visto } from '../../_components/PillEstado';
import styles from './GaleriaCertificados.module.css';

/**
 * A galeria: certificados CONQUISTADOS como diplomas navy, o que está EM
 * ANDAMENTO como linhas de progresso, e o restante como convite quieto.
 *
 * TUDO DERIVA DO PROGRESSO REAL da conta — inclusive a DATA de
 * conclusão, que é a marcação mais recente entre as aulas/etapas do conteúdo
 * (a conclusão acontece quando a última cai). Nenhum certificado nasce de
 * dado inventado: com o storage limpo, a tela mostra o estado vazio honesto.
 *
 * A EMISSÃO (PDF, código) é pendência declarada no cabeçalho da página — o
 * diploma daqui é o registro, não o arquivo.
 */

type Origem = 'formacao' | 'solucao';

type Conteudo = {
  origem: Origem;
  slug: string;
  titulo: string;
  href: string;
  feitas: number;
  total: number;
  /** ISO da marcação mais recente — a data da conclusão quando concluído. */
  ultimaIso: string | null;
};

type RecomendacaoInicial = {
  indice: string;
  origem: string;
  titulo: string;
  resumo: string;
  meta: string;
  href: string;
  acao: string;
};

const ROTULO_ORIGEM: Record<Origem, string> = {
  formacao: 'Formação',
  solucao: 'Projeto',
};

const UNIDADE: Record<Origem, [string, string]> = {
  formacao: ['aula', 'aulas'],
  solucao: ['etapa', 'etapas'],
};

export function GaleriaCertificados({
  formacoes,
  solucoes,
}: {
  formacoes: FormacaoResumo[];
  solucoes: SolucaoResumo[];
}) {
  const progresso = useProgresso();

  const maisRecenteDe = (ids: string[], registro: Record<string, string>) => {
    let melhor: string | null = null;
    for (const id of ids) {
      const iso = registro[id];
      if (iso && (!melhor || iso > melhor)) melhor = iso;
    }
    return melhor;
  };

  const conteudos: Conteudo[] = [
    ...formacoes.map((f) => ({
      origem: 'formacao' as const,
      slug: f.slug,
      titulo: f.titulo,
      href: `/formacoes/${f.slug}`,
      feitas: contarConcluidas(progresso, f.aulaIds),
      total: f.aulaIds.length,
      ultimaIso: maisRecenteDe(f.aulaIds, progresso.aulas),
    })),
    ...solucoes.map((s) => ({
      origem: 'solucao' as const,
      slug: s.slug,
      titulo: s.titulo,
      href: `/solucoes/${s.slug}`,
      feitas: contarEtapasFeitas(progresso, s.etapaIds),
      total: s.etapaIds.length,
      ultimaIso: maisRecenteDe(s.etapaIds, progresso.etapas),
    })),
  ].filter((c) => c.total > 0);

  const conquistados = conteudos
    .filter((c) => estadoDoProgresso(c.feitas, c.total) === 'concluida')
    .sort((a, b) => (b.ultimaIso ?? '').localeCompare(a.ultimaIso ?? ''));
  const andamento = conteudos
    .filter((c) => estadoDoProgresso(c.feitas, c.total) === 'em-andamento')
    .sort((a, b) => percentual(b.feitas, b.total) - percentual(a.feitas, a.total));
  const porComecar = conteudos.filter(
    (c) => estadoDoProgresso(c.feitas, c.total) === 'nao-iniciada',
  );
  const formacaoInicial = formacoes.find((f) => f.aulaIds.length > 0);
  const solucaoInicial = solucoes.find((s) => s.etapaIds.length > 0);

  const recomendacoes: RecomendacaoInicial[] = [
    formacaoInicial
      ? {
          indice: '01',
          origem: 'Formação',
          titulo: formacaoInicial.titulo,
          resumo: formacaoInicial.resumo,
          meta: `${formacaoInicial.aulas} ${formacaoInicial.aulas === 1 ? 'aula' : 'aulas'} · ${formacaoInicial.modulos} ${formacaoInicial.modulos === 1 ? 'módulo' : 'módulos'}`,
          href: `/formacoes/${formacaoInicial.slug}`,
          acao: 'Começar formação',
        }
      : null,
    solucaoInicial
      ? {
          indice: '02',
          origem: 'Projeto',
          titulo: solucaoInicial.titulo,
          resumo: solucaoInicial.resumo,
          meta: `${solucaoInicial.etapaIds.length} ${solucaoInicial.etapaIds.length === 1 ? 'etapa' : 'etapas'} · ${solucaoInicial.ferramentas.length > 0 ? `${solucaoInicial.ferramentas.length} ${solucaoInicial.ferramentas.length === 1 ? 'ferramenta' : 'ferramentas'}` : 'roteiro guiado'}`,
          href: `/solucoes/${solucaoInicial.slug}`,
          acao: 'Abrir projeto',
        }
      : null,
  ].filter((item): item is RecomendacaoInicial => item !== null);

  if (conquistados.length === 0 && andamento.length === 0) {
    return (
      <div className={styles.vazioEstado}>
        <div className={`${styles.vazio} via-mesh-navy via-noise`}>
          <div className={styles.vazioConteudo}>
            <p className={styles.vazioEyebrow}>
              Nenhum certificado ainda · {conteudos.length}{' '}
              {conteudos.length === 1 ? 'conteúdo disponível' : 'conteúdos disponíveis'}
            </p>
            <p className={styles.vazioTitulo}>Você ainda não concluiu uma formação ou projeto.</p>
            <p className={styles.vazioTexto}>
              Termine todas as aulas de uma formação ou todas as etapas de um projeto. O certificado
              aparecerá aqui automaticamente.
            </p>
            <div className={styles.vazioAcoes}>
              <Link href="/formacoes" className={styles.vazioCta}>
                Ver formações
              </Link>
              <Link href="/solucoes" className={styles.vazioCtaGhost}>
                Ver projetos
              </Link>
            </div>
          </div>

          <div className={styles.vazioRegistro}>
            <p className={styles.vazioRegistroTitulo}>Como receber um certificado</p>
            <ol className={styles.vazioDados}>
              <li>
                <span>01</span>
                <p>Concluir uma formação ou projeto</p>
              </li>
              <li>
                <span>02</span>
                <p>A plataforma registra a conclusão</p>
              </li>
              <li>
                <span>03</span>
                <p>Imprimir ou salvar o certificado em PDF</p>
              </li>
            </ol>
          </div>
        </div>

        {recomendacoes.length > 0 && (
          <section className={styles.primeiroPasso} aria-labelledby="certificados-primeiro-passo">
            <div className={styles.primeiroPassoCabecalho}>
              <p className={styles.primeiroPassoEyebrow}>Por onde começar</p>
              <h2 id="certificados-primeiro-passo">Escolha uma formação ou projeto.</h2>
              <p>
                A formação ensina as ferramentas. O projeto mostra como implementar para um cliente.
              </p>
            </div>

            <ul className={styles.recomendacoes}>
              {recomendacoes.map((item) => (
                <li key={item.origem}>
                  <Link href={item.href} className={styles.recomendacao}>
                    <span className={styles.recomendacaoIndice}>{item.indice}</span>
                    <span className={styles.recomendacaoConteudo}>
                      <span className={styles.recomendacaoOrigem}>{item.origem}</span>
                      <strong>{item.titulo}</strong>
                      <span className={styles.recomendacaoResumo}>{item.resumo}</span>
                      <span className={styles.recomendacaoMeta}>{item.meta}</span>
                    </span>
                    <span className={styles.recomendacaoAcao}>{item.acao}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className={styles.galeria}>
      {conquistados.length > 0 && (
        <section aria-labelledby="certificados-conquistados" className={styles.secao}>
          <div className={styles.secaoTopo}>
            <h2 id="certificados-conquistados" className={styles.secaoRotulo}>
              Conquistados
            </h2>
            <span className={styles.secaoTotal}>{conquistados.length}</span>
          </div>

          <ul className={styles.diplomas}>
            {conquistados.map((c) => (
              <li key={`${c.origem}-${c.slug}`}>
                {/* O DIPLOMA: navy, moldura interna de hairline, selo com o
                    visto. Tudo nele é dado real — título, contagem e a data da
                    última marcação. */}
                <article className={`${styles.diploma} via-mesh-navy via-noise`}>
                  <span className={styles.moldura} aria-hidden="true" />
                  <div className={styles.diplomaTopo}>
                    <p className={styles.diplomaEyebrow}>Certificado · {ROTULO_ORIGEM[c.origem]}</p>
                    <span className={styles.selo}>
                      <Visto tamanho={13} />
                    </span>
                  </div>

                  <h3 className={styles.diplomaTitulo}>{c.titulo}</h3>

                  <dl className={styles.diplomaFicha}>
                    <div className={styles.diplomaDado}>
                      <dt className={styles.diplomaRotulo}>Concluído em</dt>
                      <dd className={styles.diplomaValor}>
                        {c.ultimaIso ? dataCurta(c.ultimaIso) : '—'}
                      </dd>
                    </div>
                    <div className={styles.diplomaDado}>
                      <dt className={styles.diplomaRotulo}>{UNIDADE[c.origem][1]}</dt>
                      <dd className={styles.diplomaValor}>
                        {c.feitas}/{c.total}
                      </dd>
                    </div>
                  </dl>

                  <div className={styles.diplomaBase}>
                    <span className={styles.marca}>subido</span>
                    {/* A folha existe: imprimir/salvar em PDF acontece lá. */}
                    <Link href={`/certificados/${c.origem}/${c.slug}`} className={styles.baixar}>
                      Ver certificado
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      {andamento.length > 0 && (
        <section aria-labelledby="certificados-andamento" className={styles.secao}>
          <div className={styles.secaoTopo}>
            <h2 id="certificados-andamento" className={styles.secaoRotulo}>
              Em andamento
            </h2>
            <span className={styles.secaoTotal}>{andamento.length}</span>
          </div>

          <ul className={styles.lista}>
            {andamento.map((c) => {
              const pct = percentual(c.feitas, c.total);
              return (
                <li key={`${c.origem}-${c.slug}`}>
                  <Link href={c.href} className={styles.linha}>
                    <div className={styles.linhaTextos}>
                      <p className={styles.linhaEyebrow}>{ROTULO_ORIGEM[c.origem]}</p>
                      <p className={styles.linhaTitulo}>{c.titulo}</p>
                    </div>
                    <div className={styles.linhaProgresso}>
                      <span className={styles.linhaContagem}>
                        {c.feitas}/{c.total} {UNIDADE[c.origem][c.total === 1 ? 0 : 1]}
                      </span>
                      <span
                        className={styles.trilhoBarra}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${pct}% de ${c.titulo}`}
                      >
                        <span className={styles.barra} style={{ width: `${pct}%` }} />
                      </span>
                      <span className={styles.linhaPct}>{pct}%</span>
                      <span className={styles.linhaAcao} aria-hidden="true">
                        {c.origem === 'formacao' ? 'Continuar formação' : 'Continuar projeto'}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* O que não começou NÃO vira lista aqui — os catálogos já são essa
          lista. Fica só a contagem honesta, com o caminho. */}
      {porComecar.length > 0 && (
        <p className={styles.rodape}>
          {porComecar.length === 1
            ? 'Mais 1 conteúdo ainda sem progresso.'
            : `Mais ${porComecar.length} conteúdos ainda sem progresso.`}{' '}
          Comece por <Link href="/formacoes">Formações</Link> ou{' '}
          <Link href="/solucoes">Projetos</Link>.
        </p>
      )}
    </div>
  );
}
