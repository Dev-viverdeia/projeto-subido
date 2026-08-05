import styles from './Mensagens.module.css';
import type { MensagemDoConsultor } from '@/lib/consultor/queries';

/**
 * O histórico gravado — Server Component puro: o texto vem do banco pelo RSC e
 * nenhum byte disto entra no bundle do cliente.
 *
 * Usuário à direita em navy, consultor à esquerda em superfície — a distinção é
 * por POSIÇÃO e cor sólida, sem avatar: numa conversa de duas vozes, avatar é
 * mobília.
 */
export function Mensagens({ mensagens }: { mensagens: MensagemDoConsultor[] }) {
  return (
    <ol className={styles.lista}>
      {mensagens.map((m) => (
        <li key={m.id} className={m.papel === 'usuario' ? styles.doUsuario : styles.doConsultor}>
          <p className={styles.texto}>{m.conteudo}</p>
        </li>
      ))}
    </ol>
  );
}
