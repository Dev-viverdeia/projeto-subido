'use client';

import Link from 'next/link';
import { Mic, MonitorUp, Video } from 'lucide-react';
import { useMemo } from 'react';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import { TRILHAS } from '@/lib/mentorias/tipos';
import { RetratoMentor } from '../../_components/RetratoMentor';
import { Visto } from '../../_components/PillEstado';
import { comecaEm, estadoDe, horaCurta, rotuloDoDia } from './estadoMentoria';
import styles from './SalaMentoria.module.css';

/**
 * O corpo da sala: PALCO à esquerda, trilho de contexto à direita.
 *
 * O PALCO É A PENDÊNCIA DECLARADA. A transmissão (LiveKit) entra numa fase
 * seguinte — até lá o palco mostra o estado da sessão com todas as letras, e
 * NUNCA um player falso: controles de mídia ficam desabilitados com o motivo
 * escrito do lado, porque botão morto sem explicação é pior que texto que
 * explica. Quando a integração chegar, o miolo do palco e os controles são os
 * únicos pontos que mudam — o resto da sala já é real (RLS, estados, pauta).
 *
 * `agora` é o instante do SERVIDOR, fixo — o mesmo dos dois lados da
 * hidratação. O relógio não anda na tela; anda no refresh, como em toda a
 * agenda. A contagem de "começa em" pode portanto ficar defasada numa aba
 * esquecida aberta: quem resolve isso é a fase da transmissão, que trará o
 * ciclo de vida de conexão.
 */
export function SalaMentoria({ sessao, agoraIso }: { sessao: SessaoMentoria; agoraIso: string }) {
  const agora = useMemo(() => new Date(agoraIso), [agoraIso]);
  const estado = estadoDe(sessao, agora, sessao.euInscrito);

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
          {/* CHIPS SOBREPOSTOS, como numa sala de verdade: estado no canto
              esquerdo, o número real de confirmados no direito. Vidro sobre a
              navy — com fallback sólido onde não há backdrop-filter. */}
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
          <p className={styles.chipVagas}>
            {sessao.inscritos}/{sessao.vagas} confirmados
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
                Esta sala fica como registro da sessão — tema, pauta e quem mentorou.
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

        {/* O motivo dos controles apagados, dito uma vez, fora do palco. */}
        <p className={styles.controlesNota}>Áudio e vídeo ligam com a transmissão.</p>
      </section>

      <aside className={styles.trilho}>
        {sessao.descricao && (
          <section className={styles.cartao} aria-labelledby="sala-pauta">
            <h2 id="sala-pauta" className={styles.cartaoEyebrow}>
              Pauta
            </h2>
            <p className={styles.pauta}>{sessao.descricao}</p>
          </section>
        )}

        <section className={styles.cartao} aria-labelledby="sala-mentor">
          <h2 id="sala-mentor" className={styles.cartaoEyebrow}>
            Quem mentora
          </h2>
          <div className={styles.mentor}>
            <RetratoMentor
              nome={sessao.mentor.nome}
              fotoUrl={sessao.mentor.foto_url}
              tamanho="md"
            />
            <div className={styles.mentorTextos}>
              <p className={styles.mentorNome}>{sessao.mentor.nome}</p>
              {sessao.mentor.headline && (
                <p className={styles.mentorHeadline}>{sessao.mentor.headline}</p>
              )}
            </div>
          </div>
          <p className={styles.mentorTrilha}>{TRILHAS[sessao.mentor.trilha].rotulo}</p>
        </section>

        <section className={styles.cartao} aria-labelledby="sala-participacao">
          <h2 id="sala-participacao" className={styles.cartaoEyebrow}>
            Participação
          </h2>
          <p className={styles.vagas}>
            <span className={styles.vagasNumero}>
              {sessao.inscritos}/{sessao.vagas}
            </span>
            <span className={styles.vagasRotulo}>confirmados</span>
          </p>

          {sessao.euInscrito ? (
            <p className={styles.meuEstado}>
              <Visto tamanho={11} />
              Seu check-in está confirmado.
            </p>
          ) : encerrada ? null : estado === 'lotada' ? (
            <p className={styles.meuEstadoNota}>Sessão lotada — sem vagas no momento.</p>
          ) : (
            /* O check-in mora na AGENDA (modal de confirmação, recusa do
               trigger) — a sala aponta para lá em vez de duplicar o fluxo. */
            <Link href="/mentorias" className={styles.fazerCheckin}>
              Fazer check-in na agenda
            </Link>
          )}
        </section>
      </aside>
    </div>
  );
}
