'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Download, FileText, MessageSquareText } from 'lucide-react';
import { nomeArquivoMaterial } from '@/lib/projetos/kit-visual';
import kit from './PreRequisitosMateriais.module.css';

/** Ler, copiar ou baixar o mesmo conteúdo completo. Nenhuma ação altera a ficha do cliente. */
export function MaterialProjeto({
  titulo,
  conteudo,
  quandoUsar,
  tipo = 'modelo',
}: {
  titulo: string;
  conteudo: string;
  quandoUsar?: string;
  tipo?: 'modelo' | 'prompt';
}) {
  const id = useId();
  const [aberto, setAberto] = useState(false);
  const [estado, setEstado] = useState<'pronto' | 'copiando' | 'copiado' | 'erro'>('pronto');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const temConteudo = Boolean(conteudo.trim());
  async function copiar() {
    if (timer.current) clearTimeout(timer.current);
    setEstado('copiando');
    try {
      await navigator.clipboard.writeText(conteudo);
      if (!montado.current) return;
      setEstado('copiado');
      timer.current = setTimeout(() => setEstado('pronto'), 2500);
    } catch {
      if (montado.current) setEstado('erro');
    }
  }
  return (
    <article className={kit.material} aria-labelledby={`${id}-titulo`}>
      <header className={kit.materialTopo}>
        <span className={kit.documento} aria-hidden="true">
          {tipo === 'prompt' ? <MessageSquareText size={24} /> : <FileText size={24} />}
        </span>
        <h3 id={`${id}-titulo`}>
          {temConteudo ? (
            <button
              type="button"
              className={kit.abrirMaterial}
              aria-label={`Ler ${tipo}: ${titulo}`}
              aria-expanded={aberto}
              aria-controls={`${id}-conteudo`}
              onClick={() => setAberto(!aberto)}
            >
              <span>{titulo}</span>
              <ChevronDown size={17} aria-hidden="true" />
            </button>
          ) : (
            titulo
          )}
        </h3>
        {temConteudo ? (
          <div className={kit.acoesMaterial}>
            <button
              type="button"
              onClick={() => {
                void copiar();
              }}
              disabled={estado === 'copiando'}
              aria-label={`${estado === 'copiado' ? 'Copiado' : estado === 'copiando' ? 'Copiando' : 'Copiar'} ${titulo}`}
            >
              {estado === 'copiado' ? (
                <Check size={17} aria-hidden="true" />
              ) : (
                <Copy size={17} aria-hidden="true" />
              )}
              {estado === 'copiado' ? 'Copiado' : estado === 'copiando' ? 'Copiando' : 'Copiar'}
            </button>
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(conteudo)}`}
              download={nomeArquivoMaterial(titulo)}
              aria-label={`Baixar .txt: ${titulo}`}
            >
              <Download size={17} aria-hidden="true" />
              <span>
                Baixar<span className={kit.extensao}> .txt</span>
              </span>
            </a>
          </div>
        ) : null}
      </header>
      {temConteudo ? (
        <div id={`${id}-conteudo`} hidden={!aberto}>
          <div className={kit.modeloConteudo}>
            {quandoUsar ? <p>{quandoUsar}</p> : null}
            <pre
              tabIndex={0}
              role="region"
              aria-label={tipo === 'prompt' ? `Texto do prompt: ${titulo}` : `Modelo: ${titulo}`}
            >
              {conteudo}
            </pre>
          </div>
        </div>
      ) : (
        <p className={kit.vazio}>O conteúdo deste material ainda não foi adicionado.</p>
      )}
      <span className={kit.srOnly} role="status">
        {estado === 'copiado' ? `${titulo}: texto copiado.` : ''}
      </span>
      {estado === 'erro' ? (
        <p className={kit.erro} role="alert">
          Não foi possível copiar. Baixe o arquivo ou abra o texto para selecionar.
        </p>
      ) : null}
    </article>
  );
}
