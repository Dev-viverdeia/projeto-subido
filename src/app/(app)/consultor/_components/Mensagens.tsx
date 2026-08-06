import Link from 'next/link';
import type { MensagemDoConsultor } from '@/lib/consultor/queries';
import styles from './Mensagens.module.css';

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
          <div className={styles.corpo}>
            <p className={styles.texto}>{m.conteudo}</p>

            {/* Os cartões inline da origem: solução citada vira caminho de um
                clique. Detectados pela Edge Function no texto final e gravados
                com a mensagem — a tela só lê, nunca reparseia. */}
            {m.cartoes.length > 0 && (
              <ul className={styles.cartoes}>
                {m.cartoes.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/solucoes/${c.slug}`} className={styles.cartao}>
                      <span className={styles.cartaoRotulo}>
                        {c.categoria ?? 'Solução'} · catálogo
                      </span>
                      <span className={styles.cartaoTitulo}>{c.titulo}</span>
                      <span className={styles.cartaoAcao}>Ver solução →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
