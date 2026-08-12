import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Check,
  CircleHelp,
  Database,
  ExternalLink,
  Globe2,
  Lightbulb,
  Mail,
  MessageSquareQuote,
  Phone,
  Radar,
  Layers3,
  Target,
} from 'lucide-react';
import { aplicarProximaAcao } from '@/lib/crm/actions';
import { ROTULO_CONFIANCA, ROTULO_ORIGEM } from '@/lib/crm/enriquecimento';
import { obterDossieLead } from '@/lib/crm/queries';
import { CabecalhoDossie } from './_components/CabecalhoDossie';
import { EstadoEnriquecimento } from './_components/EstadoEnriquecimento';
import { FormularioEnriquecimento } from './_components/FormularioEnriquecimento';
import { JornadaEntradaLead, type EstadoContextoLead } from './_components/JornadaEntradaLead';
import { ResumoOperacionalLead } from './_components/ResumoOperacionalLead';
import { dataCompleta } from './datas';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Dossiê do lead · CRM' };

export default async function DossieLeadPage({ params, searchParams }: PageProps<'/crm/[id]'>) {
  const [{ id }, parametros] = await Promise.all([params, searchParams]);
  const lead = await obterDossieLead(id);
  if (!lead) notFound();

  const ultima = lead.enriquecimentos[0] ?? null;
  const emAndamento =
    ultima?.status === 'na_fila' || ultima?.status === 'processando' ? ultima : null;
  const falhaRecente = ultima?.status === 'falhou' ? ultima : null;
  const execucaoPronta = lead.enriquecimentos.find(
    (execucao) => execucao.status === 'concluido' && execucao.dossie,
  );
  const dossie = execucaoPronta?.dossie ?? null;
  const entradaRecente = parametros.novo === '1';
  const projetoDeOrigem =
    typeof parametros.projeto === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parametros.projeto)
      ? parametros.projeto.slice(0, 160)
      : null;
  const estadoContexto: EstadoContextoLead = dossie
    ? 'pronto'
    : emAndamento
      ? 'processando'
      : falhaRecente
        ? 'falhou'
        : 'pendente';

  return (
    <div className={styles.pagina}>
      <Link href="/crm" className={styles.voltar}>
        <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
        Voltar ao pipeline
      </Link>

      <CabecalhoDossie
        lead={lead}
        enriquecimentoEmAndamento={Boolean(emAndamento)}
        temDossie={Boolean(dossie)}
        modoEntrada={entradaRecente}
      />

      {entradaRecente ? (
        <JornadaEntradaLead
          oportunidadeId={lead.oportunidade.id}
          empresaNome={lead.empresa.nome}
          dominio={lead.empresa.dominio}
          linkedin={lead.contato?.linkedinUrl ?? null}
          estadoContexto={estadoContexto}
          totalCalls={lead.totalCalls}
          projetoSlug={projetoDeOrigem}
        />
      ) : (
        <ResumoOperacionalLead lead={lead} />
      )}

      {emAndamento && <EstadoEnriquecimento status={emAndamento.status} erro={null} />}
      {falhaRecente && (
        <EstadoEnriquecimento status={falhaRecente.status} erro={falhaRecente.erro} />
      )}

      {!entradaRecente && !dossie && !emAndamento && (
        <section className={styles.primeiroDossie}>
          <div>
            <span className={styles.iconeVazio}>
              <Radar size={22} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <p className={styles.sobretitulo}>Próximo passo</p>
            <h2>Chegue na conversa sabendo onde olhar</h2>
            <p>
              O dossiê lê o histórico do CRM, o site público e o contexto que você já possui. A
              saída separa fatos, hipóteses e perguntas para a próxima call.
            </p>
            <FormularioEnriquecimento
              oportunidadeId={lead.oportunidade.id}
              dominioInicial={lead.empresa.dominio}
              linkedinInicial={lead.contato?.linkedinUrl ?? null}
              temDossie={false}
            />
          </div>

          <div className={styles.entregas} aria-label="O que o dossiê entrega">
            <span>
              <BadgeCheck size={17} aria-hidden="true" /> Fatos com origem visível
            </span>
            <span>
              <CircleHelp size={17} aria-hidden="true" /> Hipóteses com forma de validar
            </span>
            <span>
              <Target size={17} aria-hidden="true" /> Oportunidades de projeto
            </span>
            <span>
              <MessageSquareQuote size={17} aria-hidden="true" /> Perguntas de descoberta
            </span>
          </div>
        </section>
      )}

      {!entradaRecente && dossie && execucaoPronta && (
        <>
          <section className={styles.resumo} aria-labelledby="leitura-titulo">
            <div className={styles.resumoMarca}>
              <Layers3 size={18} strokeWidth={1.8} aria-hidden="true" />
              Leitura do lead
            </div>
            <div>
              <h2 id="leitura-titulo">{dossie.resumo}</h2>
              <p>
                Atualizado em{' '}
                {dataCompleta(execucaoPronta.concluidoEm ?? execucaoPronta.solicitadoEm)}
                {' · '}
                {dossie.fatos.length} fatos e {dossie.hipoteses.length} hipóteses separados.
              </p>
            </div>
          </section>

          <div className={styles.gradeConteudo}>
            <div className={styles.colunaPrincipal}>
              <section className={styles.bloco} aria-labelledby="fatos-titulo">
                <header className={styles.blocoTopo}>
                  <div>
                    <p className={styles.sobretitulo}>O que sabemos</p>
                    <h2 id="fatos-titulo">Fatos encontrados</h2>
                  </div>
                  <span>{dossie.fatos.length}</span>
                </header>

                <div className={styles.gradeFatos}>
                  {dossie.fatos.map((fato, indice) => (
                    <article className={styles.fato} key={`${fato.titulo}-${indice}`}>
                      <div>
                        <BadgeCheck size={16} strokeWidth={1.8} aria-hidden="true" />
                        <span>{ROTULO_ORIGEM[fato.origem]}</span>
                      </div>
                      <h3>{fato.titulo}</h3>
                      <p>{fato.valor}</p>
                      {fato.urlFonte && (
                        <a href={fato.urlFonte} target="_blank" rel="noreferrer">
                          Ver fonte <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.bloco} aria-labelledby="hipoteses-titulo">
                <header className={styles.blocoTopo}>
                  <div>
                    <p className={styles.sobretitulo}>O que precisa ser confirmado</p>
                    <h2 id="hipoteses-titulo">Hipóteses para a call</h2>
                  </div>
                  <span>{dossie.hipoteses.length}</span>
                </header>

                <div className={styles.listaHipoteses}>
                  {dossie.hipoteses.map((hipotese, indice) => (
                    <article
                      className={styles.hipotese}
                      data-confianca={hipotese.confianca}
                      key={`${hipotese.titulo}-${indice}`}
                    >
                      <div className={styles.hipoteseTopo}>
                        <h3>{hipotese.titulo}</h3>
                        <span>{ROTULO_CONFIANCA[hipotese.confianca]}</span>
                      </div>
                      <p>{hipotese.explicacao}</p>
                      <div className={styles.validar}>
                        <CircleHelp size={15} strokeWidth={1.8} aria-hidden="true" />
                        <span>
                          <strong>Como validar:</strong> {hipotese.comoValidar}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.bloco} aria-labelledby="oportunidades-titulo">
                <header className={styles.blocoTopo}>
                  <div>
                    <p className={styles.sobretitulo}>Onde a IA pode entrar</p>
                    <h2 id="oportunidades-titulo">Oportunidades de projeto</h2>
                  </div>
                  <span>{dossie.oportunidades.length}</span>
                </header>

                <div className={styles.listaOportunidades}>
                  {dossie.oportunidades.map((oportunidade, indice) => (
                    <article
                      className={styles.oportunidade}
                      key={`${oportunidade.titulo}-${indice}`}
                    >
                      <span className={styles.numero}>{String(indice + 1).padStart(2, '0')}</span>
                      <div>
                        <h3>{oportunidade.titulo}</h3>
                        <p>{oportunidade.impacto}</p>
                        <p className={styles.porqueAgora}>{oportunidade.porQueAgora}</p>
                        <blockquote>“{oportunidade.abertura}”</blockquote>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className={styles.colunaLateral}>
              <section className={styles.proximaAcao} aria-labelledby="proxima-acao-titulo">
                <p className={styles.sobretituloClaro}>Recomendação operacional</p>
                <h2 id="proxima-acao-titulo">Próxima ação</h2>
                <p className={styles.acaoTexto}>{dossie.proximaAcao.acao}</p>
                <p className={styles.acaoPorque}>{dossie.proximaAcao.porque}</p>
                <form action={aplicarProximaAcao}>
                  <input type="hidden" name="oportunidade" value={lead.oportunidade.id} />
                  <input type="hidden" name="enriquecimento" value={execucaoPronta.id} />
                  <button
                    type="submit"
                    disabled={lead.oportunidade.proximaAcao === dossie.proximaAcao.acao}
                  >
                    {lead.oportunidade.proximaAcao === dossie.proximaAcao.acao ? (
                      <>
                        <Check size={15} aria-hidden="true" /> Ação no plano
                      </>
                    ) : (
                      <>
                        Adicionar ao plano <ArrowUpRight size={15} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>
              </section>

              <section className={styles.painelLateral} aria-labelledby="perguntas-titulo">
                <header>
                  <MessageSquareQuote size={18} strokeWidth={1.7} aria-hidden="true" />
                  <div>
                    <p className={styles.sobretitulo}>Roteiro de descoberta</p>
                    <h2 id="perguntas-titulo">Perguntas para a call</h2>
                  </div>
                </header>
                <ol className={styles.perguntas}>
                  {dossie.perguntasDescoberta.map((pergunta, indice) => (
                    <li key={`${pergunta}-${indice}`}>{pergunta}</li>
                  ))}
                </ol>
              </section>

              <section className={styles.painelLateral} aria-labelledby="lead-titulo">
                <header>
                  <Building2 size={18} strokeWidth={1.7} aria-hidden="true" />
                  <div>
                    <p className={styles.sobretitulo}>Ficha rápida</p>
                    <h2 id="lead-titulo">Empresa e contato</h2>
                  </div>
                </header>
                <dl className={styles.ficha}>
                  {(dossie.empresa.setor ?? lead.empresa.setor) && (
                    <div>
                      <dt>Setor</dt>
                      <dd>{dossie.empresa.setor ?? lead.empresa.setor}</dd>
                    </div>
                  )}
                  {(dossie.empresa.porte ?? lead.empresa.porte) && (
                    <div>
                      <dt>Porte</dt>
                      <dd>{dossie.empresa.porte ?? lead.empresa.porte}</dd>
                    </div>
                  )}
                  {dossie.empresa.modeloNegocio && (
                    <div>
                      <dt>Modelo</dt>
                      <dd>{dossie.empresa.modeloNegocio}</dd>
                    </div>
                  )}
                </dl>
                {lead.contato && (
                  <div className={styles.contato}>
                    <strong>{lead.contato.nome}</strong>
                    {lead.contato.cargo && <span>{lead.contato.cargo}</span>}
                    {lead.contato.email && (
                      <a href={`mailto:${lead.contato.email}`}>
                        <Mail size={13} aria-hidden="true" /> {lead.contato.email}
                      </a>
                    )}
                    {lead.contato.telefone && (
                      <a href={`tel:${lead.contato.telefone}`}>
                        <Phone size={13} aria-hidden="true" /> {lead.contato.telefone}
                      </a>
                    )}
                  </div>
                )}
              </section>

              {dossie.alertas.length > 0 && (
                <section className={styles.alertas} aria-labelledby="alertas-titulo">
                  <div>
                    <Lightbulb size={17} strokeWidth={1.7} aria-hidden="true" />
                    <h2 id="alertas-titulo">Limites desta leitura</h2>
                  </div>
                  <ul>
                    {dossie.alertas.map((alerta) => (
                      <li key={alerta}>{alerta}</li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>

          <section className={styles.rodapeDossie} aria-labelledby="fontes-titulo">
            <div>
              <p className={styles.sobretitulo}>Rastreabilidade</p>
              <h2 id="fontes-titulo">Fontes desta leitura</h2>
            </div>
            <div className={styles.listaFontes}>
              {execucaoPronta.fontes.map((fonte, indice) => {
                const conteudo = (
                  <>
                    {fonte.tipo === 'site' ? (
                      <Globe2 size={15} aria-hidden="true" />
                    ) : (
                      <Database size={15} aria-hidden="true" />
                    )}
                    <span>{fonte.titulo}</span>
                    <small>
                      {fonte.status === 'lida'
                        ? 'lida'
                        : fonte.status === 'referencia'
                          ? 'referência'
                          : 'indisponível'}
                    </small>
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
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                ) : (
                  <span key={`${fonte.titulo}-${indice}`}>{conteudo}</span>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
