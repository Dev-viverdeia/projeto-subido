'use client';

import Link from 'next/link';
import { ArrowUp, Mic, MonitorUp, Video } from 'lucide-react';
import { useMemo } from 'react';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { RetratoMentor } from '../../_components/RetratoMentor';
import { comecaEm, horaCurta, rotuloDoDia } from './estadoMentoria';
import styles from './SalaMentoria.module.css';

/**
 * O corpo da sala: PALCO à esquerda, CHAT à direita. O contexto (mentor,
 * participação) mora no header da página — o corpo é só o que acontece
 * DURANTE a sessão.
 *
 * PALCO E CHAT SÃO A PENDÊNCIA DECLARADA. A transmissão e o chat entram com a
 * integração (LiveKit) — até lá cada um mostra o próprio estado com todas as
 * letras. Nunca um player falso, nunca mensagens de figurantes: o chat vazio
 * diz que abre com a transmissão, e o compositor fica desabilitado com o
 * motivo à vista. Quando a integração chegar, o miolo do palco, a lista de
 * mensagens e o compositor são os únicos pontos que mudam.
 *
 * `agora` é o instante do SERVIDOR, fixo — o mesmo dos dois lados da
 * hidratação. O relógio não anda na tela; anda no refresh, como em toda a
 * agenda. A contagem de "começa em" pode portanto ficar defasada numa aba
 * esquecida aberta: quem resolve isso é a fase da transmissão, que trará o
 * ciclo de vida de conexão.
 */
export function SalaMentoria({ sessao, agoraIso }: { sessao: SessaoMentoria; agoraIso: string }) {
  const agora = useMemo(() => new Date(agoraIso), [agoraIso]);

  const aoVivo =
    agora.getTime() >= new Date(sessao.inicioIso).getTime() &&
    agora.getTime() < new Date(sessao.fimIso).getTime();
  const encerrada = agora.getTime() >= new Date(sessao.fimIso).getTime();

  const dia = rotuloDoDia(sessao.inicioIso, agora);
  const contagem = comecaEm(sessao, agora);

  return (
    <div className={styles.corpo}>
      <section className={styles.palcoColuna} aria-label="Transmissão">
        <div
          className={`${styles.palco} via-mesh-navy via-noise`}
          data-ao-vivo={aoVivo ? '' : undefined}
        >
          {/* O CHIP de estado sobreposto no canto, em vidro sobre a navy (com
              fallback sólido). Só ele: os confirmados moram no header agora —
              o chip duplicado ficava a 20px do mesmo número. */}
          <p className={styles.chipEstado}>
            {aoVivo ? (
              <>
                <span className={styles.pulso} aria-hidden="true" />
                ao vivo
              </>
            ) : encerrada ? (
              'encerrada'
            ) : (
              (contagem ?? `programada · ${dia.mono}`)
            )}
          </p>
          {aoVivo ? (
            /* O TILE do momento: quem mentora, como o vídeo vai mostrar. Dado
               real — retrato derivado do nome, nunca figurante. */
            <div className={styles.palcoMiolo}>
              <RetratoMentor
                nome={sessao.mentor.nome}
                fotoUrl={sessao.mentor.foto_url}
                tamanho="lg"
              />
              <p className={styles.palcoNome}>{sessao.mentor.nome}</p>
              <p className={styles.palcoPapel}>mentora esta sessão</p>
              <p className={styles.palcoNota}>
                A transmissão entra aqui — o vídeo é a próxima fase da sala.
              </p>
            </div>
          ) : encerrada ? (
            <div className={styles.palcoMiolo}>
              <p className={styles.palcoHora}>
                {horaCurta(sessao.inicioIso)}–{horaCurta(sessao.fimIso)}
              </p>
              <p className={styles.palcoData}>{dia.mono}</p>
              <p className={styles.palcoNota}>
                Esta sala fica como registro da sessão — tema, horário e quem mentorou.
              </p>
            </div>
          ) : (
            <div className={styles.palcoMiolo}>
              <p className={styles.palcoHora}>{horaCurta(sessao.inicioIso)}</p>
              <p className={styles.palcoData}>{dia.mono}</p>
              <p className={styles.palcoNota}>
                A transmissão abre aqui na hora da sessão. Deixe o check-in feito para garantir a
                vaga.
              </p>
            </div>
          )}

          {/* A BARRA DE CONTROLES flutua DENTRO do palco, como em qualquer sala
              de vídeo — é a anatomia final; a integração só liga os três
              primeiros. Raios concêntricos: barra 20, controles 12, folga 8. */}
          <div className={styles.barra}>
            <button type="button" className={styles.controle} disabled aria-label="Microfone">
              <Mic size={17} strokeWidth={1.8} />
            </button>
            <button type="button" className={styles.controle} disabled aria-label="Câmera">
              <Video size={17} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              className={styles.controle}
              disabled
              aria-label="Compartilhar tela"
            >
              <MonitorUp size={17} strokeWidth={1.8} />
            </button>
            <span className={styles.barraDivisor} aria-hidden="true" />
            <Link href="/mentorias" className={styles.sair}>
              Sair da sala
            </Link>
          </div>
        </div>

        {/* O motivo de tudo que está apagado, dito uma vez, fora do palco. */}
        <p className={styles.controlesNota}>Áudio, vídeo e chat ligam com a transmissão.</p>
      </section>
      {/* O CHAT da sessão — a coluna de conversa de toda sala ao vivo. */}
      <section className={styles.chat} aria-label="Chat da sessão">
        <div className={styles.chatTopo}>
          <h2 className={styles.chatEyebrow}>Chat da sessão</h2>
        </div>

        <div className={styles.chatMiolo}>
          <p className={styles.chatVazio}>
            {encerrada
              ? 'A sessão encerrou — o chat fica fechado.'
              : 'As mensagens da sala aparecem aqui. O chat abre com a transmissão.'}
          </p>
        </div>

        <div className={styles.chatCompositor}>
          <input
            type="text"
            className={styles.chatCampo}
            placeholder="Escreva para a sala…"
            disabled
            aria-label="Mensagem para a sala"
          />
          <button type="button" className={styles.chatEnviar} disabled aria-label="Enviar mensagem">
            <ArrowUp size={15} strokeWidth={2} />
          </button>
        </div>
      </section>
    </div>
  );
}
