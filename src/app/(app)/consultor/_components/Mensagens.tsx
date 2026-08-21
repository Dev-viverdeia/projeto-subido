import Link from 'next/link';
import { ArrowRight, Target } from 'lucide-react';
import { ETAPAS_SOBRAL } from '@/lib/consultor/direcao';
import type { MensagemDoConsultor } from '@/lib/consultor/queries';
import { ConfirmarAcaoCrm } from './ConfirmarAcaoCrm';
import styles from './Mensagens.module.css';

const ACAO_POR_TIPO = {
  aula: 'Abrir aula',
  formacao: 'Abrir formação',
  projeto: 'Abrir projeto',
  ferramenta: 'Ver no projeto',
} as const;

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
  const ultimaAcao = [...mensagens]
    .reverse()
    .find((mensagem) => mensagem.direcao?.contexto_acao && mensagem.acaoConfirmada)?.id;

  return (
    <ol className={styles.lista}>
      {mensagens.map((m) => (
        <li key={m.id} className={m.papel === 'usuario' ? styles.doUsuario : styles.doConsultor}>
          <div className={styles.corpo}>
            <p className={styles.texto}>{m.conteudo}</p>

            {m.direcao ? (
              <aside className={styles.direcao} aria-label="Plano gerado nesta resposta">
                <div className={styles.direcaoRotulo}>
                  <Target size={14} strokeWidth={2} aria-hidden="true" />
                  <span>
                    Plano ·{' '}
                    {ETAPAS_SOBRAL.find((etapa) => etapa.id === m.direcao?.etapa)?.titulo ??
                      m.direcao.etapa}
                  </span>
                </div>
                <strong>{m.direcao.proximo_passo.titulo}</strong>
                <p>{m.direcao.proximo_passo.evidencia}</p>
                <Link
                  href={
                    m.direcao.contexto_acao
                      ? `/vendas/${m.direcao.contexto_acao.oportunidade_id}`
                      : m.direcao.proximo_passo.destino
                  }
                  className={styles.direcaoAcao}
                >
                  {m.direcao.contexto_acao ? 'Abrir ficha' : 'Fazer próxima ação'}
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
                gerarProximoPasso={m.id === ultimaAcao}
              />
            ) : null}

            {/* Conteúdo recomendado é validado contra o catálogo antes de ser
                gravado. A tela só exibe caminhos que existem no produto. */}
            {m.cartoes.length > 0 && (
              <ul className={styles.cartoes}>
                {m.cartoes.map((c) => (
                  <li key={`${c.tipo}:${c.chave}`}>
                    <Link href={c.href} className={styles.cartao}>
                      <span className={styles.cartaoRotulo}>{c.rotulo}</span>
                      <span className={styles.cartaoTitulo}>{c.titulo}</span>
                      <span className={styles.cartaoMotivo}>{c.motivo}</span>
                      <span className={styles.cartaoAcao}>{ACAO_POR_TIPO[c.tipo]} →</span>
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
