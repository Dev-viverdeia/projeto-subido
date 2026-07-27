import type { ReactNode } from 'react';
import Link from 'next/link';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import styles from './MolduraAuth.module.css';

/**
 * A moldura visual das telas de sessão. Só aparência — não decide nada sobre auth.
 *
 * POR QUE ELA É UM COMPONENTE E NÃO UM LAYOUT
 * Duas árvores diferentes precisam desta mesma moldura com regras OPOSTAS de acesso:
 *
 *   `(auth)`        · entrar, criar-conta, recuperar-senha
 *                     quem JÁ TEM sessão é mandado embora
 *   `(recuperacao)` · nova-senha
 *                     só se chega COM sessão — o /auth/callback acabou de criá-la a
 *                     partir do link do e-mail
 *
 * Se `nova-senha` morasse em `(auth)`, o redirect do layout de lá jogaria a pessoa
 * para `/inicio` no exato momento em que ela clicou no link de redefinir senha, e o
 * formulário nunca apareceria. Os dois grupos existem por causa disso; a moldura é
 * compartilhada para que a diferença fique só onde ela é real.
 *
 * A BANDA ESCURA é o mesmo ritmo da landing: a banda navy carrega a marca e a
 * promessa; o lado claro carrega o trabalho. O design system dá a arquitetura visual,
 * mas isso é infraestrutura interna — a única marca exibida é a do Subido.
 */
export function MolduraAuth({ children }: { children: ReactNode }) {
  return (
    <div className={styles.grade}>
      <aside className={`${styles.painel} via-mesh-navy via-noise`}>
        <Link href="/" className={styles.marca} aria-label="Voltar para a página inicial">
          {/* 16 e não 18: o wordmark tem proporção ~12:1, então cada px de altura
              custa 12 de largura. A 18 o lockup ocupava 82% da tela em 375px e a
              faixa escura virava um banner de marca. */}
          <SubidoLogo size={16} />
        </Link>

        <div className={styles.painelTexto}>
          <p className={styles.frase}>
            A assinatura que forma <em>implementadores</em> de IA.
          </p>
          <p className={styles.apoio}>
            Soluções com passo a passo, formações completas, um gerador que monta o projeto a partir
            da sua ideia e mentoria com quem já entregou.
          </p>
        </div>

        <p className={styles.rodape}>Comunidade Subido de Tráfego</p>
      </aside>

      <main className={styles.area} id="conteudo">
        <div className={styles.caixa}>{children}</div>
      </main>
    </div>
  );
}
