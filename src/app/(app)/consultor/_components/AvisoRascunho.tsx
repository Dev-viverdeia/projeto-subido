import { FilePenLine } from 'lucide-react';
import type { RascunhoSobral } from '@/lib/consultor/rascunhos';
import styles from './AvisoRascunho.module.css';

export function AvisoRascunho({
  disponivel,
  recuperado,
  falhou,
  guardado,
  retomar,
  descartar,
}: {
  disponivel?: RascunhoSobral;
  recuperado: boolean;
  falhou: boolean;
  guardado: boolean;
  retomar: () => void;
  descartar: () => void;
}) {
  if (!disponivel && !recuperado && !falhou && !guardado) return null;
  return (
    <div className={styles.aviso} data-rascunho-sobral>
      <FilePenLine size={17} aria-hidden="true" />
      <p
        role="status"
        title="Texto disponível por sete dias neste navegador. Encerrar sessão apaga os rascunhos. Arquivos não são guardados."
      >
        {falhou
          ? 'Não foi possível guardar o rascunho. Mantenha esta aba aberta.'
          : disponivel?.tentativa
            ? 'Uma pergunta aguarda confirmação.'
            : disponivel
              ? 'Rascunho neste navegador.'
              : recuperado
                ? 'Rascunho recuperado.'
                : 'Texto salvo neste navegador.'}
      </p>
      {disponivel && (
        <div className={styles.acoes}>
          <button
            type="button"
            onClick={retomar}
            aria-label={disponivel.tentativa ? 'Retomar pergunta' : 'Retomar rascunho'}
          >
            Retomar
          </button>
          {!disponivel.tentativa && (
            <button type="button" onClick={descartar} aria-label="Descartar rascunho">
              Descartar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
