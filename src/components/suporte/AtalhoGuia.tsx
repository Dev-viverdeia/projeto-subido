import { BookOpen, ArrowUpRight } from 'lucide-react';
import s from './suporte.module.css';

/** Em outra aba para preservar o formulário ou a tarefa que a pessoa está preenchendo. */
export function AtalhoGuia({ slug, children }: { slug: string; children: string }) {
  return (
    <a
      href={`/ajuda/${slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className={s.atalho}
      aria-label={`${children} (abre em outra aba)`}
    >
      <BookOpen size={17} aria-hidden="true" />
      {children}
      <ArrowUpRight size={15} aria-hidden="true" />
    </a>
  );
}
