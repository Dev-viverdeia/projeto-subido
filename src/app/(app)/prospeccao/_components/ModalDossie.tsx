'use client';

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  AtSign,
  BriefcaseBusiness,
  Camera,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Play,
  Search,
  Users,
  UserRoundSearch,
  X,
} from 'lucide-react';
import { BotaoEnviarCrm } from './BotaoEnviarCrm';
import { ContextoEmpresa } from './ContextoEmpresa';
import { CopiarContato } from './CopiarContato';
import {
  decisoresDo,
  emailsDo,
  fonteDoContato,
  fontesDo,
  horariosDo,
  identificadorRede,
  qualificacaoDo,
  redesDo,
  rotuloCompletude,
  rotuloRede,
  telefonesDo,
  urlWhatsapp,
  type Lead,
  type RedeSocial,
} from './dossie';
import styles from './ModalProspeccao.module.css';

const escutarMontagem = () => () => undefined;
const obterMontagemCliente = () => true;
const obterMontagemServidor = () => false;

function IconeRede({ rede }: { rede: RedeSocial['rede'] }) {
  if (rede === 'instagram') return <Camera size={18} aria-hidden="true" />;
  if (rede === 'facebook') return <Users size={18} aria-hidden="true" />;
  if (rede === 'linkedin') return <BriefcaseBusiness size={18} aria-hidden="true" />;
  if (rede === 'youtube') return <Play size={18} aria-hidden="true" />;
  return <AtSign size={18} aria-hidden="true" />;
}

