import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obterSessao } from '@/lib/mentorias/queries';
import { TRILHAS } from '@/lib/mentorias/tipos';
import { BotaoVoltar } from '../../_components/BotaoVoltar';
import { CabecalhoPagina } from '../../_components/CabecalhoPagina';
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
 * O que já é de verdade: a leitura da sessão (RLS), a matriz de estados, a
 * pauta, o mentor e a participação. O que é pendência declarada: a TRANSMISSÃO.
 * O palco mostra o estado da sessão e diz com todas as letras que o vídeo entra
 * com a integração (LiveKit) — placeholder visível de propósito, nunca um
 * player falso. Quando a key existir, o palco é o ÚNICO lugar que muda.
 *
 * O header repete a anatomia da conversa do Consultor — voltar AO LADO do bloco
 * de título, centrado — porque é a mesma situação: uma página-filha com
 * identidade própria e caminho único de volta.
 *
 * A rota é dinâmica (cookies via RLS) e `new Date()` é o instante da visita:
 * quem decide "ao vivo" é o relógio do servidor a cada request, não flag.
 */
export default async function SalaPage({ params }: PageProps<'/mentorias/[id]'>) {
  const { id } = await params;
  const [sessao, agora] = [await obterSessao(id), new Date()];
  if (!sessao) notFound();

  const dia = rotuloDoDia(sessao.inicioIso, agora);

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
      </header>

      <SalaMentoria sessao={sessao} agoraIso={agora.toISOString()} />
    </div>
  );
}
