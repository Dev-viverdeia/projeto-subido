'use client';

import { Button } from '@/design-system/via';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import type { EstadoMentoria } from './estadoMentoria';
import { duracaoMin, horaCurta, rotuloDoDia } from './estadoMentoria';
import { RetratoMentor } from '../../_components/RetratoMentor';
import { Visto } from '../../_components/PillEstado';
import styles from './ItemAgenda.module.css';

/**
 * Uma linha da agenda (~60px): hora | título + mentor | vagas + CTA por estado.
 * A MATRIZ DE ESTADOS é o coração — cada estado tem exatamente uma cara:
 *
 *   ao-vivo        dot pulsante + AO VIVO + entrar (desabilitado nesta fase)
 *   checkin-aberto botão "Fazer check-in"
 *   inscrito       "Check-in confirmado" + cancelar
 *   lotada         "12/12 · lotada" em mono, sem CTA
 *   fora-da-janela "check-in abre SEX · 4 JUL" em mono
 *   encerrada      não renderiza (filtrada antes)
 *
 * A LINHA DEIXOU DE SER UM BOTÃO, e isso conserta um defeito de teclado.
 *
 * Ela era um `<article role="button" tabIndex={0}>` com botões DENTRO — controle
 * interativo aninhado, que o HTML não permite e o leitor de tela achata. Pior: o
 * `onKeyDown` do artigo captura os eventos que sobem dos filhos, então apertar
 * ESPAÇO em "Fazer check-in" rodava `preventDefault()` e abria a ficha. O botão
 * nunca era acionado: quem navega por teclado não conseguia fazer check-in, e o
 * que acontecia em vez disso era um modal abrindo sem explicação. O
 * `stopPropagation` nos `onClick` protegia o mouse e só o mouse.
 *
 * A correção é o padrão de sobreposição: o título é um `<button>` de verdade e o
 * `::after` dele cobre a linha inteira, então o clique em qualquer lugar continua
 * abrindo a ficha. Os CTAs sobem com `z-index` e ficam ACIMA da sobreposição —
 * cada um recebe o próprio clique, sem `stopPropagation` e sem aninhamento.
 */
export function ItemAgenda({
  sessao,
  estado,
  agora,
  gravando,
  aoAbrirDetalhe,
  aoFazerCheckin,
  aoCancelarCheckin,
}: {
  sessao: SessaoMentoria;
  estado: EstadoMentoria;
  agora: Date;
  /** Uma gravação em voo — trava os CTAs para não disparar duas vezes. */
  gravando: boolean;
  aoAbrirDetalhe: () => void;
  aoFazerCheckin: () => void;
  aoCancelarCheckin: () => void;
}) {
  const mentor = sessao.mentor;
  const lotada = estado === 'lotada';

  return (
    <article className={styles.item} data-ao-vivo={estado === 'ao-vivo' ? '' : undefined}>
      <div className={styles.hora}>
        <span className={styles.horaValor}>{horaCurta(sessao.inicioIso)}</span>
        <span className={styles.duracao}>{duracaoMin(sessao)} min</span>
      </div>

      <span className={styles.divisor} aria-hidden="true" />

      <div className={styles.centro}>
        {/* O botão do título É a linha: o `::after` dele cobre o artigo inteiro.
            O nome acessível passa a ser só o título — não a soma de tudo que a
            linha mostra, que era o que o `role="button"` no artigo produzia. */}
        <button type="button" className={styles.abrir} onClick={aoAbrirDetalhe}>
          {sessao.titulo}
        </button>

        {/* Só o NOME. A headline ocupava 232px repetindo a mesma frase em cada
            linha — em lista, informação idêntica em toda linha é ruído, não
            contexto. Ela vive na ficha da sessão, onde é lida uma vez. */}
        <div className={styles.mentor}>
          <RetratoMentor nome={mentor.nome} fotoUrl={mentor.foto_url} tamanho="xs" />
          <span className={styles.mentorNome}>{mentor.nome}</span>
        </div>
      </div>

      <div className={styles.direita}>
        {estado === 'ao-vivo' && (
          <>
            <span className={styles.aoVivo}>
              <span className={styles.dot} aria-hidden="true" />
              ao vivo
            </span>
            <Button variant="primary" size="sm" disabled>
              Entrar na sala
            </Button>
          </>
        )}

        {estado === 'checkin-aberto' && (
          <>
            <span className={styles.vagas}>
              {sessao.inscritos}/{sessao.vagas}
            </span>
            <Button variant="primary" size="sm" disabled={gravando} onClick={aoFazerCheckin}>
              Fazer check-in
            </Button>
          </>
        )}

        {estado === 'inscrito' && (
          <button
            type="button"
            className={styles.confirmado}
            disabled={gravando}
            onClick={aoCancelarCheckin}
            /* O rótulo VISÍVEL diz o estado; o acessível precisa dizer a AÇÃO —
               senão o leitor de tela anuncia um botão chamado "check-in
               confirmado" que, ao ser acionado, cancela. */
            aria-label={`Cancelar check-in em ${sessao.titulo}`}
          >
            <Visto tamanho={11} />
            Check-in confirmado
          </button>
        )}

        {lotada && (
          <span className={styles.vagas}>
            {sessao.inscritos}/{sessao.vagas} · lotada
          </span>
        )}

        {estado === 'fora-da-janela' && (
          <span className={styles.janela}>
            check-in abre {rotuloDoDia(sessao.inicioIso, agora).mono}
          </span>
        )}
      </div>
    </article>
  );
}
