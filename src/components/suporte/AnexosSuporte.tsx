'use client';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { FileText, Paperclip, X } from 'lucide-react';
import { Button } from '@/design-system/via';
import {
  MAX_ARQUIVO,
  ArquivoSuporteSchema,
  ErroSuporteSchema,
  type ArquivoSuporte,
} from '@/lib/suporte/contrato';
import s from './suporte.module.css';

export function AnexosSuporte({
  arquivos,
  onChange,
  onBusy,
  disabled,
}: {
  arquivos: ArquivoSuporte[];
  onChange: (a: ArquivoSuporte[]) => void;
  onBusy: (v: boolean) => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  async function anexar(file: File) {
    setErro('');
    if (file.size > MAX_ARQUIVO) {
      setErro('O arquivo precisa ter até 3 MB.');
      return;
    }
    setEnviando(true);
    onBusy(true);
    try {
      const form = new FormData();
      form.set('arquivo', file);
      form.set('id', crypto.randomUUID());
      const response = await fetch('/api/suporte/anexos', { method: 'POST', body: form });
      const result: unknown = await response.json();
      const parsed = z.object({ arquivo: ArquivoSuporteSchema }).safeParse(result);
      if (!response.ok || !parsed.success)
        throw new Error(
          ErroSuporteSchema.safeParse(result).data?.erro || 'Não foi possível anexar.',
        );
      onChange([...arquivos, parsed.data.arquivo]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível anexar. Tente novamente.');
    } finally {
      setEnviando(false);
      onBusy(false);
      if (input.current) input.current.value = '';
    }
  }
  return (
    <div className={s.lista}>
      <div className={s.acoes}>
        <Button
          variant="secondary"
          onClick={() => input.current?.click()}
          disabled={disabled || arquivos.length >= 3}
          loading={enviando}
          iconLeft={<Paperclip size={17} />}
        >
          Anexar arquivo
        </Button>
        <span className={s.meta}>Até 3 imagens ou PDFs · 3 MB cada</span>
      </div>
      <input
        className={s.oculto}
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        aria-label="Escolher anexo"
        disabled={disabled || enviando}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void anexar(file);
        }}
      />
      {arquivos.length > 0 && (
        <div className={s.anexos}>
          {arquivos.map((a) => (
            <span key={a.id} className={s.arquivo}>
              <FileText size={16} />
              <span>{a.nome}</span>
              <button
                type="button"
                aria-label={`Remover ${a.nome}`}
                disabled={disabled || enviando}
                onClick={() => onChange(arquivos.filter((f) => f.id !== a.id))}
              >
                <X size={16} />
              </button>
            </span>
          ))}
        </div>
      )}
      {erro && (
        <p className={s.erro} role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
