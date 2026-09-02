'use client';

import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid2X2, LockKeyhole, X } from 'lucide-react';
import { ROTULOS_GRUPO_NAV, type ItemNav } from './navegacao';
import styles from './NavLateral.module.css';

const ORDEM_GRUPOS: ItemNav['grupo'][] = ['inicio', 'aprendizado', 'operacao', 'gestao'];

/**
 * Navegação — sidebar no desktop e dock com menu completo no mobile.
 *
 * O componente é cliente apenas para marcar a rota ativa e controlar o painel
 * "Mais". O marcador agora é CSS puro: importar uma biblioteca de animação no
 * shell inteiro atrasava a hidratação de toda página por um detalhe decorativo.
 */
export function NavLateral({
  itens,
  variante,
  itemConta,
  grupo = 'principal',
  rotuloGrupo,
  caminhoAtual,
}: {
  itens: ItemNav[];
  variante: 'lateral' | 'dock';
  itemConta?: ItemNav;
  grupo?: string;
  rotuloGrupo?: string;
  /** Só a bancada visual controla a rota; no produto ela sempre vem do Next. */
  caminhoAtual?: string;
}) {
  const caminhoDaRota = usePathname();
  const caminho = caminhoAtual ?? caminhoDaRota;
  const [menuAberto, setMenuAberto] = useState(false);
  const [destinoPendente, setDestinoPendente] = useState<string | null>(null);
  const [destinosPreparados, setDestinosPreparados] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const tituloMenuId = useId();
  const painelMenuId = useId();
  const botaoMaisRef = useRef<HTMLButtonElement>(null);
  const botaoFecharRef = useRef<HTMLButtonElement>(null);
  const painelMenuRef = useRef<HTMLElement>(null);

  const destinoDoItem = (item: ItemNav) =>
    item.bloqueado && item.destinoBloqueado ? item.destinoBloqueado : item.href;
  const explicacaoDoBloqueio = (item: ItemNav) =>
    `${item.rotulo}, disponível no ${item.planoNecessario ?? 'plano superior'}`;
  const estaAtivo = (item: ItemNav) =>
    !item.bloqueado && (caminho === item.href || caminho.startsWith(`${item.href}/`));

  const itensPrioritarios = itens.filter((item) => item.noDock && !item.bloqueado).slice(0, 4);
  const hrefsPrioritarios = new Set(itensPrioritarios.map((item) => item.href));
  const itensAdicionais = itens.filter((item) => !hrefsPrioritarios.has(item.href));
  const contaAtiva = Boolean(itemConta && estaAtivo(itemConta));
  const maisAtivo =
    contaAtiva || itens.some((item) => !hrefsPrioritarios.has(item.href) && estaAtivo(item));
  useEffect(() => {
    if (!menuAberto) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botaoFecharRef.current?.focus();

    function aoPressionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setMenuAberto(false);
        botaoMaisRef.current?.focus();
        return;
      }

      if (evento.key !== 'Tab') return;
      const focaveis = painelMenuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focaveis?.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo?.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro?.focus();
      }
    }

    window.addEventListener('keydown', aoPressionar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', aoPressionar);
    };
  }, [menuAberto]);

  function fecharMenu(devolverFoco = false) {
    setMenuAberto(false);
    if (devolverFoco) requestAnimationFrame(() => botaoMaisRef.current?.focus());
  }

  function iniciarNavegacao(evento: ReactMouseEvent<HTMLAnchorElement>, item: ItemNav) {
    if (
      evento.button !== 0 ||
      evento.metaKey ||
      evento.ctrlKey ||
      evento.shiftKey ||
      evento.altKey ||
      estaAtivo(item)
    ) {
      return;
    }
    setDestinoPendente(destinoDoItem(item));
  }

  function prepararDestino(item: ItemNav) {
    const destino = destinoDoItem(item);
    setDestinosPreparados((atuais) => {
      if (atuais.has(destino)) return atuais;
      return new Set([...atuais, destino]);
    });
  }

  function renderizarItens(lista: ItemNav[]) {
    return (
      <ul className={styles.lista}>
        {lista.map((item) => {
          const ativo = estaAtivo(item);
          const destino = destinoDoItem(item);
          const carregando = destinoPendente === destino && !ativo;

          return (
            <li key={item.href}>
              <Link
                href={destino}
                /* A sidebar inteira fica visível no desktop. O prefetch padrão
                   acordava todas as rotas ao mesmo tempo; agora a rota completa
                   só é preparada quando ponteiro ou teclado indicam intenção. */
                prefetch={destinosPreparados.has(destino)}
                className={styles.item}
                aria-label={item.bloqueado ? explicacaoDoBloqueio(item) : undefined}
                aria-current={ativo ? 'page' : undefined}
                aria-busy={carregando || undefined}
                data-bloqueado={item.bloqueado || undefined}
                data-loading={carregando || undefined}
                onMouseEnter={() => prepararDestino(item)}
                onFocus={() => prepararDestino(item)}
                onClick={(evento) => iniciarNavegacao(evento, item)}
              >
                {ativo && variante === 'dock' && <span className={styles.marcaDock} />}
                <span className={styles.icone} aria-hidden="true">
                  {item.icone}
                </span>
                <span className={styles.rotulo}>{item.rotulo}</span>
                {item.bloqueado && (
                  <span className={styles.seloPlano} aria-hidden="true">
                    <LockKeyhole size={11} strokeWidth={1.9} />
                    {item.planoNecessario ?? 'Upgrade'}
                  </span>
                )}
                {carregando && <span className="sr-only">Carregando {item.rotulo}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  if (variante === 'dock') {
    const contaCarregando = Boolean(
      itemConta && destinoPendente === itemConta.href && !estaAtivo(itemConta),
    );

    return (
      <nav className={styles.dock} aria-label="Navegação principal">
        {menuAberto && (
          <>
            <button
              type="button"
              className={styles.fundoMenu}
              aria-label="Fechar navegação ao tocar fora"
              tabIndex={-1}
              onClick={() => fecharMenu(true)}
            />

            <section
              ref={painelMenuRef}
              id={painelMenuId}
              className={styles.painelMenu}
              role="dialog"
              aria-modal="true"
              aria-labelledby={tituloMenuId}
            >
              <header className={styles.cabecalhoMenu}>
                <h2 id={tituloMenuId}>Mais</h2>
                <button
                  ref={botaoFecharRef}
                  type="button"
                  className={styles.fecharMenu}
                  aria-label="Fechar navegação"
                  onClick={() => fecharMenu(true)}
                >
                  <X size={18} strokeWidth={1.8} aria-hidden="true" />
                </button>
              </header>

              <div className={styles.conteudoMenu}>
                {ORDEM_GRUPOS.map((idGrupo) => {
                  const itensDoGrupo = itensAdicionais.filter((item) => item.grupo === idGrupo);
                  if (!itensDoGrupo.length) return null;

                  return (
                    <section className={styles.grupoMenu} key={idGrupo}>
                      <h3>{ROTULOS_GRUPO_NAV[idGrupo]}</h3>
                      <div className={styles.gradeMenu}>
                        {itensDoGrupo.map((item) => {
                          const ativo = estaAtivo(item);
                          const destino = destinoDoItem(item);
                          const carregando = destinoPendente === destino && !ativo;

                          return (
                            <Link
                              href={destino}
                              prefetch={destinosPreparados.has(destino)}
                              className={styles.itemMenu}
                              aria-label={item.bloqueado ? explicacaoDoBloqueio(item) : undefined}
                              aria-current={ativo ? 'page' : undefined}
                              aria-busy={carregando || undefined}
                              data-bloqueado={item.bloqueado || undefined}
                              data-loading={carregando || undefined}
                              key={item.href}
                              onMouseEnter={() => prepararDestino(item)}
                              onFocus={() => prepararDestino(item)}
                              onClick={(evento) => {
                                iniciarNavegacao(evento, item);
                                fecharMenu();
                              }}
                            >
                              <span className={styles.iconeMenu} aria-hidden="true">
                                {item.icone}
                              </span>
                              <span>{item.rotulo}</span>
                              {item.bloqueado && (
                                <small>
                                  <LockKeyhole size={11} strokeWidth={1.9} aria-hidden="true" />
                                  Plano {item.planoNecessario ?? 'superior'}
                                </small>
                              )}
                              {carregando && (
                                <span className="sr-only">Carregando {item.rotulo}</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>

              {itemConta && (
                <div className={styles.contaMenuArea}>
                  <Link
                    href={itemConta.href}
                    className={styles.contaMenu}
                    aria-current={contaAtiva ? 'page' : undefined}
                    aria-busy={contaCarregando || undefined}
                    data-loading={contaCarregando || undefined}
                    onClick={(evento) => {
                      iniciarNavegacao(evento, itemConta);
                      fecharMenu();
                    }}
                  >
                    <span className={styles.iconeConta} aria-hidden="true">
                      {itemConta.icone}
                    </span>
                    <span>
                      <small>Conta</small>
                      <strong>{itemConta.rotulo}</strong>
                    </span>
                    <em>{contaCarregando ? 'Abrindo…' : contaAtiva ? 'Atual' : 'Abrir'}</em>
                  </Link>
                </div>
              )}
            </section>
          </>
        )}

        <ul className={`${styles.lista} ${styles.listaDock}`}>
          {itensPrioritarios.map((item) => {
            const ativo = estaAtivo(item);
            const destino = destinoDoItem(item);
            const carregando = destinoPendente === destino && !ativo;

            return (
              <li key={item.href}>
                <Link
                  href={destino}
                  className={styles.item}
                  aria-current={ativo ? 'page' : undefined}
                  aria-busy={carregando || undefined}
                  data-loading={carregando || undefined}
                  onClick={(evento) => iniciarNavegacao(evento, item)}
                >
                  {ativo && <span className={styles.marcaDock} />}
                  <span className={styles.icone} aria-hidden="true">
                    {item.icone}
                  </span>
                  <span className={styles.rotulo}>{item.rotulo}</span>
                  {carregando && <span className="sr-only">Carregando {item.rotulo}</span>}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              ref={botaoMaisRef}
              type="button"
              className={`${styles.item} ${styles.botaoMais}`}
              aria-expanded={menuAberto}
              aria-controls={painelMenuId}
              aria-haspopup="dialog"
              aria-current={maisAtivo ? 'page' : undefined}
              onClick={() => setMenuAberto((aberto) => !aberto)}
            >
              {maisAtivo && <span className={styles.marcaDock} />}
              <span className={styles.icone} aria-hidden="true">
                <Grid2X2 size={18} strokeWidth={1.8} />
              </span>
              <span className={styles.rotulo}>Mais</span>
            </button>
          </li>
        </ul>
      </nav>
    );
  }

  return (
    <nav className={styles.lateral} aria-label={rotuloGrupo ?? 'Seções da plataforma'}>
      <div className={styles.grupos}>
        {ORDEM_GRUPOS.map((idGrupo) => {
          const itensDoGrupo = itens.filter((item) => item.grupo === idGrupo);
          if (!itensDoGrupo.length) return null;

          return (
            <section
              className={styles.grupoLateral}
              data-grupo={idGrupo}
              key={`${grupo}-${idGrupo}`}
            >
              {idGrupo !== 'inicio' && (
                <p className={styles.rotuloGrupo} aria-hidden="true">
                  {rotuloGrupo ?? ROTULOS_GRUPO_NAV[idGrupo]}
                </p>
              )}
              {renderizarItens(itensDoGrupo)}
            </section>
          );
        })}
      </div>
    </nav>
  );
}
