'use client';

import Link from 'next/link';
import { avaliarCertificado, type EstadoCertificado } from '@/lib/certificados/criterios';
import type { FormacaoResumo, SolucaoResumo } from '@/lib/conteudo/queries';
import { idsAulasProjeto } from '@/lib/projetos/roteiro';
import { useProgresso, type EstadoProgressoConta } from '@/lib/progresso/local';
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
  estado: EstadoCertificado;
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

export function GaleriaCertificados({
  formacoes,
  solucoes,
  progressoPreview,
}: {
  formacoes: FormacaoResumo[];
  solucoes: SolucaoResumo[];
  progressoPreview?: EstadoProgressoConta;
}) {
  const progressoConta = useProgresso();
  const progresso = progressoPreview ?? progressoConta;

  const conteudos: Conteudo[] = [
    ...formacoes.map((f) => ({
      origem: 'formacao' as const,
      slug: f.slug,
      titulo: f.titulo,
      href: `/formacoes/${f.slug}`,
      estado: avaliarCertificado(
        { aprendizadoIds: f.aulaIds, implementacaoIds: [] },
        { aprendizado: progresso.aulas, implementacao: progresso.etapas },
      ),
    })),
    ...solucoes.map((s) => {
      const aprendizadoIds = s.projeto ? idsAulasProjeto(s.slug, s.projeto.roteiro) : [];
      return {
        origem: 'solucao' as const,
        slug: s.slug,
        titulo: s.titulo,
        href: `/solucoes/${s.slug}`,
        estado: avaliarCertificado(
          { aprendizadoIds, implementacaoIds: s.etapaIds },
          { aprendizado: progresso.etapas, implementacao: progresso.etapas },
        ),
      };
    }),
  ].filter((c) => c.estado.total > 0);

  const conquistados = conteudos
    .filter((c) => c.estado.concluido)
    .sort((a, b) => (b.estado.concluidoEm ?? '').localeCompare(a.estado.concluidoEm ?? ''));
  const andamento = conteudos
    .filter((c) => c.estado.iniciado && !c.estado.concluido)
    .sort((a, b) => b.estado.percentual - a.estado.percentual);
  const porComecar = conteudos.filter((c) => !c.estado.iniciado);
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
          meta: `${solucaoInicial.projeto?.roteiro.trilhaDidatica?.aulas.length ?? 0} aulas · ${solucaoInicial.etapaIds.length} passos`,
          href: `/solucoes/${solucaoInicial.slug}`,
          acao: 'Abrir projeto',
        }
      : null,
  ].filter((item): item is RecomendacaoInicial => item !== null);

  if (conquistados.length === 0 && andamento.length === 0) {
    return (
      <div className={styles.vazioEstado}>
        <div className={styles.vazio}>
          <div className={styles.vazioConteudo}>
            <p className={styles.vazioEyebrow}>Sua primeira conquista</p>
            <p className={styles.vazioTitulo}>Conclua. Comprove. Compartilhe.</p>
            <p className={styles.vazioTexto}>
              O certificado é liberado automaticamente quando o caminho chega a 100%.
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
            <p className={styles.vazioRegistroTitulo}>Como funciona</p>
            <ol className={styles.vazioDados}>
              <li>
                <span>01</span>
                <p>Conclua as aulas</p>
              </li>
              <li>
                <span>02</span>
                <p>Implemente o projeto</p>
              </li>
              <li>
                <span>03</span>
                <p>Compartilhe a conquista</p>
              </li>
            </ol>
          </div>
        </div>

        {recomendacoes.length > 0 && (
          <section className={styles.primeiroPasso} aria-labelledby="certificados-primeiro-passo">
            <div className={styles.primeiroPassoCabecalho}>
              <p className={styles.primeiroPassoEyebrow}>Por onde começar</p>
              <h2 id="certificados-primeiro-passo">Escolha seu próximo caminho.</h2>
              <p>Aprenda uma habilidade ou implemente um projeto real.</p>
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
                <article className={`${styles.diploma} via-on-dark`}>
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
                        {c.estado.concluidoEm ? dataCurta(c.estado.concluidoEm) : '—'}
                      </dd>
                    </div>
                    <div className={styles.diplomaDado}>
                      <dt className={styles.diplomaRotulo}>Aulas</dt>
                      <dd className={styles.diplomaValor}>
                        {c.estado.aprendizado.feitas}/{c.estado.aprendizado.total}
                      </dd>
                    </div>
                    {c.estado.implementacao.total > 0 ? (
                      <div className={styles.diplomaDado}>
                        <dt className={styles.diplomaRotulo}>Implementação</dt>
                        <dd className={styles.diplomaValor}>
                          {c.estado.implementacao.feitas}/{c.estado.implementacao.total}
                        </dd>
                      </div>
                    ) : null}
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
              const pct = c.estado.percentual;
              const proximaAcao =
                c.origem === 'formacao'
                  ? 'Continuar formação'
                  : c.estado.aprendizado.concluido
                    ? 'Continuar implementação'
                    : 'Concluir aulas';
              return (
                <li key={`${c.origem}-${c.slug}`}>
                  <Link href={c.href} className={styles.linha}>
                    <div className={styles.linhaTextos}>
                      <p className={styles.linhaEyebrow}>{ROTULO_ORIGEM[c.origem]}</p>
                      <p className={styles.linhaTitulo}>{c.titulo}</p>
                    </div>
                    <div className={styles.linhaProgresso}>
                      <span className={styles.linhaCriterios}>
                        <span data-completo={c.estado.aprendizado.concluido || undefined}>
                          Aulas {c.estado.aprendizado.feitas}/{c.estado.aprendizado.total}
                        </span>
                        {c.estado.implementacao.total > 0 ? (
                          <span data-completo={c.estado.implementacao.concluido || undefined}>
                            Implementação {c.estado.implementacao.feitas}/
                            {c.estado.implementacao.total}
                          </span>
                        ) : null}
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
                        {proximaAcao}
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
