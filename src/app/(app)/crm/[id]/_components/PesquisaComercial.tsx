'use client';

import { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  FileSearch,
  Globe2,
  Lightbulb,
  Mail,
  MessageSquareQuote,
  Phone,
  Route,
  Target,
} from 'lucide-react';
import {
  obterRoteiroCall,
  ROTULO_CONFIANCA,
  ROTULO_ETAPA_CALL,
  ROTULO_ORIGEM,
  type DossieEnriquecido,
} from '@/lib/crm/enriquecimento';
import { acaoParaFicha, resumoParaFicha, valorFatoParaFicha } from '@/lib/crm/apresentacao';
import type { DossieLead, ExecucaoEnriquecimento } from '@/lib/crm/queries';
import { dataCompleta } from '../datas';
import { AcaoPesquisaComercial } from './AcaoPesquisaComercial';
import { InteligenciaDeContato } from './InteligenciaDeContato';
import styles from './PesquisaComercial.module.css';

type AbaPesquisa = 'leitura' | 'conversa' | 'fontes';

const ABAS: ReadonlyArray<{ id: AbaPesquisa; rotulo: string }> = [
  { id: 'leitura', rotulo: 'Visão geral' },
  { id: 'conversa', rotulo: 'Preparar reunião' },
  { id: 'fontes', rotulo: 'Dados e fontes' },
];

