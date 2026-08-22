import type { ReactNode } from 'react';
import Link from 'next/link';
import { MenuPerfil } from './MenuPerfil';
import { TrilhaDoCabecalho } from './trilha/TrilhaDoCabecalho';
import styles from './CabecalhoApp.module.css';
import type { PlanoSubido } from '@/lib/planos/acessos';

/**
 * Cabeçalho da área logada.
 *
 * ELE É SERVER COMPONENT. O pedaço que precisa do cliente — decidir entre trilha
 * e nome de seção — está isolado no `TrilhaDoCabecalho`, que é a única coisa que
 * hidrata aqui além do `MenuPerfil`.
 *
 * O QUE A ESQUERDA CARREGA
 * Numa listagem, o nome da seção — a única coisa que diz onde a pessoa está, já
 * que o `<h1>` das telas de índice é `sr-only`. Numa tela de DETALHE, a trilha:
 * volta, recorte e título do item. Quem escolhe entre as duas é o próprio
 * `TrilhaDoCabecalho`; este arquivo não ramifica por rota.
 *
 * ABAIXO DE 1024 o lugar da esquerda é do LOGOTIPO, porque não há sidebar para
 * carregá-lo — e por isso a trilha e o rótulo de seção só aparecem em desktop.
 * A volta no mobile é o primeiro degrau da própria trilha (`‹ Soluções de IA`),
 * que é link em qualquer largura. As fichas já não renderizam botão de voltar no
 * corpo — ele duplicava esse degrau.
 *
 * `logo` chega como PROP já renderizada. Hoje o motivo mudou de "evitar bundle"
 * para "manter a montagem num lugar só": é o layout que decide o tamanho da
 * marca, e o cabeçalho não precisa saber qual é.
 */
export function CabecalhoApp({
  nome,
  email,
  saldoCreditos,
  plano,
  logo,
}: {
  nome: string;
  email: string;
  saldoCreditos: number | null;
  plano: PlanoSubido;
  logo: ReactNode;
}) {
  return (
    <header className={styles.cabecalho}>
      <Link href="/inicio" className={styles.marca} aria-label="Ir para o início">
        {logo}
      </Link>

      <div className={styles.esquerda}>
        <TrilhaDoCabecalho />
      </div>

      <div className={styles.direita}>
        <MenuPerfil nome={nome} email={email} saldoCreditos={saldoCreditos} plano={plano} />
      </div>
    </header>
  );
}
