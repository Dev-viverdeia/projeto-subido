import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleHelp,
  ExternalLink,
  FileSignature,
  Link2,
  Quote,
  ScanSearch,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import { aplicarAcaoDoDiagnostico } from '@/lib/diagnosticos/actions';
import type { DiagnosticoCompleto } from '@/lib/diagnosticos/queries';
import { DIMENSOES_DIAGNOSTICO, ROTULO_CANAL } from '@/lib/diagnosticos/schema';
import styles from './PainelRelatorio.module.css';

function dataCompleta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function PainelRelatorio({ diagnostico }: { diagnostico: DiagnosticoCompleto }) {
  const relatorio = diagnostico.relatorio;
  if (!relatorio) return null;

  const projetoPrincipal = relatorio.oportunidades.find((item) => item.projeto_slug);
  const parametrosProjeto = projetoPrincipal?.projeto_slug
    ? `&projeto=${encodeURIComponent(projetoPrincipal.projeto_slug)}`
    : '';
  const propostaHref = `/propostas/nova?oportunidade=${diagnostico.oportunidadeId}&diagnostico=${diagnostico.id}${parametrosProjeto}`;
  const acaoAplicada = diagnostico.proximaAcaoAtual === relatorio.proxima_acao_comercial.acao;

  return (
    <div className={styles.relatorio}>
      <section
        className={`${styles.hero} via-noise`}
        data-on-dark
        aria-labelledby="relatorio-titulo"
      >
        <div className={styles.heroTexto}>
          <p className={styles.sobretituloClaro}>Diagnóstico de atendimento</p>
          <h1 id="relatorio-titulo">{diagnostico.empresa}</h1>
          <p className={styles.veredito}>{relatorio.veredito}</p>
          <div className={styles.meta}>
            <span>{ROTULO_CANAL[diagnostico.canal]}</span>
            <span>{diagnostico.concluidoEm ? dataCompleta(diagnostico.concluidoEm) : 'Agora'}</span>
            <span>
              {relatorio.cobertura === 'substancial'
                ? 'Cobertura substancial'
                : 'Cobertura parcial'}
            </span>
          </div>
        </div>

        <div className={styles.notaHero}>
          <span>Nota observada</span>
          <strong>{diagnostico.notaGeral ?? '—'}</strong>
          <small>{diagnostico.notaGeral === null ? 'sem base suficiente' : 'de 100'}</small>
        </div>

        <div className={styles.mapaDimensoes} aria-label="Mapa das dimensões avaliadas">
          {DIMENSOES_DIAGNOSTICO.map((item) => {
            const dimensao = relatorio.dimensoes[item.id];
            const largura = dimensao.nota ?? 0;
            return (
              <div className={styles.linhaDimensao} key={item.id}>
                <span>{item.titulo}</span>
                <div className={styles.trilho} aria-hidden="true">
                  <span style={{ '--largura': `${largura}%` } as CSSProperties} />
                </div>
                <strong>{dimensao.nota ?? '—'}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.resumo} aria-labelledby="resumo-titulo">
        <ScanSearch size={20} strokeWidth={1.7} aria-hidden="true" />
        <div>
          <p className={styles.sobretitulo}>Leitura executiva</p>
          <h2 id="resumo-titulo">{relatorio.resumo}</h2>
          <span>{relatorio.aviso_escopo}</span>
        </div>
      </section>

      <section className={styles.dimensoes} aria-labelledby="dimensoes-titulo">
        <header className={styles.cabecalhoSecao}>
          <div>
            <p className={styles.sobretitulo}>Cinco lentes</p>
            <h2 id="dimensoes-titulo">Onde a experiência sustenta ou perde a conversa</h2>
          </div>
        </header>
        <div className={styles.gradeDimensoes}>
          {DIMENSOES_DIAGNOSTICO.map((item, indice) => {
            const dimensao = relatorio.dimensoes[item.id];
            return (
              <article className={styles.dimensao} key={item.id}>
                <span className={styles.indice}>{String(indice + 1).padStart(2, '0')}</span>
                <div className={styles.dimensaoTopo}>
                  <div>
                    <h3>{item.titulo}</h3>
                    <p>{item.descricao}</p>
                  </div>
                  <strong>{dimensao.nota ?? '—'}</strong>
                </div>
                <p className={styles.leitura}>{dimensao.leitura}</p>
                <span className={styles.cobertura}>
                  {dimensao.cobertura === 'observada'
                    ? 'Observada'
                    : dimensao.cobertura === 'parcial'
                      ? 'Parcialmente observada'
                      : 'Não observada'}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <div className={styles.gradePrincipal}>
        <div className={styles.colunaPrincipal}>
          <section className={styles.bloco} aria-labelledby="fatos-titulo">
            <header className={styles.blocoTopo}>
              <div>
                <p className={styles.sobretitulo}>O que pode ser provado</p>
                <h2 id="fatos-titulo">Evidências do atendimento</h2>
              </div>
              <span>{relatorio.fatos.length}</span>
            </header>
            {relatorio.fatos.length ? (
              <div className={styles.listaFatos}>
                {relatorio.fatos.map((fato, indice) => (
                  <article className={styles.fato} key={`${fato.titulo}-${indice}`}>
                    <BadgeCheck size={17} strokeWidth={1.8} aria-hidden="true" />
                    <div>
                      <h3>{fato.titulo}</h3>
                      <blockquote>“{fato.evidencia.trecho}”</blockquote>
                      <span>{fato.evidencia.fonte}</span>
                      <p>{fato.impacto}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.semDados}>As fontes não sustentaram nenhum fato adicional.</p>
            )}
          </section>

          <section className={styles.bloco} aria-labelledby="falhas-titulo">
            <header className={styles.blocoTopo}>
              <div>
                <p className={styles.sobretitulo}>Atritos comprovados</p>
                <h2 id="falhas-titulo">Falhas que merecem correção</h2>
              </div>
              <span>{relatorio.falhas.length}</span>
            </header>
            {relatorio.falhas.length ? (
              <div className={styles.listaFalhas}>
                {relatorio.falhas.map((falha, indice) => (
                  <article className={styles.falha} key={`${falha.titulo}-${indice}`}>
                    <span className={styles.severidade}>{falha.severidade}</span>
                    <h3>{falha.titulo}</h3>
                    <p>{falha.impacto}</p>
                    <blockquote>
                      <Quote size={14} aria-hidden="true" /> {falha.evidencia.trecho}
                    </blockquote>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.semDados}>
                Nenhuma falha foi comprovada nas fontes disponíveis.
              </p>
            )}
          </section>

          <section className={styles.bloco} aria-labelledby="oportunidades-titulo">
            <header className={styles.blocoTopo}>
              <div>
                <p className={styles.sobretitulo}>Hipóteses de projeto</p>
                <h2 id="oportunidades-titulo">Onde um projeto pode entrar</h2>
              </div>
              <span>{relatorio.oportunidades.length}</span>
            </header>
            <div className={styles.listaOportunidades}>
              {relatorio.oportunidades.map((oportunidade, indice) => (
                <article className={styles.oportunidade} key={`${oportunidade.titulo}-${indice}`}>
                  <span className={styles.indice}>{String(indice + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{oportunidade.titulo}</h3>
                    <p>{oportunidade.impacto}</p>
                    <div className={styles.mecanismo}>
                      <Wrench size={15} aria-hidden="true" />
                      <span>{oportunidade.mecanismo}</span>
                    </div>
                    {oportunidade.projeto_slug && oportunidade.projeto_titulo && (
                      <Link href={`/solucoes/${oportunidade.projeto_slug}`}>
                        Projeto sugerido: {oportunidade.projeto_titulo}
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.colunaLateral}>
          <section className={styles.proximaAcao} aria-labelledby="acao-titulo">
            <p className={styles.sobretituloClaro}>Movimento comercial</p>
            <h2 id="acao-titulo">Próxima ação</h2>
            <p>{relatorio.proxima_acao_comercial.acao}</p>
            <span>{relatorio.proxima_acao_comercial.porque}</span>
            <form action={aplicarAcaoDoDiagnostico}>
              <input type="hidden" name="diagnostico" value={diagnostico.id} />
              <button type="submit" disabled={acaoAplicada}>
                {acaoAplicada ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <ArrowUpRight size={15} aria-hidden="true" />
                )}
                {acaoAplicada ? 'Adicionada ao CRM' : 'Usar no CRM'}
              </button>
            </form>
          </section>

          <Link href={propostaHref} className={styles.atalhoProposta}>
            <FileSignature size={20} strokeWidth={1.6} aria-hidden="true" />
            <div>
              <span>Próximo documento</span>
              <strong>Montar proposta com este contexto</strong>
            </div>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>

          <section className={styles.painelLateral} aria-labelledby="hipoteses-titulo">
            <header>
              <CircleHelp size={18} strokeWidth={1.7} aria-hidden="true" />
              <div>
                <p className={styles.sobretitulo}>Ainda não é fato</p>
                <h2 id="hipoteses-titulo">Hipóteses para validar</h2>
              </div>
            </header>
            <div className={styles.hipoteses}>
              {relatorio.hipoteses.map((hipotese, indice) => (
                <article key={`${hipotese.titulo}-${indice}`}>
                  <h3>{hipotese.titulo}</h3>
                  <p>{hipotese.explicacao}</p>
                  <span>{hipotese.comoValidar}</span>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.painelLateral} aria-labelledby="perguntas-titulo">
            <header>
              <TriangleAlert size={18} strokeWidth={1.7} aria-hidden="true" />
              <div>
                <p className={styles.sobretitulo}>Roteiro de descoberta</p>
                <h2 id="perguntas-titulo">Perguntas para a validação</h2>
              </div>
            </header>
            <ol className={styles.perguntas}>
              {relatorio.perguntas_descoberta.map((pergunta, indice) => (
                <li key={`${pergunta}-${indice}`}>{pergunta}</li>
              ))}
            </ol>
          </section>

          <section className={styles.painelLateral} aria-labelledby="fontes-titulo">
            <header>
              <Link2 size={18} strokeWidth={1.7} aria-hidden="true" />
              <div>
                <p className={styles.sobretitulo}>Rastro da análise</p>
                <h2 id="fontes-titulo">Fontes utilizadas</h2>
              </div>
            </header>
            <div className={styles.fontes}>
              {diagnostico.fontes.map((fonte, indice) => {
                const conteudo = (
                  <>
                    <span>{fonte.titulo}</span>
                    <small>
                      {fonte.status === 'lida'
                        ? 'Lida'
                        : fonte.status === 'informada'
                          ? 'Informada'
                          : 'Indisponível'}
                    </small>
                    {fonte.url && <ExternalLink size={12} aria-hidden="true" />}
                  </>
                );
                return fonte.url ? (
                  <a
                    href={fonte.url}
                    target="_blank"
                    rel="noreferrer"
                    key={`${fonte.titulo}-${indice}`}
                  >
                    {conteudo}
                  </a>
                ) : (
                  <div key={`${fonte.titulo}-${indice}`}>{conteudo}</div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      <section className={styles.plano} aria-labelledby="plano-titulo">
        <header className={styles.cabecalhoSecao}>
          <div>
            <p className={styles.sobretitulo}>Da leitura para a entrega</p>
            <h2 id="plano-titulo">Plano de correção</h2>
          </div>
          <span>Cada ação termina numa evidência</span>
        </header>
        <ol>
          {relatorio.plano_correcao.map((passo) => (
            <li key={`${passo.ordem}-${passo.acao}`}>
              <span className={styles.indice}>{String(passo.ordem).padStart(2, '0')}</span>
              <h3>{passo.acao}</h3>
              <p>{passo.resultado_esperado}</p>
              <small>
                <Check size={13} aria-hidden="true" /> {passo.evidencia_conclusao}
              </small>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
