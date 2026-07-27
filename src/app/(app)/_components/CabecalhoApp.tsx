'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { rotuloDaRota } from '@/lib/routes';
import { MenuPerfil } from './MenuPerfil';
import styles from './CabecalhoApp.module.css';

/**
 * Cabeçalho da área logada.
 *
 * O QUE ELE CARREGA, E O QUE NÃO CARREGA
 * À esquerda, o nome da seção — e só ele. Em desktop a sidebar já mostra onde a
 * pessoa está, então o rótulo aqui parece redundante parado no topo; ele deixa de
 * ser quando a página rola e o `<h1>` sai de vista, que é justamente quando o
 * cabeçalho continua colado. No mobile, onde não há sidebar, o lugar da esquerda é
 * do logotipo.
 *
 * Nada de título de página duplicado: o `<h1>` mora no CabecalhoPagina, dentro do
 * conteúdo, e dois títulos na mesma tela é o começo de uma hierarquia que ninguém
 * mais consegue ler.
 *
 * `logo` chega como PROP, já renderizado no servidor. O SubidoLogo é Server
 * Component e desenha SVG; recebê-lo pronto evita arrastar a marca e o
 * `lucide-react` que ela vizinha para o bundle do cliente — este arquivo é cliente
 * só por causa do `usePathname`.
 */
export function CabecalhoApp({
  nome,
  email,
  logo,
}: {
  nome: string;
  email: string;
  logo: ReactNode;
}) {
  const caminho = usePathname();
  const secao = rotuloDaRota(caminho);

  return (
    <header className={styles.cabecalho}>
      <Link href="/inicio" className={styles.marca} aria-label="Ir para o início">
        {logo}
      </Link>

      {/* `aria-hidden`: em desktop este rótulo é eco do <h1> da página. Para quem
          navega por leitor de tela, ouvir a seção duas vezes a cada rota é ruído. */}
      {secao && (
        <span className={styles.secao} aria-hidden="true">
          {secao}
        </span>
      )}

      <div className={styles.direita}>
        <MenuPerfil nome={nome} email={email} />
      </div>
    </header>
  );
}
