'use client';

import { useState } from 'react';
import { Download, Maximize2, X } from 'lucide-react';
import { mimeBaseDoAnexo, tamanhoLegivel } from '@/lib/consultor/anexos-contrato';
import { PreviaAnexo } from './PreviaAnexo';
import { AnexoIcone } from './AnexoIcone';
import { useArquivoLocal } from './useArquivoLocal';
import styles from './AnexosDaRodada.module.css';

export function ArquivoMensagem({
  arquivo,
  src,
  nome,
  tamanho,
  categoria,
  tipoMime,
  estado,
  aoRemover,
}: {
  arquivo?: File;
  src?: string;
  nome: string;
  tamanho: number;
  categoria: 'imagem' | 'documento';
  tipoMime?: string;
  estado?: string;
  aoRemover?: () => void;
}) {
  const local = useArquivoLocal(arquivo);
  const origem = arquivo ? local : src;
  const [falhou, setFalhou] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const imagem = categoria === 'imagem';
  const pdf = mimeBaseDoAnexo(arquivo?.type ?? tipoMime ?? '') === 'application/pdf';
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
        {origem && (imagem || pdf) ? (
          <button
            type="button"
            className={styles.abrir}
            aria-label={`Visualizar ${nome}`}
            onClick={(evento) => {
              // Safari não foca botões ao tocar; registra o gatilho antes do modal
              // para não devolver o foco ao compositor e abrir o teclado ao fechar.
              evento.currentTarget.focus({ preventScroll: true });
              setAberto(true);
            }}
          >
            {imagem ? 'Ver imagem' : 'Ler PDF'}
            <Maximize2 size={16} aria-hidden="true" />
          </button>
        ) : origem && !arquivo ? (
          <a href={origem} target="_blank" rel="noopener noreferrer" aria-label={`Baixar ${nome}`}>
            Baixar arquivo
            <Download size={16} aria-hidden="true" />
          </a>
        ) : null}
      </div>
      {aoRemover ? (
        <button type="button" onClick={aoRemover} aria-label={`Remover ${nome}`}>
          <X size={18} aria-hidden="true" />
        </button>
      ) : null}
      {aberto && origem ? (
        <PreviaAnexo
          src={origem}
          nome={nome}
          tamanho={tamanho}
          pdf={pdf}
          aoFechar={() => setAberto(false)}
        />
      ) : null}
    </div>
  );
}
