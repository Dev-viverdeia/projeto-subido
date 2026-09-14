import { ArrowUpRight } from 'lucide-react';
import { separarLinksMensagem } from '@/lib/calls/links-mensagem';
import styles from './MensagemReuniao.module.css';

export function MensagemReuniao({
  autor,
  texto,
  propria,
}: {
  autor: string;
  texto: string;
  propria?: boolean;
}) {
  return (
    <div className={styles.mensagem} data-propria={propria || undefined}>
      <strong>{propria ? 'Você' : autor}</strong>
      <p>
        {separarLinksMensagem(texto).map((trecho, i) =>
          trecho.href ? (
            <a
              key={i}
              href={trecho.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${trecho.texto} (abre em outra aba)`}
              title={`${trecho.href} (abre em outra aba)`}
            >
              <span>{trecho.texto}</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          ) : (
            <span key={i}>{trecho.texto}</span>
          ),
        )}
      </p>
    </div>
  );
}
