import type { ReactNode } from 'react';
import Link from 'next/link';
import { MenuPerfil } from './MenuPerfil';
import styles from './CabecalhoApp.module.css';

/**
 * Cabeçalho da área logada.
 *
 * ELE VOLTOU A SER SERVER COMPONENT. Era cliente só por causa do `usePathname`,
 * que servia para descobrir o nome da seção. Esse pedaço mudou de casa: quem
 * decide o que aparece à esquerda agora é o slot paralelo `@trilha`, e o
 * cabeçalho só o renderiza. Sobrou zero JS de cabeçalho no browser além do
 * `MenuPerfil`, que é cliente por natureza.
 *
 * O QUE A ESQUERDA CARREGA
 * Numa listagem, o nome da seção — a única coisa que diz onde a pessoa está,
 * já que o `<h1>` das telas de índice é `sr-only`. Numa tela de DETALHE, a
 * trilha: volta, recorte e título do item. As duas formas vêm do slot; o
 * cabeçalho não ramifica.
 *
 * ABAIXO DE 1024 o lugar da esquerda é do LOGOTIPO, porque não há sidebar para
 * carregá-lo — e por isso a trilha e o rótulo de seção só aparecem em desktop.
 * A volta no mobile é o `BotaoVoltar` que as fichas já renderizam no corpo.
 *
 * `logo` chega como PROP já renderizada. Hoje o motivo mudou de "evitar bundle"
 * para "manter a montagem num lugar só": é o layout que decide o tamanho da
 * marca, e o cabeçalho não precisa saber qual é.
 */
export function CabecalhoApp({
  nome,
  email,
  logo,
  trilha,
}: {
  nome: string;
  email: string;
  logo: ReactNode;
  /** Slot `@trilha`: rótulo de seção por padrão, trilha nas telas de detalhe. */
  trilha: ReactNode;
}) {
  return (
    <header className={styles.cabecalho}>
      <Link href="/inicio" className={styles.marca} aria-label="Ir para o início">
        {logo}
      </Link>

      <div className={styles.esquerda}>{trilha}</div>

      <div className={styles.direita}>
        <MenuPerfil nome={nome} email={email} />
      </div>
    </header>
  );
}
