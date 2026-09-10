'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Download, FileWarning, LoaderCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { ModalOperacao } from '../../_components/ModalOperacao';
import { tamanhoLegivel } from '@/lib/consultor/anexos-contrato';
import styles from './PreviaAnexo.module.css';
import PreviaPdf from './PreviaPdf';

export function CarregandoPrevia() {
  return (
    <div className={styles.estado} role="status">
      <LoaderCircle className={styles.spinner} size={24} aria-hidden="true" />
      <span>Carregando arquivo…</span>
    </div>
  );
}

export function ErroPrevia({ mensagem, tentar }: { mensagem: string; tentar: () => void }) {
  return (
    <div className={styles.estado} role="alert">
      <FileWarning size={28} aria-hidden="true" />
      <p>{mensagem}</p>
      <button type="button" onClick={tentar}>
        Tentar novamente
      </button>
    </div>
  );
}

export function PreviaAnexo({
  src,
  nome,
  tamanho,
  pdf,
  aoFechar,
  aoVoltar,
}: {
  src: string;
  nome: string;
  tamanho: number;
  pdf: boolean;
  aoFechar: () => void;
  aoVoltar?: () => void;
}) {
  const [tentativa, setTentativa] = useState(0);
  const download = src.startsWith('/api/consultor/anexos/') ? `${src}?download=1` : src;
  return (
    <ModalOperacao
      open
      onClose={aoFechar}
      title={pdf ? 'Ler PDF' : 'Ver imagem'}
      size="xl"
      footer={
        <>
          {aoVoltar ? (
            <button type="button" className={styles.baixar} onClick={aoVoltar}>
              <ArrowLeft size={18} aria-hidden="true" />
              Voltar aos arquivos
            </button>
          ) : null}
          <a className={styles.baixar} href={download} download={nome}>
            <Download size={18} aria-hidden="true" />
            Baixar arquivo
          </a>
        </>
      }
    >
      <div className={styles.identidade}>
        <strong>{nome}</strong>
        <span>{tamanhoLegivel(tamanho)}</span>
      </div>
      <div>
        {pdf ? (
          <PreviaPdf
            key={tentativa}
            src={src}
            nome={nome}
            tentar={() => setTentativa((n) => n + 1)}
          />
        ) : (
          <PreviaImagem
            key={tentativa}
            src={src}
            nome={nome}
            tentar={() => setTentativa((n) => n + 1)}
          />
        )}
      </div>
    </ModalOperacao>
  );
}

function PreviaImagem({ src, nome, tentar }: { src: string; nome: string; tentar: () => void }) {
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [ampliada, setAmpliada] = useState(false);
  useEffect(() => {
    if (estado !== 'carregando') return;
    const timeout = window.setTimeout(() => setEstado('erro'), 30_000);
    return () => window.clearTimeout(timeout);
  }, [estado]);
  if (estado === 'erro')
    return <ErroPrevia mensagem="Não foi possível abrir a imagem." tentar={tentar} />;
  return (
    <>
      <div className={styles.controles}>
        <button
          type="button"
          disabled={estado !== 'pronto'}
          aria-pressed={ampliada}
          onClick={() => setAmpliada((valor) => !valor)}
        >
          {ampliada ? (
            <ZoomOut size={18} aria-hidden="true" />
          ) : (
            <ZoomIn size={18} aria-hidden="true" />
          )}
          {ampliada ? 'Ajustar à tela' : 'Ampliar imagem'}
        </button>
      </div>
      <div
        className={styles.palco}
        tabIndex={estado === 'pronto' ? 0 : -1}
        role="region"
        aria-label="Imagem do anexo"
      >
        {estado === 'carregando' ? <CarregandoPrevia /> : null}
        {/* Arquivo privado: não usar o otimizador público de imagens. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.imagem}
          data-ampliada={ampliada}
          hidden={estado !== 'pronto'}
          src={src}
          alt={nome}
          onLoad={() => setEstado('pronto')}
          onError={() => setEstado('erro')}
        />
      </div>
    </>
  );
}
