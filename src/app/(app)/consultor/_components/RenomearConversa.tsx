'use client';
import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Pencil } from 'lucide-react';
import { renomearConversa } from '@/lib/consultor/renomear';
import type { ThreadDoConsultor } from '@/lib/consultor/queries';
import styles from './ListaConversas.module.css';

export function RenomearConversa({
  thread,
  dono,
  aoSalvar,
}: {
  thread: ThreadDoConsultor;
  dono: string;
  aoSalvar: (titulo: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(thread.titulo);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const campo = useRef<HTMLInputElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const trava = useRef(false);
  useEffect(() => {
    if (editando) {
      campo.current?.focus();
      campo.current?.select();
    }
  }, [editando]);
  function fechar() {
    setEditando(false);
    setErro('');
    requestAnimationFrame(() => gatilho.current?.focus());
  }
  async function salvar() {
    if (trava.current || !titulo.trim()) return;
    if (titulo.trim() === thread.titulo) {
      fechar();
      return;
    }
    trava.current = true;
    setSalvando(true);
    setErro('');
    try {
      const resultado = await renomearConversa({
        id: thread.id,
        dono,
        anterior: thread.titulo,
        titulo,
      });
      if (resultado.erro) setErro(resultado.erro);
      else if (resultado.titulo) {
        aoSalvar(resultado.titulo);
        fechar();
      }
    } catch {
      setErro('Não foi possível confirmar o nome. Seu texto continua aqui.');
    } finally {
      trava.current = false;
      setSalvando(false);
    }
  }
  if (!editando)
    return (
      <button
        ref={gatilho}
        type="button"
        className={styles.icone}
        aria-label={`Renomear ${thread.titulo}`}
        title="Renomear conversa"
        onClick={() => {
          setTitulo(thread.titulo);
          setEditando(true);
        }}
      >
        <Pencil size={17} aria-hidden="true" />
      </button>
    );
  return (
    <form
      className={styles.edicao}
      aria-label="Renomear conversa"
      onSubmit={(e) => {
        e.preventDefault();
        void salvar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          if (!salvando) fechar();
        }
      }}
    >
      <label htmlFor={`nome-${thread.id}`}>
        Nome da conversa <span aria-hidden="true">{titulo.length}/120</span>
      </label>
      <input
        ref={campo}
        id={`nome-${thread.id}`}
        value={titulo}
        maxLength={120}
        required
        disabled={salvando}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `erro-${thread.id}` : undefined}
        onChange={(e) => {
          setTitulo(e.target.value);
          setErro('');
        }}
      />
      <div className={styles.edicaoAcoes}>
        <button type="button" disabled={salvando} onClick={fechar}>
          Cancelar
        </button>
        <button type="submit" className={styles.salvar} disabled={salvando || !titulo.trim()}>
          {salvando && <LoaderCircle size={16} className={styles.girando} aria-hidden="true" />}
          {salvando ? 'Salvando…' : 'Salvar nome'}
        </button>
      </div>
      {erro && (
        <p role="alert" id={`erro-${thread.id}`} className={styles.erro}>
          {erro}
        </p>
      )}
    </form>
  );
}
