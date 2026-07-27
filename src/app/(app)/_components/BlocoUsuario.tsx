import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/design-system/via';
import { sair } from '@/lib/auth/actions';
import styles from './BlocoUsuario.module.css';

/**
 * Identidade + sair. SERVER COMPONENT — custa zero JS.
 *
 * O botão de sair é um `<form action={serverAction}>`, não um `onClick`. Além de
 * não carregar JS nenhum, ele funciona com JavaScript desabilitado e é um POST — e
 * logout precisa ser POST: um `<a href="/sair">` seria disparado por qualquer
 * prefetch de link ou scanner de antivírus, deslogando a pessoa sozinha.
 */
export function BlocoUsuario({ nome, email }: { nome: string; email: string }) {
  return (
    <div className={styles.bloco}>
      <Link href="/conta" className={styles.identidade}>
        {/* `alt` é o que o DS usa para derivar as iniciais. `aria-hidden` porque o
            nome está escrito ao lado — sem isso o leitor de tela anuncia duas vezes. */}
        <Avatar alt={nome} size="sm" aria-hidden="true" />
        <span className={styles.textos}>
          <span className={styles.nome}>{nome}</span>
          <span className={styles.email}>{email}</span>
        </span>
      </Link>

      <form action={sair}>
        <button type="submit" className={styles.sair} aria-label="Sair da conta">
          <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
