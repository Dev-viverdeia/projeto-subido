import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { obterSessao } from '@/lib/mentorias/queries';
import { TRILHAS } from '@/lib/mentorias/tipos';
import { BotaoVoltar } from '../../_components/BotaoVoltar';
import { CabecalhoPagina } from '../../_components/CabecalhoPagina';
import { RetratoMentor } from '../../_components/RetratoMentor';
import { Visto } from '../../_components/PillEstado';
import { duracaoMin, horaCurta, rotuloDoDia } from '../_components/estadoMentoria';
import { SalaMentoria } from '../_components/SalaMentoria';
import styles from './pagina.module.css';

export async function generateMetadata({
  params,
}: PageProps<'/mentorias/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const sessao = await obterSessao(id);
  return { title: sessao?.titulo ?? 'Mentoria' };
}

/**
 * A SALA da mentoria — a página para onde "Entrar na sala" finalmente leva.
 *
 * O CONTEXTO MORA NO HEADER, não num trilho: quem mentora e a participação são
 * uma linha de leitura cada — dar um card a cada um roubava 360px do palco e
 * ainda pedia rolagem. O corpo fica inteiro para o que é da sessão AGORA: o
 * chat e o palco. (A pauta saiu da sala — ela é leitura de ANTES, e vive na
 * ficha da agenda.)
 *
 * O que já é de verdade: a leitura da sessão (RLS), a matriz de estados e a
 * participação. O que é pendência declarada: transmissão e chat, que entram
 * com a integração (LiveKit) — placeholder visível de propósito, nunca um
 * player falso nem mensagens de figurantes.
 *
 * A rota é dinâmica (cookies via RLS) e `new Date()` é o instante da visita:
 * quem decide "ao vivo" é o relógio do servidor a cada request, não flag.
 */
export default async function SalaPage({ params }: PageProps<'/mentorias/[id]'>) {
  const { id } = await params;
  const [sessao, agora] = [await obterSessao(id), new Date()];
  if (!sessao) notFound();

  const dia = rotuloDoDia(sessao.inicioIso, agora);
  const encerrada = agora.getTime() >= new Date(sessao.fimIso).getTime();
  const lotada = !sessao.euInscrito && sessao.inscritos >= sessao.vagas;

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo={sessao.titulo} oculto />

      <header className={styles.cabecalho}>
        <div className={styles.esquerda}>
          <BotaoVoltar fallback="/mentorias" rotulo="Mentorias" />
          <div className={styles.identidade}>
            <p className={styles.eyebrow}>{TRILHAS[sessao.mentor.trilha].rotulo} · Mentoria</p>
            <h1 className={styles.titulo}>{sessao.titulo}</h1>
            <p className={styles.meta}>
              {dia.mono} · {horaCurta(sessao.inicioIso)}–{horaCurta(sessao.fimIso)} ·{' '}
              {duracaoMin(sessao)} min
            </p>
          </div>
        </div>

        {/* O contexto da sala, em dois blocos com hairline entre eles: quem
            mentora e a participação. Uma linha de leitura cada — era um trilho
            de três cards roubando 360px do palco. */}
        <div className={styles.direita}>
          <div className={styles.mentorBloco}>
            <RetratoMentor
              nome={sessao.mentor.nome}
              fotoUrl={sessao.mentor.foto_url}
              tamanho="md"
            />
            <div className={styles.mentorTextos}>
              <p className={styles.mentorNome}>{sessao.mentor.nome}</p>
              <p className={styles.mentorPapel}>mentora a sessão</p>
            </div>
          </div>

          <div className={styles.participacao}>
            <p className={styles.vagas}>
              <span className={styles.vagasNumero}>
                {sessao.inscritos}/{sessao.vagas}
              </span>
              <span className={styles.vagasRotulo}>confirmados</span>
            </p>
            {sessao.euInscrito ? (
              <p className={styles.meuEstado}>
                <Visto tamanho={11} />
                Check-in confirmado
              </p>
            ) : encerrada ? null : lotada ? (
              <p className={styles.meuEstadoNota}>Sessão lotada</p>
            ) : (
              <Link href="/mentorias" className={styles.fazerCheckin}>
                Fazer check-in na agenda
              </Link>
            )}
          </div>
        </div>
      </header>

      <SalaMentoria sessao={sessao} agoraIso={agora.toISOString()} />
    </div>
  );
}
