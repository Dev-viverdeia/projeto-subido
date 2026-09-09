import type { ReactNode } from 'react';
import { CircleAlert, ArrowUpRight, BookOpen } from 'lucide-react';
import { CONTEXTOS_FALHA, linkAjudaNaFalha, type ContextoFalha } from '@/lib/suporte/recuperacao';
import s from './AjudaNaFalha.module.css';

/** Recuperação local: abrir ajuda nunca desmonta o formulário nem repete sua ação. */
export function AjudaNaFalha({
  contexto,
  titulo,
  descricao,
  acao,
  pagina,
}: {
  contexto: ContextoFalha;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  pagina?: string;
}) {
  return (
    <aside className={s.quadro} aria-label="Ajuda para continuar" tabIndex={-1} data-ajuda-falha>
      <div className={s.mensagem} role="alert" aria-atomic="true">
        <CircleAlert size={21} aria-hidden="true" />
        <div>
          <strong>{titulo}</strong>
          {descricao && <p>{descricao}</p>}
        </div>
      </div>
      <div className={s.acoes}>
        {acao && <div className={s.principal}>{acao}</div>}
        <a
          href={`/ajuda/${CONTEXTOS_FALHA[contexto].guia}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver guia (abre em outra aba)"
        >
          <BookOpen size={17} aria-hidden="true" /> Ver guia
        </a>
        <a
          href={linkAjudaNaFalha(contexto, pagina)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Pedir ajuda (abre em outra aba)"
        >
          Pedir ajuda <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}
