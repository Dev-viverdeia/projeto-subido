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
export function BlocoUsuario({
  nome,
  email,
  compacto = false,
}: {
  nome: string;
  email: string;
  /**
   * Só o avatar, sem nome nem e-mail.
   *
   * Usado na barra do topo do mobile, onde o lockup já toma a maior parte da
   * largura: com o texto, o header media 540px numa viewport de 375px e a página
   * inteira ganhava scroll horizontal. Nome e e-mail continuam a um toque de
   * distância — o avatar leva para /conta.
   */
  compacto?: boolean;
}) {
  return (
    <div className={styles.bloco}>
      <Link
        href="/conta"
        className={styles.identidade}
        /* Sem o texto ao lado, o link fica sem nome acessível. */
        aria-label={compacto ? `Conta de ${nome}` : undefined}
      >
        {/* `alt` é o que o DS usa para derivar as iniciais. Fora do modo compacto o
            nome está escrito ao lado, então o avatar é decorativo e some da árvore
            de acessibilidade para não ser anunciado duas vezes. */}
        <Avatar alt={nome} size="sm" aria-hidden="true" />
        {!compacto && (
          <span className={styles.textos}>
            <span className={styles.nome}>{nome}</span>
            <span className={styles.email}>{email}</span>
          </span>
        )}
      </Link>

      <form action={sair}>
        <button type="submit" className={styles.sair} aria-label="Sair da conta">
          <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
