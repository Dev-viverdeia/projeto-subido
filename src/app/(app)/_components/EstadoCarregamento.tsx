import { Spinner } from '@/design-system/via';
import styles from './EstadoCarregamento.module.css';

/**
 * Feedback compartilhado para esperas de rota.
 *
 * O skeleton preserva a geometria da tela que chegará; este bloco responde à
 * pergunta que o skeleton sozinho não responde: "a plataforma recebeu meu
 * comando?". Ele sempre descreve a área real e usa progresso indeterminado —
 * nenhum percentual é inventado sem uma medição do servidor.
 */
export function EstadoCarregamento({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <section className={styles.estado} aria-live="polite" aria-busy="true">
      <span className={styles.icone} aria-hidden="true">
        <Spinner size="md" tone="navy" />
      </span>
      <span className={styles.texto}>
        <small>Plataforma respondendo</small>
        <strong>{titulo}</strong>
        <span>{descricao}</span>
      </span>
      <span className={styles.trilho} aria-hidden="true">
        <span />
      </span>
    </section>
  );
}
