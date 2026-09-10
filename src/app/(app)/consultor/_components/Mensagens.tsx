import { Fragment } from 'react';
import { IconeProduto } from '@/components/brand/IconeProduto';
import { BotaoCopiar } from '@/app/(app)/_components/BotaoCopiar';
import type { MensagemDoConsultor } from '@/lib/consultor/queries';
import { AudioMensagem } from './AudioMensagem';
import { ArquivoMensagem } from './ArquivoMensagem';
import { TextoResposta } from './TextoResposta';
import { ProximaAcaoResposta } from './ProximaAcaoResposta';
import { RecomendacoesResposta } from './RecomendacoesResposta';
import styles from './Mensagens.module.css';

function ehTextoAutomaticoDeAudio(mensagem: MensagemDoConsultor): boolean {
  if (
    mensagem.anexos.length === 0 ||
    mensagem.anexos.some((anexo) => anexo.categoria !== 'audio')
  ) {
    return false;
  }
  return (
    mensagem.conteudo === 'Áudio enviado.' ||
    mensagem.conteudo.startsWith('Analise o arquivo ') ||
    mensagem.conteudo.startsWith('Analise estes ')
  );
}

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
  mensagemAvulsa,
}: {
  mensagens: MensagemDoConsultor[];
  modoPreview?: boolean;
  compacto?: boolean;
  mensagemAvulsa?: string;
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
          <Fragment key={m.id}>
            <li
              id={`sobral-mensagem-${m.id}`}
              tabIndex={-1}
              aria-label={m.papel === 'usuario' ? 'Sua mensagem' : 'Resposta do Sobral AI'}
              className={m.papel === 'usuario' ? styles.doUsuario : styles.doConsultor}
              data-resposta-sobral={m.papel === 'consultor' ? '' : undefined}
            >
              <div className={styles.corpo}>
                {m.anexos.some((anexo) => anexo.categoria === 'audio') ? (
                  <div className={styles.audios} aria-label="Mensagens de áudio">
                    {m.anexos
                      .filter((anexo) => anexo.categoria === 'audio')
                      .map((anexo) => (
                        <div key={anexo.id} className={styles.audioComTranscricao}>
                          <AudioMensagem
                            estado="Enviado"
                            src={
                              modoPreview
                                ? 'data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAACA'
                                : `/api/consultor/anexos/${anexo.id}`
                            }
                          />
                          {anexo.transcricao ? (
                            <details className={styles.transcricao}>
                              <summary>Ver transcrição</summary>
                              <p>{anexo.transcricao}</p>
                            </details>
                          ) : null}
                        </div>
                      ))}
                  </div>
                ) : null}
                {m.anexos.some((anexo) => anexo.categoria !== 'audio') ? (
                  <ul className={styles.arquivosEnviados} aria-label="Arquivos enviados">
                    {m.anexos
                      .filter((anexo) => anexo.categoria !== 'audio')
                      .map((anexo) => (
                        <li key={anexo.id}>
                          <ArquivoMensagem
                            nome={anexo.nome}
                            tamanho={anexo.tamanhoBytes}
                            tipoMime={anexo.tipoMime}
                            categoria={anexo.categoria as 'imagem' | 'documento'}
                            estado="Enviado"
                            src={modoPreview ? undefined : `/api/consultor/anexos/${anexo.id}`}
                          />
                        </li>
                      ))}
                  </ul>
                ) : null}
                {m.papel === 'consultor' ? (
                  <span className={styles.autor}>
                    <IconeProduto nome="sobral" tamanho={20} /> Sobral AI
                  </span>
                ) : null}
                {m.papel === 'consultor' ? (
                  <TextoResposta texto={m.conteudo} />
                ) : ehTextoAutomaticoDeAudio(m) ? null : (
                  <p className={styles.texto}>{m.conteudo}</p>
                )}

                {m.papel === 'consultor' && detalharResposta ? (
                  <div className={styles.utilidadesResposta}>
                    <BotaoCopiar texto={m.conteudo} rotuloDoQue="a resposta do Sobral AI" />
                  </div>
                ) : null}

                {detalharResposta && m.direcao ? (
                  <ProximaAcaoResposta
                    mensagem={m}
                    modoPreview={modoPreview}
                    gerarProximoPasso={m.id === ultimaAcao}
                  />
                ) : null}

                {/* Conteúdo recomendado é validado contra o catálogo antes de ser
                gravado. A tela só exibe caminhos que existem no produto. */}
                {detalharResposta && m.cartoes.length > 0 && (
                  <RecomendacoesResposta cartoes={m.cartoes} />
                )}
              </div>
            </li>
            {m.id === mensagemAvulsa ? (
              <li className={styles.intervalo}>
                Conversa recente abaixo · outras mensagens ficam entre estes trechos
              </li>
            ) : null}
            {m.id !== mensagens.at(-1)?.id &&
            m.geracao &&
            ['interrompida', 'falhou'].includes(m.geracao.estado) ? (
              <li className={styles.doConsultor}>
                <div className={styles.corpo}>
                  <span className={styles.autor}>Sobral AI · resposta interrompida</span>
                  {m.geracao.texto ? <TextoResposta texto={m.geracao.texto} completa /> : null}
                </div>
              </li>
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}
