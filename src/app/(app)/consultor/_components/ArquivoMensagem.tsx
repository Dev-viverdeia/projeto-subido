'use client';

import { useState } from 'react';
import { ArrowUpRight, Download, X } from 'lucide-react';
import { tamanhoLegivel } from '@/lib/consultor/anexos-contrato';
import { AnexoIcone } from './AnexoIcone';
import { useArquivoLocal } from './useArquivoLocal';
import styles from './AnexosDaRodada.module.css';

export function ArquivoMensagem({
  arquivo,
  src,
  nome,
  tamanho,
  categoria,
  estado,
  aoRemover,
}: {
  arquivo?: File;
  src?: string;
  nome: string;
  tamanho: number;
  categoria: 'imagem' | 'documento';
  estado?: string;
  aoRemover?: () => void;
}) {
  const local = useArquivoLocal(arquivo);
  const origem = arquivo ? local : src;
  const [falhou, setFalhou] = useState<string | null>(null);
  const imagem = categoria === 'imagem';
  return (
    <div className={styles.arquivo}>
      {imagem && origem && falhou !== origem ? (
        // Blob e anexo autenticado não passam pelo otimizador público de imagens.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.miniatura}
          src={origem}
          alt={nome}
          loading="lazy"
          onError={() => setFalhou(origem)}
        />
      ) : (
        <AnexoIcone categoria={categoria} />
      )}
      <div className={styles.dados}>
        <strong>{nome}</strong>
        <span>
          {tamanhoLegivel(tamanho)}
          {estado ? ` · ${estado}` : ''}
        </span>
        {imagem && origem === falhou ? <span>Prévia indisponível</span> : null}
        {origem && (imagem || !arquivo) ? (
          <a
            href={origem}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${imagem ? 'Abrir' : 'Baixar'} ${nome}`}
          >
            {imagem ? 'Abrir imagem' : 'Baixar arquivo'}
            {imagem ? (
              <ArrowUpRight size={16} aria-hidden="true" />
            ) : (
              <Download size={16} aria-hidden="true" />
            )}
          </a>
        ) : null}
      </div>
      {aoRemover ? (
        <button type="button" onClick={aoRemover} aria-label={`Remover ${nome}`}>
          <X size={18} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