function ListaFatos({ dossie }: { dossie: DossieEnriquecido }) {
  return (
    <section className={styles.painelLeitura} aria-labelledby="fatos-titulo">
      <header>
        <div>
          <p>Confirmado</p>
          <h3 id="fatos-titulo">O que já sabemos</h3>
        </div>
        <span>{dossie.fatos.length}</span>
      </header>
      {dossie.fatos.length ? (
        <ul className={styles.listaFatos}>
          {dossie.fatos.map((fato, indice) => (
            <li key={`${fato.titulo}-${indice}`}>
              <BadgeCheck size={15} strokeWidth={1.8} aria-hidden="true" />
              <div>
                <span>{ROTULO_ORIGEM[fato.origem]}</span>
                <strong>{fato.titulo}</strong>
                <p>{valorFatoParaFicha(fato.valor)}</p>
                {fato.urlFonte && (
                  <a href={fato.urlFonte} target="_blank" rel="noreferrer">
                    Abrir fonte <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.semDados}>Nenhum fato adicional foi encontrado nesta pesquisa.</p>
      )}
    </section>
  );
}

function ListaHipoteses({ dossie }: { dossie: DossieEnriquecido }) {
  return (
    <section className={styles.painelLeitura} aria-labelledby="hipoteses-titulo">
      <header>
        <div>
          <p>Confirmar na reunião</p>
          <h3 id="hipoteses-titulo">O que ainda é hipótese</h3>
        </div>
        <span>{dossie.hipoteses.length}</span>
      </header>
      {dossie.hipoteses.length ? (
        <ul className={styles.listaHipoteses}>
          {dossie.hipoteses.map((hipotese, indice) => (
            <li key={`${hipotese.titulo}-${indice}`}>
              <div className={styles.hipoteseTopo}>
                <strong>{hipotese.titulo}</strong>
                <span>{ROTULO_CONFIANCA[hipotese.confianca]}</span>
              </div>
              <p>{hipotese.explicacao}</p>
              <div className={styles.validacao}>
                <CircleHelp size={14} strokeWidth={1.8} aria-hidden="true" />
                <span>{hipotese.comoValidar}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.semDados}>Nenhuma hipótese útil foi gerada.</p>
      )}
    </section>
  );
}

function PrepararConversa({ dossie }: { dossie: DossieEnriquecido }) {
  const roteiro = obterRoteiroCall(dossie);

  return (
    <div className={styles.preparoCall}>
      <section className={styles.briefingCall} aria-labelledby="objetivo-call-titulo">
        <div className={styles.objetivoCall}>
          <span className={styles.iconeCall} aria-hidden="true">
            <Route size={19} strokeWidth={1.7} />
          </span>
          <div>
            <p>Objetivo da reunião</p>
            <h3 id="objetivo-call-titulo">O que esta reunião precisa esclarecer</h3>
            <span>{roteiro.objetivo}</span>
          </div>
        </div>
        <div className={styles.aberturaCall}>
          <p>Como abrir</p>
          <blockquote>“{roteiro.abertura}”</blockquote>
        </div>
      </section>

      <div className={styles.gradeConversa}>
        <section className={styles.painelLeitura} aria-labelledby="perguntas-titulo">
          <header>
            <div>
              <p>Roteiro personalizado</p>
              <h3 id="perguntas-titulo">Perguntas na ordem da conversa</h3>
            </div>
            <MessageSquareQuote size={18} strokeWidth={1.7} aria-hidden="true" />
          </header>
          <ol className={styles.perguntasCall}>
            {roteiro.perguntas.map((pergunta, indice) => (
              <li key={`${pergunta.pergunta}-${indice}`}>
                <span className={styles.indicePergunta}>{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <span className={styles.etapaPergunta}>{ROTULO_ETAPA_CALL[pergunta.etapa]}</span>
                  <strong>{pergunta.pergunta}</strong>
                  <p>{pergunta.intencao}</p>
                  {pergunta.projetoRelacionado && (
                    <small>
                      <BriefcaseBusiness size={12} strokeWidth={1.8} aria-hidden="true" />
                      {pergunta.projetoRelacionado}
                    </small>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.painelLeitura} aria-labelledby="projetos-titulo">
          <header>
            <div>
              <p>Possibilidades de projeto</p>
              <h3 id="projetos-titulo">Projetos para validar</h3>
            </div>
            <Target size={18} strokeWidth={1.7} aria-hidden="true" />
          </header>
          <div className={styles.projetos}>
            {dossie.oportunidades.slice(0, 3).map((oportunidade, indice) => (
              <article key={`${oportunidade.titulo}-${indice}`}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{oportunidade.titulo}</strong>
                  <dl>
                    <div>
                      <dt>Sinal encontrado</dt>
                      <dd>{oportunidade.porQueAgora}</dd>
                    </div>
                    <div>
                      <dt>Valor a confirmar</dt>
                      <dd>{oportunidade.impacto}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className={styles.fechamentoCall} aria-labelledby="fechamento-call-titulo">
        <div className={styles.fechamentoResumo}>
          <span className={styles.iconeFechamento} aria-hidden="true">
            <CheckCircle2 size={19} strokeWidth={1.7} />
          </span>
          <div>
            <p>Se houver aderência</p>
            <h3 id="fechamento-call-titulo">Saia com um próximo passo combinado</h3>
            <span>{roteiro.fechamento.sinalParaAvancar}</span>
          </div>
        </div>
        <blockquote>“{roteiro.fechamento.frase}”</blockquote>
        <div className={styles.proximoPassoCall}>
          <div>
            <small>Próximo passo indicado</small>
            <strong>{roteiro.fechamento.proximoPasso}</strong>
          </div>
          <ArrowRight size={18} strokeWidth={1.7} aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}

function DadosEFontes({
  lead,
  dossie,
  execucao,
}: {
  lead: DossieLead;
  dossie: DossieEnriquecido;
  execucao: ExecucaoEnriquecimento;
}) {
  return (
    <div className={styles.gradeDados}>
      <InteligenciaDeContato lead={lead} dossie={dossie} />
      <section className={styles.painelLeitura} aria-labelledby="empresa-titulo">
        <header>
          <div>
            <p>Dados cadastrais</p>
            <h3 id="empresa-titulo">Empresa e contato</h3>
          </div>
          <Building2 size={18} strokeWidth={1.7} aria-hidden="true" />
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
                <Mail size={14} aria-hidden="true" /> {lead.contato.email}
              </a>
            )}
            {lead.contato.telefone && (
              <a href={`tel:${lead.contato.telefone}`}>
                <Phone size={14} aria-hidden="true" /> {lead.contato.telefone}
              </a>
            )}
          </div>
        )}
      </section>

      <section className={styles.painelLeitura} aria-labelledby="fontes-titulo">
        <header>
          <div>
            <p>Rastreabilidade</p>
            <h3 id="fontes-titulo">Fontes consultadas</h3>
          </div>
          <Globe2 size={18} strokeWidth={1.7} aria-hidden="true" />
        </header>
        <div className={styles.fontes}>
          {execucao.fontes.map((fonte, indice) => {
            const conteudo = (
              <>
                <span>{fonte.titulo}</span>
                <small>
                  {fonte.status === 'lida'
                    ? 'Lida'
                    : fonte.status === 'referencia'
                      ? 'Referência'
                      : 'Indisponível'}
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
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            ) : (
              <div key={`${fonte.titulo}-${indice}`}>{conteudo}</div>
            );
          })}
        </div>
      </section>

      {dossie.alertas.length > 0 && (
        <section
          className={`${styles.painelLeitura} ${styles.limites}`}
          aria-labelledby="limites-titulo"
        >
          <header>
            <div>
              <p>Antes de usar</p>
              <h3 id="limites-titulo">O que precisa de cuidado</h3>
            </div>
            <Lightbulb size={18} strokeWidth={1.7} aria-hidden="true" />
          </header>
          <ul>
            {dossie.alertas.map((alerta) => (
              <li key={alerta}>{alerta}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function PesquisaComercial({
  lead,
  execucao,
  dossie,
}: {
  lead: DossieLead;
  execucao: ExecucaoEnriquecimento;
  dossie: DossieEnriquecido;
}) {
  const [aba, setAba] = useState<AbaPesquisa>('leitura');

  return (
    <section className={styles.pesquisa} aria-labelledby="pesquisa-comercial-titulo">
      <div className={styles.briefing}>
        <div className={styles.leituraPrincipal}>
          <span className={styles.iconePesquisa}>
            <FileSearch size={20} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div>
            <p>Ficha enriquecida</p>
            <h2 id="pesquisa-comercial-titulo">Leitura para a próxima reunião</h2>
            <p className={styles.resumoDossie}>{resumoParaFicha(dossie.resumo)}</p>
            <small>
              Atualizada em {dataCompleta(execucao.concluidoEm ?? execucao.solicitadoEm)}. Fatos
              confirmados e pontos a validar ficam separados.
            </small>
          </div>
        </div>

        <AcaoPesquisaComercial
          lead={lead}
          dossie={dossie}
          enriquecimentoId={execucao.id}
          acaoVisivel={acaoParaFicha(dossie.proximaAcao.acao)}
        />
      </div>

      <div className={styles.conteudoPesquisa}>
        <div className={styles.abas} role="tablist" aria-label="Dados enriquecidos da ficha">
          {ABAS.map((item) => (
            <button
              type="button"
              role="tab"
              key={item.id}
              aria-selected={aba === item.id}
              aria-controls={`painel-pesquisa-${item.id}`}
              onClick={() => setAba(item.id)}
            >
              {item.rotulo}
            </button>
          ))}
        </div>

        <div id={`painel-pesquisa-${aba}`} role="tabpanel" className={styles.painelAba}>
          {aba === 'leitura' && (
            <div className={styles.gradeLeitura}>
              <ListaFatos dossie={dossie} />
              <ListaHipoteses dossie={dossie} />
            </div>
          )}
          {aba === 'conversa' && <PrepararConversa dossie={dossie} />}
          {aba === 'fontes' && <DadosEFontes lead={lead} dossie={dossie} execucao={execucao} />}
        </div>
      </div>
    </section>
  );
}
