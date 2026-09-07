'use client';

import { useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CircleHelp,
  ExternalLink,
  FileSearch,
  Globe2,
  Lightbulb,
  Mail,
  Phone,
} from 'lucide-react';
import { ROTULO_CONFIANCA, ROTULO_ORIGEM, type DossieEnriquecido } from '@/lib/crm/enriquecimento';
import { acaoParaFicha, resumoParaFicha, valorFatoParaFicha } from '@/lib/crm/apresentacao';
import type { DossieLead, ExecucaoEnriquecimento } from '@/lib/crm/queries';
import { dataCompleta } from '../datas';
import { AcaoPesquisaComercial } from './AcaoPesquisaComercial';
import { InteligenciaDeContato } from './InteligenciaDeContato';
import { PrepararConversa } from './PrepararConversa';
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
  const [aba, setAba] = useState<AbaPesquisa>('conversa');

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
          {ABAS.map((item, indice) => (
            <button
              type="button"
              role="tab"
              key={item.id}
              id={`aba-pesquisa-${item.id}`}
              tabIndex={aba === item.id ? 0 : -1}
              aria-selected={aba === item.id}
              aria-controls={`painel-pesquisa-${item.id}`}
              onClick={() => setAba(item.id)}
              onKeyDown={(event) => {
                const destino =
                  event.key === 'ArrowRight'
                    ? (indice + 1) % ABAS.length
                    : event.key === 'ArrowLeft'
                      ? (indice - 1 + ABAS.length) % ABAS.length
                      : event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? ABAS.length - 1
                          : null;
                if (destino === null) return;
                event.preventDefault();
                const proxima = ABAS[destino]!;
                setAba(proxima.id);
                document.getElementById(`aba-pesquisa-${proxima.id}`)?.focus();
              }}
            >
              {item.rotulo}
            </button>
          ))}
        </div>

        <div
          id={`painel-pesquisa-${aba}`}
          role="tabpanel"
          aria-labelledby={`aba-pesquisa-${aba}`}
          className={styles.painelAba}
        >
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
