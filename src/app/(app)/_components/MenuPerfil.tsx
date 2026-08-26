'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, ChevronDown, Cloud, Coins, CreditCard, LogOut, UserRound } from 'lucide-react';
import { Avatar } from '@/design-system/via';
import { sair } from '@/lib/auth/actions';
import styles from './MenuPerfil.module.css';
import { PLANOS_SUBIDO, type PlanoSubido } from '@/lib/planos/acessos';

/**
 * Porta de entrada da identidade do profissional.
 *
 * Os destinos continuam como links reais e o logout permanece um POST server-side.
 * Escape devolve o foco ao gatilho, ArrowDown abre direto no primeiro item e clique
 * fora fecha o painel sem alterar a página atual.
 */
export function MenuPerfil({
  nome,
  email,
  saldoCreditos = null,
  plano = 'pro',
}: {
  nome: string;
  email: string;
  saldoCreditos?: number | null;
  plano?: PlanoSubido;
}) {
  const [aberto, setAberto] = useState(false);
  const idMenu = useId();
  const caminho = usePathname();
  const raiz = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const primeiroItem = useRef<HTMLAnchorElement>(null);
  const focarPrimeiroAoAbrir = useRef(false);

  useEffect(() => {
    if (!aberto || !focarPrimeiroAoAbrir.current) return;
    focarPrimeiroAoAbrir.current = false;
    primeiroItem.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setAberto(false);
      gatilho.current?.focus();
    }

    function aoApontar(e: PointerEvent) {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    }

    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoApontar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoApontar);
    };
  }, [aberto]);

  function abrirComFoco() {
    focarPrimeiroAoAbrir.current = true;
    setAberto(true);
  }

  return (
    <div className={styles.raiz} ref={raiz}>
      <button
        ref={gatilho}
        type="button"
        className={styles.gatilho}
        aria-expanded={aberto}
        aria-haspopup="menu"
        aria-controls={aberto ? idMenu : undefined}
        onClick={() => setAberto((valor) => !valor)}
        onKeyDown={(evento) => {
          if (evento.key !== 'ArrowDown') return;
          evento.preventDefault();
          abrirComFoco();
        }}
      >
        {saldoCreditos !== null ? (
          <span
            className={styles.saldoGatilho}
            aria-label={`${saldoCreditos} créditos disponíveis`}
          >
            <Coins size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className={styles.saldoNumero}>{saldoCreditos}</span>
            <span className={styles.saldoRotulo}>créditos</span>
          </span>
        ) : null}
        <Avatar alt={nome} size="sm" aria-hidden="true" />
        <span className={styles.nomeGatilho}>{nome}</span>
        <ChevronDown
          size={15}
          strokeWidth={1.8}
          className={styles.seta}
          data-aberto={aberto || undefined}
          aria-hidden="true"
        />
      </button>

      {aberto && (
        <div className={styles.painel} id={idMenu} role="menu">
          <div className={styles.identidade}>
            <Avatar alt={nome} size="md" aria-hidden="true" />
            <div className={styles.textosIdentidade}>
              <span className={styles.sobretitulo}>Sua conta</span>
              <strong className={styles.nome}>{nome}</strong>
              <span className={styles.email}>{email}</span>
            </div>
            <span className={styles.sincronizada}>
              <Cloud size={13} strokeWidth={1.8} aria-hidden="true" />
              Sincronizada
            </span>
            <span className={styles.planoSaldo}>
              {PLANOS_SUBIDO[plano].nome}
              {saldoCreditos !== null ? ` · ${saldoCreditos} créditos` : ''}
            </span>
          </div>

          <div className={styles.itens}>
            <Link
              ref={primeiroItem}
              href="/conta"
              role="menuitem"
              aria-current={caminho === '/conta' ? 'page' : undefined}
              className={styles.item}
              onClick={() => setAberto(false)}
            >
              <span className={styles.iconeItem} aria-hidden="true">
                <UserRound size={17} strokeWidth={1.8} />
              </span>
              <span>
                <strong>Minha conta</strong>
                <small>Perfil e segurança</small>
              </span>
              <span className={styles.indicador} aria-hidden="true" />
            </Link>

            <Link
              href="/conta/creditos"
              role="menuitem"
              aria-current={caminho === '/conta/creditos' ? 'page' : undefined}
              className={styles.item}
              onClick={() => setAberto(false)}
            >
              <span className={styles.iconeItem} aria-hidden="true">
                <Coins size={17} strokeWidth={1.8} />
              </span>
              <span>
                <strong>Créditos</strong>
                <small>
                  {saldoCreditos !== null
                    ? `${saldoCreditos} disponíveis · ver extrato`
                    : 'Saldo e extrato'}
                </small>
              </span>
              <span className={styles.indicador} aria-hidden="true" />
            </Link>

            <Link
              href="/conta/assinatura"
              role="menuitem"
              aria-current={caminho === '/conta/assinatura' ? 'page' : undefined}
              className={styles.item}
              onClick={() => setAberto(false)}
            >
              <span className={styles.iconeItem} aria-hidden="true">
                <CreditCard size={17} strokeWidth={1.8} />
              </span>
              <span>
                <strong>Plano e cobrança</strong>
                <small>{PLANOS_SUBIDO[plano].nome} · gerenciar acesso</small>
              </span>
              <span className={styles.indicador} aria-hidden="true" />
            </Link>

            <Link
              href="/certificados"
              role="menuitem"
              aria-current={caminho === '/certificados' ? 'page' : undefined}
              className={styles.item}
              onClick={() => setAberto(false)}
            >
              <span className={styles.iconeItem} aria-hidden="true">
                <Award size={17} strokeWidth={1.8} />
              </span>
              <span>
                <strong>Certificados</strong>
                <small>Formações e projetos concluídos</small>
              </span>
              <span className={styles.indicador} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.rodape}>
            <form action={sair}>
              <button type="submit" role="menuitem" className={styles.sair}>
                <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
                Encerrar sessão
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
