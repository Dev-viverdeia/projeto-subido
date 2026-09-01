import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Entrevista } from '@/app/(app)/builder/_components/Entrevista';
import styles from '../estudio-sala/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Entrevista do Estúdio' };

export default function PreviewEntrevistaEstudioPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <main className={styles.pagina}>
      <Entrevista
        id="preview-estudio"
        ideia="Os pedidos chegam pelo WhatsApp e o cliente quer responder mais rápido."
        perguntas={[
          {
            pergunta: 'O que precisa acontecer nos primeiros minutos após a chegada de um contato?',
            porque:
              'Essa resposta define o fluxo inicial e o limite entre automação e atendimento humano.',
            resposta: '',
          },
          {
            pergunta: 'Quem deve receber os contatos já qualificados?',
            porque: 'Define a entrega do fluxo.',
            resposta: '',
          },
          {
            pergunta: 'Qual resultado prova que o projeto funcionou?',
            porque: 'Define a validação.',
            resposta: '',
          },
        ]}
      />
    </main>
  );
}
