'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  AtSign,
  BriefcaseBusiness,
  Building2,
  Camera,
  Check,
  Clock3,
  ExternalLink,
  Globe2,
  MapPin,
  Phone,
  Play,
  Share2,
  Star,
  UserRoundSearch,
  X,
} from 'lucide-react';
import { Button } from '@/design-system/via';
import { enviarLeadAoCrm } from '@/lib/prospeccao/actions';
import {
  decisoresDo,
  emailsDo,
  fontesDo,
  horariosDo,
  objeto,
  qualificacaoDo,
  redesDo,
  rotuloCompletude,
  rotuloRede,
  setorProfissionalDo,
  telefonesDo,
  type Lead,
  type RedeSocial,
} from './dossie';
import styles from '../pagina.module.css';

function IconeRede({ rede }: { rede: RedeSocial['rede'] }) {
  if (rede === 'instagram') return <Camera size={17} aria-hidden="true" />;
  if (rede === 'linkedin') return <BriefcaseBusiness size={17} aria-hidden="true" />;
  if (rede === 'youtube') return <Play size={17} aria-hidden="true" />;
  return <Globe2 size={17} aria-hidden="true" />;
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
  const detalhes = {
    telefones: telefonesDo(selecionado),
    emails: emailsDo(selecionado),
    redes: redesDo(selecionado),
    decisores: decisoresDo(selecionado),
    horarios: horariosDo(selecionado),
    qualificacao: qualificacaoDo(selecionado),
    dados: objeto(selecionado.dados),
  };

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
      className={styles.fundoDetalhe}
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose();
      }}
    >
      <article
        ref={dialogoRef}
        className={styles.detalheLead}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-detalhe-titulo"
        onKeyDown={manterFoco}
      >
        <header className={styles.detalheTopo}>
          <div className={styles.tituloDossie}>
            <p>Dossiê de prospecção</p>
            <h2 id="lead-detalhe-titulo">{selecionado.nome}</h2>
            <div>
              <span>{selecionado.categoria ?? 'Categoria a confirmar'}</span>
              <span>
                <MapPin size={13} />{' '}
                {[selecionado.cidade, selecionado.estado].filter(Boolean).join(', ') ||
                  'Região a confirmar'}
              </span>
            </div>
          </div>
          <div className={styles.resumoCompletude}>
            <strong>{detalhes.qualificacao.completude}%</strong>
            <span>{rotuloCompletude(detalhes.qualificacao.completude)}</span>
          </div>
          <button
            ref={fecharRef}
            type="button"
            onClick={() => onClose()}
            aria-label="Fechar detalhes"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.detalheConteudo}>
          <section className={styles.faixaContatos} aria-labelledby="contatos-titulo">
            <div className={styles.tituloSecao}>
              <p id="contatos-titulo">Canais encontrados</p>
              <span>Dados públicos para você validar antes do contato.</span>
            </div>
            <div className={styles.canaisGrid}>
              <div
                className={styles.canalPrincipal}
                data-disponivel={detalhes.telefones.length > 0}
              >
                <span>
                  <Phone size={17} /> Telefone
                </span>
                {detalhes.telefones.length ? (
                  detalhes.telefones.slice(0, 2).map((telefone) => (
                    <a href={`tel:${telefone}`} key={telefone}>
                      {telefone}
                    </a>
                  ))
                ) : (
                  <em>Não encontrado</em>
                )}
              </div>
              <div className={styles.canalPrincipal} data-disponivel={detalhes.emails.length > 0}>
                <span>
                  <AtSign size={17} /> E-mail
                </span>
                {detalhes.emails.length ? (
                  detalhes.emails.slice(0, 2).map((email) => (
                    <a href={`mailto:${email}`} key={email}>
                      {email}
                    </a>
                  ))
                ) : (
                  <em>Não encontrado</em>
                )}
              </div>
              <div
                className={styles.canalPrincipal}
                data-disponivel={Boolean(selecionado.site_url)}
              >
                <span>
                  <Globe2 size={17} /> Site
                </span>
                {selecionado.site_url ? (
                  <a href={selecionado.site_url} target="_blank" rel="noreferrer">
                    {selecionado.dominio ?? 'Abrir site'} <ExternalLink size={12} />
                  </a>
                ) : (
                  <em>Não encontrado</em>
                )}
              </div>
              <div className={styles.canalPrincipal} data-disponivel={detalhes.redes.length > 0}>
                <span>
                  <Share2 size={17} /> Redes sociais
                </span>
                {detalhes.redes.length ? (
                  <div className={styles.linksSociais}>
                    {detalhes.redes.map((rede) => (
                      <a
                        href={rede.url}
                        target="_blank"
                        rel="noreferrer"
                        key={`${rede.rede}-${rede.url}`}
                        aria-label={`Abrir ${rotuloRede(rede.rede)}`}
                        title={rotuloRede(rede.rede)}
                      >
                        <IconeRede rede={rede.rede} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <em>Não encontradas</em>
                )}
              </div>
            </div>
          </section>

          <div className={styles.corpoDossie}>
            <main>
              <section className={styles.secaoDossie} aria-labelledby="decisores-titulo">
                <div className={styles.tituloSecao}>
                  <div>
                    <p id="decisores-titulo">Possíveis decisores</p>
                    <span>Pessoas com cargo de liderança associadas publicamente à empresa.</span>
                  </div>
                  <UserRoundSearch size={20} aria-hidden="true" />
                </div>
                {detalhes.decisores.length ? (
                  <div className={styles.listaDecisores}>
                    {detalhes.decisores.map((decisor) => (
                      <div key={`${decisor.nome}-${decisor.linkedin_url ?? decisor.cargo}`}>
                        <span className={styles.avatarDecisor}>
                          {decisor.nome.slice(0, 1).toLocaleUpperCase('pt-BR')}
                        </span>
                        <div>
                          <strong>{decisor.nome}</strong>
                          <span>{decisor.cargo ?? decisor.senioridade ?? 'Cargo a confirmar'}</span>
                          {decisor.localizacao && <small>{decisor.localizacao}</small>}
                        </div>
                        {decisor.linkedin_url && (
                          <a
                            href={decisor.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Abrir LinkedIn de ${decisor.nome}`}
                          >
                            <BriefcaseBusiness size={17} /> Perfil <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.vazioDecisores}>
                    <UserRoundSearch size={21} aria-hidden="true" />
                    <div>
                      <strong>Nenhum decisor encontrado nesta busca.</strong>
                      <span>
                        Isso não significa que a empresa não tenha liderança pública; confirme
                        durante a prospecção.
                      </span>
                    </div>
                  </div>
                )}
                <p className={styles.notaFonte}>
                  Possíveis correspondências. Confirme vínculo e cargo antes de abordar.
                </p>
              </section>

              <section className={styles.secaoDossie} aria-labelledby="negocio-titulo">
                <div className={styles.tituloSecao}>
                  <div>
                    <p id="negocio-titulo">Sobre o negócio</p>
                    <span>Contexto reunido de fontes públicas.</span>
                  </div>
                  <Building2 size={20} aria-hidden="true" />
                </div>
                <p className={styles.descricaoNegocio}>
                  {selecionado.descricao ??
                    'Não encontramos uma descrição pública confiável para este negócio.'}
                </p>
                <dl className={styles.fatosNegocio}>
                  <div>
                    <dt>Endereço</dt>
                    <dd>{selecionado.endereco ?? 'Não encontrado'}</dd>
                  </div>
                  <div>
                    <dt>Avaliação</dt>
                    <dd>
                      {selecionado.avaliacao !== null ? (
                        <>
                          <Star size={14} fill="currentColor" /> {selecionado.avaliacao} ·{' '}
                          {selecionado.total_avaliacoes ?? 0} avaliações
                        </>
                      ) : (
                        'Sem avaliação disponível'
                      )}
                    </dd>
                  </div>
                  {setorProfissionalDo(selecionado) && (
                    <div>
                      <dt>Setor</dt>
                      <dd>{setorProfissionalDo(selecionado)}</dd>
                    </div>
                  )}
                </dl>
                {selecionado.maps_url && (
                  <a
                    className={styles.linkMapa}
                    href={selecionado.maps_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MapPin size={15} /> Abrir no mapa <ExternalLink size={11} />
                  </a>
                )}
              </section>
            </main>

            <aside>
              <section className={styles.secaoLateral}>
                <div className={styles.tituloSecao}>
                  <div>
                    <p>Leitura comercial</p>
                    <span>O que os dados já permitem concluir.</span>
                  </div>
                </div>
                <ul className={styles.listaSinais}>
                  {detalhes.qualificacao.sinais.length ? (
                    detalhes.qualificacao.sinais.map((sinal) => (
                      <li key={sinal}>
                        <Check size={14} /> {sinal}
                      </li>
                    ))
                  ) : (
                    <li>
                      <Check size={14} /> Base pública inicial organizada
                    </li>
                  )}
                </ul>
              </section>
              <section className={styles.secaoLateral}>
                <div className={styles.tituloSecao}>
                  <div>
                    <p>Horários públicos</p>
                    <span>Útil para escolher o momento do contato.</span>
                  </div>
                  <Clock3 size={18} />
                </div>
                {detalhes.horarios.length ? (
                  <dl className={styles.listaHorarios}>
                    {detalhes.horarios.map((horario) => (
                      <div key={horario.dia}>
                        <dt>{horario.dia}</dt>
                        <dd>{horario.horarios}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className={styles.dadoAusente}>Horários não encontrados.</p>
                )}
              </section>
              <section className={styles.secaoLateral}>
                <div className={styles.tituloSecao}>
                  <div>
                    <p>Fontes consultadas</p>
                    <span>Rastreabilidade do dossiê.</span>
                  </div>
                </div>
                <div className={styles.fontesLead}>
                  {fontesDo(selecionado).map((fonte) => (
                    <span key={fonte}>{fonte}</span>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>

        <footer className={styles.detalheRodape}>
          <div>
            <strong>Pronto para trabalhar este lead?</strong>
            <span>Os contatos, decisores e fontes seguem juntos para o CRM.</span>
          </div>
          {selecionado.crm_oportunidade_id ? (
            <Link
              href={`/crm/${selecionado.crm_oportunidade_id}`}
              className="via-btn via-btn--primary via-btn--md"
            >
              <span className="via-btn__label">Abrir no CRM</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <form action={enviarLeadAoCrm}>
              <input type="hidden" name="lead" value={selecionado.id} />
              <Button type="submit" variant="primary" iconRight={<ArrowRight size={16} />}>
                Enviar para o CRM
              </Button>
            </form>
          )}
        </footer>
      </article>
    </div>
  );
}
