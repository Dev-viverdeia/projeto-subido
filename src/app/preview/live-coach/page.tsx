import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Mic, MonitorUp, PhoneOff, Video } from 'lucide-react';
import { CabineLiveCoach, type SugestaoLive } from '@/app/sala/[codigo]/LiveCoach';
import styles from './preview.module.css';

export const metadata: Metadata = { title: 'Preview · Live Coach' };

const SUGESTAO: SugestaoLive = {
  id: 'preview',
  categoria: 'impacto',
  titulo: 'Dimensione o custo da espera.',
  sugestao:
    'Pergunte: “Quando um paciente espera duas horas, o que costuma acontecer com o agendamento?”',
  metodologia: 'SPIN · implicação',
  trecho_gatilho: 'Às vezes a equipe só consegue responder depois de duas horas.',
  prioridade: 3,
};

export default async function PreviewLiveCoachPage({
  searchParams,
}: PageProps<'/preview/live-coach'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;
  const kickoff = parametros.tipo === 'kickoff';
  const sugestao: SugestaoLive = kickoff
    ? {
        ...SUGESTAO,
        categoria: 'critério de sucesso',
        titulo: 'Torne o resultado verificável.',
        sugestao:
          'Pergunte: “Qual indicador precisa mudar para vocês considerarem este projeto bem-sucedido?”',
        metodologia: 'acordo do projeto',
        trecho_gatilho: 'A gente quer melhorar o atendimento.',
      }
    : SUGESTAO;

  return (
    <main className={styles.pagina}>
      <section className={styles.sala} aria-label="Preview da reunião">
        <div className={styles.palco}>
          <div className={styles.topo}>
            <span>{kickoff ? 'Kickoff do projeto' : 'Descoberta do atendimento'}</span>
            <small>18:42</small>
          </div>
          <div className={styles.pessoas}>
            <article className={styles.cliente}>
              <div>CR</div>
              <span>Camila Rios</span>
            </article>
            <article className={styles.anfitriao}>
              <div>RM</div>
              <span>Você</span>
            </article>
          </div>
          <div className={styles.controles}>
            <button aria-label="Microfone">
              <Mic size={17} />
            </button>
            <button aria-label="Câmera">
              <Video size={17} />
            </button>
            <button aria-label="Compartilhar tela">
              <MonitorUp size={17} />
            </button>
            <button className={styles.encerrar} aria-label="Encerrar">
              <PhoneOff size={17} />
            </button>
          </div>
        </div>
        <CabineLiveCoach
          ativo
          estado="escutando"
          sugestao={sugestao}
          fala={
            kickoff
              ? 'A gente quer melhorar o atendimento e começar pela unidade principal.'
              : 'Hoje entram umas quarenta mensagens por dia e, quando a recepção está cheia, a resposta demora bastante.'
          }
          tipo={kickoff ? 'kickoff' : 'descoberta'}
        />
      </section>
    </main>
  );
}