function AcaoContato({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
      {children}
      <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}

export function ModalDossie({
  lead: selecionado,
  onClose,
  retornarFoco,
}: {
  lead: Lead;
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
  const telefones = telefonesDo(selecionado);
  const emails = emailsDo(selecionado);
  const redes = redesDo(selecionado);
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
      retornarFoco?.focus();
    };
  }, [montado, onClose, retornarFoco]);

  function manterFoco(evento: React.KeyboardEvent<HTMLElement>) {
    if (evento.key !== 'Tab' || !dialogoRef.current) return;
    const focaveis = dialogoRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const primeiro = focaveis.item(0);
    const ultimo = focaveis.item(focaveis.length - 1);
    if (!primeiro || !ultimo) return;
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
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
            <p>Detalhes da empresa</p>
            <h2 id="lead-detalhe-titulo">{selecionado.nome}</h2>
            <div className={styles.headerMeta}>
              <span>{selecionado.categoria ?? 'Empresa local'}</span>
              <span>
                <MapPin size={13} aria-hidden="true" />
                {[selecionado.cidade, selecionado.estado].filter(Boolean).join(', ') ||
                  'Região a confirmar'}
              </span>
            </div>
          </div>
          <div className={styles.headerSignals}>
            <span className={styles.channelCount}>
              <strong>{qualificacao.completude}%</strong>
              {rotuloCompletude(qualificacao.completude)}
            </span>
          </div>
          <button
            ref={fecharRef}
            className={styles.close}
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes da empresa"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <main className={styles.main}>
            <section className={styles.section} aria-labelledby="canais-titulo">
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>Contatos da empresa</p>
                  <h3 id="canais-titulo">Canais para começar a abordagem</h3>
                  <span>
                    Copie o dado ou abra o canal. O CRM fica para quando você quiser trabalhar a
                    oportunidade.
                  </span>
                </div>
                <AtSign size={20} aria-hidden="true" />
              </div>

              <div className={styles.contactList}>
                {telefones.map((telefone) => (
                  <article className={styles.contactRow} key={telefone}>
                    <span className={styles.contactIcon}>
                      <Phone size={18} aria-hidden="true" />
                    </span>
                    <div className={styles.contactData}>
                      <span>Telefone / WhatsApp</span>
                      <strong>{telefone}</strong>
                      <small>{fonteDoContato(selecionado, 'telefone', telefone)}</small>
                    </div>
                    <div className={styles.contactActions}>
                      <CopiarContato valor={telefone} />
                      {urlWhatsapp(telefone) && (
                        <AcaoContato href={urlWhatsapp(telefone) as string}>WhatsApp</AcaoContato>
                      )}
                      <AcaoContato href={`tel:${telefone}`}>Ligar</AcaoContato>
                    </div>
                  </article>
                ))}

                {emails.map((email) => (
                  <article className={styles.contactRow} key={email}>
                    <span className={styles.contactIcon}>
                      <Mail size={18} aria-hidden="true" />
                    </span>
                    <div className={styles.contactData}>
                      <span>E-mail</span>
                      <strong>{email}</strong>
                      <small>{fonteDoContato(selecionado, 'email', email)}</small>
                    </div>
                    <div className={styles.contactActions}>
                      <CopiarContato valor={email} />
                      <AcaoContato href={`mailto:${email}`}>Escrever</AcaoContato>
                    </div>
                  </article>
                ))}

                {redes.map((rede) => (
                  <article className={styles.contactRow} key={`${rede.rede}-${rede.url}`}>
                    <span className={styles.contactIcon}>
                      <IconeRede rede={rede.rede} />
                    </span>
                    <div className={styles.contactData}>
                      <span>{rotuloRede(rede.rede)}</span>
                      <strong>{identificadorRede(rede)}</strong>
                      <small>{fonteDoContato(selecionado, 'rede', rede.url)}</small>
                    </div>
                    <div className={styles.contactActions}>
                      <CopiarContato valor={rede.url} />
                      <AcaoContato href={rede.url}>Abrir perfil</AcaoContato>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.section} aria-labelledby="decisores-titulo">
              <div className={styles.sectionHeading}>
                <div>
                  <p className={styles.eyebrow}>Quem procurar</p>
                  <h3 id="decisores-titulo">Possíveis decisores</h3>
                  <span>Confirme o vínculo e o cargo antes de enviar a primeira mensagem.</span>
                </div>
                <UserRoundSearch size={20} aria-hidden="true" />
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
                          <AcaoContato href={decisor.linkedin_url}>LinkedIn</AcaoContato>
                        )}
                        {decisor.email && (
                          <AcaoContato href={`mailto:${decisor.email}`}>E-mail</AcaoContato>
                        )}
                        {decisor.telefone && urlWhatsapp(decisor.telefone) && (
                          <AcaoContato href={urlWhatsapp(decisor.telefone) as string}>
                            WhatsApp
                          </AcaoContato>
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
            </section>

            <ContextoEmpresa lead={selecionado} />
          </main>

          <aside className={styles.sidebar}>
            <section className={styles.crmCard}>
              <p className={styles.eyebrow}>Próximo passo</p>
              <h3>Quer trabalhar este lead?</h3>
              <p>Crie a oportunidade com a empresa, os contatos e os decisores já preenchidos.</p>
              <BotaoEnviarCrm
                lead={selecionado.id}
                oportunidade={selecionado.crm_oportunidade_id}
                className={styles.crmAction}
              />
            </section>

            {horarios.length > 0 && (
              <section className={styles.sideCard}>
                <div className={styles.sideTitle}>
                  <Clock3 size={17} aria-hidden="true" />
                  <div>
                    <strong>Horários públicos</strong>
                    <span>Uma referência para escolher quando ligar.</span>
                  </div>
                </div>
                <dl className={styles.hours}>
                  {horarios.map((horario) => (
                    <div key={horario.dia}>
                      <dt>{horario.dia}</dt>
                      <dd>{horario.horarios}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section className={styles.sideCard}>
              <div className={styles.sideTitle}>
                <Search size={17} aria-hidden="true" />
                <div>
                  <strong>De onde vieram os dados</strong>
                  <span>Confira a origem antes de usar.</span>
                </div>
              </div>
              <div className={styles.sources}>
                {fontesDo(selecionado).map((fonte) => (
                  <span key={fonte}>{fonte}</span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </article>
    </div>,
    document.body,
  );
}
