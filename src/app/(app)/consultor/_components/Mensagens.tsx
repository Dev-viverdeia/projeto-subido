import Link from 'next/link';
import { ArrowRight, FileText, Image as ImageIcon, Mic, Target } from 'lucide-react';
import { ETAPAS_SOBRAL } from '@/lib/consultor/direcao';
import type { MensagemDoConsultor } from '@/lib/consultor/queries';
import { ConfirmarAcaoCrm } from './ConfirmarAcaoCrm';
import styles from './Mensagens.module.css';

function IconeAnexo({ categoria }: { categoria: 'imagem' | 'documento' | 'audio' }) {
  if (categoria === 'imagem') return <ImageIcon size={15} strokeWidth={1.9} aria-hidden="true" />;
  if (categoria === 'audio') return <Mic size={15} strokeWidth={1.9} aria-hidden="true" />;
  return <FileText size={15} strokeWidth={1.9} aria-hidden="true" />;
}

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
  compacto = false,
}: {
  mensagens: MensagemDoConsultor[];
  modoPreview?: boolean;
  compacto?: boolean;
}) {
  const ultimaAcao = [...mensagens]
    .reverse()
    .find((mensagem) => mensagem.direcao?.contexto_acao && mensagem.acaoConfirmada)?.id;
  const ultimaResposta = [...mensagens]
    .reverse()
    .find((mensagem) => mensagem.papel === 'consultor')?.id;

  return (
    <ol className={`${styles.lista} ${compacto ? styles.compacta : ''}`}>
      {mensagens.map((m) => {
        const detalharResposta = !compacto || m.id === ultimaResposta;
        return (
          <li key={m.id} className={m.papel === 'usuario' ? styles.doUsuario : styles.doConsultor}>
            <div className={styles.corpo}>
              {m.anexos.length > 0 ? (
                <ul className={styles.anexos} aria-label="Arquivos enviados">
                  {m.anexos.map((anexo) => (
                    <li key={anexo.id}>
                      <IconeAnexo categoria={anexo.categoria} />
                      <span>{anexo.nome}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className={styles.texto}>{m.conteudo}</p>

              {detalharResposta && m.direcao && !(compacto && m.direcao.contexto_acao) ? (
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

              {detalharResposta && m.direcao?.contexto_acao ? (
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
              {detalharResposta && m.cartoes.length > 0 && (
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
        );
      })}
    </ol>
  );
}
