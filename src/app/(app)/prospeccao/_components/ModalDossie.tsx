'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import {
  AtSign,
  BriefcaseBusiness,
  Camera,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Play,
  Search,
  Users,
  UserRoundSearch,
  X,
} from 'lucide-react';
import type { CanalContatoProspeccao } from '@/lib/prospeccao/schema';
import { AndamentoProspeccao } from './AndamentoProspeccao';
import { ContextoEmpresa } from './ContextoEmpresa';
import { LinkContato } from './LinkContato';
import {
  decisoresDo,
  emailsDo,
  fonteDoContato,
  fontesDo,
  horariosDo,
  identificadorRede,
  redesDo,
  rotuloRede,
  rotuloStatusProspeccao,
  statusProspeccaoDo,
  telefonesDo,
  totalCanaisAcionaveis,
  urlWhatsapp,
  type Lead,
  type RedeSocial,
} from './dossie';
import styles from './ModalProspeccao.module.css';

function IconeRede({ rede }: { rede: RedeSocial['rede'] }) {
  if (rede === 'instagram') return <Camera size={18} aria-hidden="true" />;
  if (rede === 'facebook') return <Users size={18} aria-hidden="true" />;
  if (rede === 'linkedin') return <BriefcaseBusiness size={18} aria-hidden="true" />;
  if (rede === 'youtube') return <Play size={18} aria-hidden="true" />;
  if (rede === 'tiktok') return <Music2 size={18} aria-hidden="true" />;
  return <AtSign size={18} aria-hidden="true" />;
}

