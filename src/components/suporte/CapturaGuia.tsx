'use client';

import { useRef, useState } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { Expand, Minus, Plus } from 'lucide-react';
import { ModalOperacao } from '@/app/(app)/_components/ModalOperacao';
import s from './CapturaGuia.module.css';

export function CapturaGuia({ imagem, alt }: { imagem: StaticImageData; alt: string }) {
  const [aberto, setAberto] = useState(false);
  const [ampliado, setAmpliado] = useState(false);
  const gatilho = useRef<HTMLButtonElement>(null);
  function fechar() {
    setAberto(false);
    setAmpliado(false);
    requestAnimationFrame(() => gatilho.current?.focus());
  }
  return (
    <figure className={s.figura}>
      <button
        ref={gatilho}
        className={s.miniatura}
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Ampliar imagem: ${alt}`}
      >
        <Image src={imagem} alt={alt} sizes="(max-width: 767px) 85vw, 650px" />
        <span>
          <Expand size={16} aria-hidden="true" /> Ampliar imagem
        </span>
      </button>
      <figcaption>Tela da plataforma com dados demonstrativos.</figcaption>
      <ModalOperacao open={aberto} onClose={fechar} title="Imagem do guia" size="xl">
        <div className={s.barra}>
          <p>{alt}</p>
          <button
            className={s.zoom}
            type="button"
            aria-pressed={ampliado}
            onClick={() => setAmpliado(!ampliado)}
          >
            {ampliado ? (
              <Minus size={18} aria-hidden="true" />
            ) : (
              <Plus size={18} aria-hidden="true" />
            )}
            {ampliado ? 'Ajustar à tela' : 'Ver em tamanho real'}
          </button>
        </div>
        <div
          className={s.visualizador}
          data-ampliado={ampliado}
          tabIndex={0}
          role="region"
          aria-label="Imagem ampliada, use as setas para percorrer"
        >
          <Image src={imagem} alt={alt} sizes="1200px" />
        </div>
        {ampliado && (
          <p className={s.instrucao}>Arraste a imagem ou use as setas para ver os detalhes.</p>
        )}
      </ModalOperacao>
    </figure>
  );
}
