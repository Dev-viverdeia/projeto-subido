'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Clock3, MapPin, Search, Target, UserRoundSearch, X } from 'lucide-react';
import { AcaoContatoProspeccao } from './AcaoContatoProspeccao';
import { BotaoEnviarCrm } from './BotaoEnviarCrm';
import { ContextoEmpresa } from './ContextoEmpresa';
import { ContatosEmpresa } from './ContatosEmpresa';
import {
  decisoresDo,
  fontesDo,
  horariosDo,
  qualificacaoDo,
  urlWhatsapp,
  type Lead,
} from './dossie';
import styles from './ModalProspeccao.module.css';

const escutarMontagem = () => () => undefined;
const obterMontagemCliente = () => true;
const obterMontagemServidor = () => false;

export function ModalDossie({
  lead: selecionado,
  lista,
  onClose,
  retornarFoco,
}: {
  lead: Lead;
  lista?: string;
  onClose: () => void;
  retornarFoco: HTMLButtonElement | null;
}) {
  const fecharRef = useRef<HTMLButtonElement>(null);
  const dialogoRef = useRef<HTMLElement>(null);
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );
  const decisores = decisoresDo(selecionado);
  const horarios = horariosDo(selecionado);
  const qualificacao = qualificacaoDo(selecionado);

  useEffect(() => {
    if (!montado) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    fecharRef.current?.focus();
    const fechar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fechar);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', fechar);
      retornarFoco?.focus({ preventScroll: true });
    };
  }, [montado, onClose, retornarFoco]);

  function manterFoco(evento: React.KeyboardEvent<HTMLElement>) {
    if (evento.key !== 'Tab' || !dialogoRef.current) return;
    const focaveis = [
      ...dialogoRef.current.querySelectorAll<HTMLElement>(
        'a[href], summary, button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((elemento) => {
      if (!elemento.getClientRects().length || getComputedStyle(elemento).visibility === 'hidden')
        return false;
      for (let pai = elemento.parentElement; pai; pai = pai.parentElement) {
        if (
          pai instanceof HTMLDetailsElement &&
          !pai.open &&
          pai.querySelector(':scope > summary') !== elemento
        )
          return false;
      }
      return true;
    });
    const primeiro = focaveis[0];
    const ultimo = focaveis.at(-1);
    if (!primeiro || !ultimo) return;
    // Ciclo explícito também inclui links e botões no Safari com teclado reduzido.
    const indice = focaveis.indexOf(document.activeElement as HTMLElement);
    const proximo =
      indice < 0
        ? evento.shiftKey
          ? ultimo
          : primeiro
        : focaveis[(indice + (evento.shiftKey ? -1 : 1) + focaveis.length) % focaveis.length];
    evento.preventDefault();
    proximo?.focus();
  }

  if (!montado) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose();
      }}
    >
      <article
        ref={dialogoRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-detalhe-titulo"
        onKeyDown={manterFoco}
      >
        <header className={styles.header}>
          <div className={styles.headerIdentity}>
            <h2 id="lead-detalhe-titulo">{selecionado.nome}</h2>
            <div className={styles.headerMeta}>
              <span>{selecionado.categoria ?? 'Empresa local'}</span>
              <span>
                <MapPin size={15} aria-hidden="true" />
                {[selecionado.cidade, selecionado.estado].filter(Boolean).join(', ') ||
                  'Região a confirmar'}
              </span>
            </div>
          </div>
          <button
            ref={fecharRef}
            className={styles.close}
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes da empresa"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>
          <div className={styles.main}>
            <ContatosEmpresa lead={selecionado} />
            {qualificacao.oportunidade && (
              <details className={styles.disclosure}>
                <summary>
                  <Target size={20} aria-hidden="true" />
                  <span>
                    Projeto para explorar<strong>{qualificacao.oportunidade.projeto_titulo}</strong>
                  </span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <div className={styles.disclosureBody}>
                  <p>{qualificacao.oportunidade.motivo}</p>
                  <blockquote>{qualificacao.oportunidade.pergunta_abertura}</blockquote>
                </div>
              </details>
            )}
            <details className={styles.disclosure}>
              <summary>
                <UserRoundSearch size={20} aria-hidden="true" />
                <span>Possíveis decisores</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <div className={styles.disclosureBody}>
                <div className={styles.sectionHeading}>
                  <div>
                    <span>Confirme o vínculo e o cargo antes de enviar a primeira mensagem.</span>
                  </div>
                </div>
                {decisores.length ? (
                  <div className={styles.decisionMakers}>
                    {decisores.map((decisor) => (
                      <article key={`${decisor.nome}-${decisor.linkedin_url ?? decisor.cargo}`}>
                        <span className={styles.avatar}>
                          {decisor.nome.slice(0, 1).toLocaleUpperCase('pt-BR')}
                        </span>
                        <div className={styles.decisionIdentity}>
                          <strong>{decisor.nome}</strong>
                          <span>{decisor.cargo ?? decisor.senioridade ?? 'Cargo a confirmar'}</span>
                          {decisor.email && <small>{decisor.email}</small>}
                          {decisor.telefone && <small>{decisor.telefone}</small>}
                        </div>
                        <div className={styles.decisionActions}>
                          {decisor.linkedin_url && (
                            <AcaoContatoProspeccao
                              lead={selecionado.id}
                              canal="linkedin"
                              href={decisor.linkedin_url}
                            >
                              LinkedIn
                            </AcaoContatoProspeccao>
                          )}
                          {decisor.email && (
                            <AcaoContatoProspeccao
                              lead={selecionado.id}
                              canal="email"
                              href={`mailto:${decisor.email}`}
                            >
                              E-mail
                            </AcaoContatoProspeccao>
                          )}
                          {decisor.telefone && urlWhatsapp(decisor.telefone) && (
                            <AcaoContatoProspeccao
                              lead={selecionado.id}
                              canal="whatsapp"
                              href={urlWhatsapp(decisor.telefone) as string}
                            >
                              WhatsApp
                            </AcaoContatoProspeccao>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noContacts}>
                    <Search size={20} aria-hidden="true" />
                    <div>
                      <strong>Não encontramos um decisor com segurança.</strong>
                      <span>
                        Use o telefone, o e-mail ou a rede social da empresa para pedir a pessoa
                        responsável.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </details>
          </div>
          <aside className={styles.sidebar} aria-label="Dados da empresa">
            <ContextoEmpresa lead={selecionado} />
            {horarios.length > 0 && (
              <details className={styles.disclosure}>
                <summary>
                  <Clock3 size={20} aria-hidden="true" />
                  <span>Horários públicos</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <dl className={styles.hours}>
                  {horarios.map((horario) => (
                    <div key={horario.dia}>
                      <dt>{horario.dia}</dt>
                      <dd>{horario.horarios}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
            {fontesDo(selecionado).length > 0 && (
              <details className={styles.disclosure}>
                <summary>
                  <Search size={20} aria-hidden="true" />
                  <span>Fontes consultadas</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <ul className={styles.sources}>
                  {fontesDo(selecionado).map((fonte) => (
                    <li key={fonte}>{fonte}</li>
                  ))}
                </ul>
              </details>
            )}
          </aside>
        </div>
        <footer className={styles.footer}>
          <p>
            {selecionado.crm_oportunidade_id
              ? 'Esta empresa já está em Vendas.'
              : 'Crie uma oportunidade para trabalhar esta empresa.'}
          </p>
          <BotaoEnviarCrm
            lead={selecionado.id}
            lista={lista}
            oportunidade={selecionado.crm_oportunidade_id}
            className={styles.crmAction}
          />
        </footer>
      </article>
    </div>,
    document.body,
  );
}