function AcaoContato({
  lead,
  canal,
  href,
  ariaLabel,
  children,
}: {
  lead: string;
  canal: CanalContatoProspeccao;
  href: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <LinkContato lead={lead} canal={canal} href={href} ariaLabel={ariaLabel}>
      {children}
      <ExternalLink size={13} aria-hidden="true" />
    </LinkContato>
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
  const telefones = telefonesDo(selecionado);
  const emails = emailsDo(selecionado);
  const redes = redesDo(selecionado);
  const decisores = decisoresDo(selecionado);
  const horarios = horariosDo(selecionado);
  const status = statusProspeccaoDo(selecionado);
  const totalCanais = totalCanaisAcionaveis(selecionado);
  const ausentes = [
    !telefones.length && 'telefone',
    !emails.length && 'e-mail',
    !redes.length && 'redes sociais',
  ].filter(Boolean) as string[];

  useEffect(() => {
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
  }, [onClose, retornarFoco]);

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

  return (
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
            <p>Empresa encontrada</p>
            <h2 id="lead-detalhe-titulo">{selecionado.nome}</h2>
            <div className={styles.headerMeta}>
              <span>{selecionado.categoria ?? 'Categoria a confirmar'}</span>
              <span>
                <MapPin size={13} aria-hidden="true" />
                {[selecionado.cidade, selecionado.estado].filter(Boolean).join(', ') ||
                  'Região a confirmar'}
              </span>
            </div>
          </div>
          <div className={styles.headerSignals}>
            <span className={styles.channelCount}>
              <strong>{totalCanais}</strong>
              {totalCanais === 1 ? 'canal de contato' : 'canais de contato'}
            </span>
            <span className={styles.status} data-status={status}>
              {rotuloStatusProspeccao(status)}
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
                  <p className={styles.eyebrow}>Contatos encontrados</p>
                  <h3 id="canais-titulo">Como entrar em contato</h3>
                  <span>Ao abrir um canal, a tentativa fica registrada nesta lista.</span>
                </div>
                <MessageCircle size={20} aria-hidden="true" />
              </div>

              <div className={styles.contactList}>
                {telefones.map((telefone) => {
                  const whatsapp = urlWhatsapp(telefone);
                  return (
                    <article className={styles.contactRow} key={telefone}>
                      <span className={styles.contactIcon}>
                        <Phone size={18} aria-hidden="true" />
                      </span>
                      <div className={styles.contactData}>
                        <span>Telefone</span>
                        <strong>{telefone}</strong>
                        <small>{fonteDoContato(selecionado, 'telefone', telefone)}</small>
                      </div>
                      <div className={styles.contactActions}>
                        {whatsapp && (
                          <AcaoContato
                            lead={selecionado.id}
                            canal="whatsapp"
                            href={whatsapp}
                            ariaLabel={`Abrir WhatsApp para ${telefone}`}
                          >
                            WhatsApp
                          </AcaoContato>
                        )}
                        <AcaoContato
                          lead={selecionado.id}
                          canal="telefone"
                          href={`tel:${telefone}`}
                          ariaLabel={`Ligar para ${telefone}`}
                        >
                          Ligar
                        </AcaoContato>
                      </div>
                    </article>
                  );
                })}

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
                      <AcaoContato
                        lead={selecionado.id}
                        canal="email"
                        href={`mailto:${email}`}
                        ariaLabel={`Escrever e-mail para ${email}`}
                      >
                        Escrever e-mail
                      </AcaoContato>
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
                      <AcaoContato
                        lead={selecionado.id}
                        canal={rede.rede}
                        href={rede.url}
                        ariaLabel={`Abrir perfil no ${rotuloRede(rede.rede)}`}
                      >
                        Abrir perfil
                      </AcaoContato>
                    </div>
                  </article>
                ))}
              </div>

              {!totalCanais && (
                <div className={styles.noContacts}>
                  <Search size={20} aria-hidden="true" />
                  <div>
                    <strong>Nenhum contato foi encontrado.</strong>
                    <span>Abra o site ou o Google Maps para pesquisar a empresa.</span>
                  </div>
                </div>
              )}
              {totalCanais > 0 && ausentes.length > 0 && (
                <p className={styles.missing}>Não encontramos: {ausentes.join(', ')}.</p>
              )}
            </section>

            {decisores.length > 0 && (
              <section className={styles.section} aria-labelledby="decisores-titulo">
                <div className={styles.sectionHeading}>
                  <div>
                    <p className={styles.eyebrow}>Pessoas encontradas</p>
                    <h3 id="decisores-titulo">Possíveis decisores</h3>
                    <span>
                      Confirme se a pessoa ainda trabalha na empresa antes de entrar em contato.
                    </span>
                  </div>
                  <UserRoundSearch size={20} aria-hidden="true" />
                </div>
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
                        <small>{decisor.fonte}</small>
                      </div>
                      <div className={styles.decisionActions}>
                        {decisor.linkedin_url && (
                          <AcaoContato
                            lead={selecionado.id}
                            canal="linkedin"
                            href={decisor.linkedin_url}
                            ariaLabel={`Abrir LinkedIn de ${decisor.nome}`}
                          >
                            LinkedIn
                          </AcaoContato>
                        )}
                        {decisor.email && (
                          <AcaoContato
                            lead={selecionado.id}
                            canal="email"
                            href={`mailto:${decisor.email}`}
                            ariaLabel={`Escrever e-mail para ${decisor.nome}`}
                          >
                            E-mail
                          </AcaoContato>
                        )}
                        {decisor.telefone && urlWhatsapp(decisor.telefone) && (
                          <AcaoContato
                            lead={selecionado.id}
                            canal="whatsapp"
                            href={urlWhatsapp(decisor.telefone) as string}
                            ariaLabel={`Abrir WhatsApp de ${decisor.nome}`}
                          >
                            WhatsApp
                          </AcaoContato>
                        )}
                        {decisor.telefone && (
                          <AcaoContato
                            lead={selecionado.id}
                            canal="telefone"
                            href={`tel:${decisor.telefone}`}
                            ariaLabel={`Ligar para ${decisor.nome}`}
                          >
                            Ligar
                          </AcaoContato>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <ContextoEmpresa lead={selecionado} />
          </main>

          <aside className={styles.sidebar}>
            <AndamentoProspeccao
              key={`${selecionado.id}-${status}-${selecionado.tentativas_contato}`}
              lead={selecionado.id}
              status={status}
              ultimoCanal={selecionado.ultimo_canal}
              tentativas={selecionado.tentativas_contato}
              oportunidade={selecionado.crm_oportunidade_id}
            />

            {horarios.length > 0 && (
              <section className={styles.sideCard}>
                <div className={styles.sideTitle}>
                  <Clock3 size={17} aria-hidden="true" />
                  <div>
                    <strong>Horários públicos</strong>
                    <span>Referência para escolher o contato.</span>
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
                  <strong>Fontes consultadas</strong>
                  <span>Origem dos dados reunidos.</span>
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
    </div>
  );
}
