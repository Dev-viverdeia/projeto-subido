import Link from 'next/link';
import { ArrowRight, Target } from 'lucide-react';
import { ETAPAS_SOBRAL } from '@/lib/consultor/direcao';
import type { MensagemDoConsultor } from '@/lib/consultor/queries';
import { ConfirmarAcaoCrm } from './ConfirmarAcaoCrm';
import styles from './Mensagens.module.css';

/**
 * O histórico gravado — Server Component puro: o texto vem do banco pelo RSC e
 * nenhum byte disto entra no bundle do cliente.
 *
 * Usuário à direita em navy, consultor à esquerda em superfície — a distinção é
 * por POSIÇÃO e cor sólida, sem avatar: numa conversa de duas vozes, avatar é
 * mobília.
 */
export function Mensagens({
  mensagens,
  modoPreview = false,
}: {
  mensagens: MensagemDoConsultor[];
  modoPreview?: boolean;
}) {
  return (
    <ol className={styles.lista}>
      {mensagens.map((m) => (
        <li key={m.id} className={m.papel === 'usuario' ? styles.doUsuario : styles.doConsultor}>
          <div className={styles.corpo}>
            <p className={styles.texto}>{m.conteudo}</p>

            {m.direcao ? (
              <aside className={styles.direcao} aria-label="Direção gerada nesta resposta">
                <div className={styles.direcaoRotulo}>
                  <Target size={14} strokeWidth={2} aria-hidden="true" />
                  <span>
                    Direção ·{' '}
                    {ETAPAS_SOBRAL.find((etapa) => etapa.id === m.direcao?.etapa)?.titulo ??
                      m.direcao.etapa}
                  </span>
                </div>
                <strong>{m.direcao.proximo_passo.titulo}</strong>
                <p>{m.direcao.proximo_passo.evidencia}</p>
                <Link
                  href={
                    m.direcao.contexto_acao
                      ? `/crm/${m.direcao.contexto_acao.oportunidade_id}`
                      : m.direcao.proximo_passo.destino
                  }
                  className={styles.direcaoAcao}
                >
                  {m.direcao.contexto_acao ? 'Ver oportunidade' : 'Executar próximo passo'}
                  <ArrowRight size={14} strokeWidth={2.2} aria-hidden="true" />
                </Link>
              </aside>
            ) : null}

            {m.direcao?.contexto_acao ? (
              <ConfirmarAcaoCrm
                mensagemId={m.id}
                contexto={m.direcao.contexto_acao}
                confirmada={m.acaoConfirmada}
                modoPreview={modoPreview}
              />
            ) : null}

            {/* Projeto citado vira caminho de um clique. Detectado pelo Route
                Handler no texto final e gravado
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
