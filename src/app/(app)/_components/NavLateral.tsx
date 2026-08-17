'use client';

import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROTULOS_GRUPO_NAV, type ItemNav } from './navegacao';
import styles from './NavLateral.module.css';

const ORDEM_GRUPOS: ItemNav['grupo'][] = ['aprendizado', 'operacao', 'gestao'];

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
}: {
  itens: ItemNav[];
  variante: 'lateral' | 'dock';
  itemConta?: ItemNav;
  grupo?: string;
  rotuloGrupo?: string;
}) {
  const caminho = usePathname();
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

  const estaAtivo = (item: ItemNav) => caminho === item.href || caminho.startsWith(`${item.href}/`);

  const itensPrioritarios = itens.filter((item) => item.noDock).slice(0, 4);
  const hrefsPrioritarios = new Set(itensPrioritarios.map((item) => item.href));
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
    setDestinoPendente(item.href);
  }

  function prepararDestino(item: ItemNav) {
    setDestinosPreparados((atuais) => {
      if (atuais.has(item.href)) return atuais;
      return new Set([...atuais, item.href]);
    });
  }

  function renderizarItens(lista: ItemNav[]) {
    return (
      <ul className={styles.lista}>
        {lista.map((item) => {
          const ativo = estaAtivo(item);
          const carregando = destinoPendente === item.href && !ativo;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                /* A sidebar inteira fica visível no desktop. O prefetch padrão
                   acordava todas as rotas ao mesmo tempo; agora a rota completa
                   só é preparada quando ponteiro ou teclado indicam intenção. */
                prefetch={destinosPreparados.has(item.href)}
                className={styles.item}
                aria-current={ativo ? 'page' : undefined}
                aria-busy={carregando || undefined}
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
                <div>
                  <span className={styles.sobretituloMenu}>Sua plataforma</span>
                  <h2 id={tituloMenuId}>Navegação</h2>
                  <p>Acesse qualquer área sem perder o ponto em que está.</p>
                </div>
                <button
                  ref={botaoFecharRef}
                  type="button"
                  className={styles.fecharMenu}
                  aria-label="Fechar navegação"
                  onClick={() => fecharMenu(true)}
                >
                  <span aria-hidden="true" />
                </button>
              </header>

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
                      <small>Sua identidade</small>
                      <strong>{itemConta.rotulo}</strong>
                    </span>
                    <em>
                      {contaAtiva ? 'Você está aqui' : contaCarregando ? 'Abrindo…' : 'Abrir'}
                    </em>
                  </Link>
                </div>
              )}

              <div className={styles.conteudoMenu}>
                {ORDEM_GRUPOS.map((idGrupo) => {
                  const itensDoGrupo = itens.filter((item) => item.grupo === idGrupo);
                  if (!itensDoGrupo.length) return null;

                  return (
                    <section className={styles.grupoMenu} key={idGrupo}>
                      <h3>{ROTULOS_GRUPO_NAV[idGrupo]}</h3>
                      <div className={styles.gradeMenu}>
                        {itensDoGrupo.map((item) => {
                          const ativo = estaAtivo(item);
                          const carregando = destinoPendente === item.href && !ativo;

                          return (
                            <Link
                              href={item.href}
                              className={styles.itemMenu}
                              aria-current={ativo ? 'page' : undefined}
                              aria-busy={carregando || undefined}
                              data-loading={carregando || undefined}
                              key={item.href}
                              onClick={(evento) => {
                                iniciarNavegacao(evento, item);
                                fecharMenu();
                              }}
                            >
                              <span className={styles.iconeMenu} aria-hidden="true">
                                {item.icone}
                              </span>
                              <span>{item.rotulo}</span>
                              {ativo && <small>Você está aqui</small>}
                              {carregando && <small>Carregando…</small>}
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>
          </>
        )}

        <ul className={`${styles.lista} ${styles.listaDock}`}>
          {itensPrioritarios.map((item) => {
            const ativo = estaAtivo(item);
            const carregando = destinoPendente === item.href && !ativo;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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
              <span className={`${styles.icone} ${styles.iconeMais}`} aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
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
            <section className={styles.grupoLateral} key={`${grupo}-${idGrupo}`}>
              <p className={styles.rotuloGrupo} aria-hidden="true">
                {rotuloGrupo ?? ROTULOS_GRUPO_NAV[idGrupo]}
              </p>
              {renderizarItens(itensDoGrupo)}
            </section>
          );
        })}
      </div>
    </nav>
  );
}
