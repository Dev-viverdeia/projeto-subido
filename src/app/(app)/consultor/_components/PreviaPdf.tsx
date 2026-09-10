'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import type { PDFDocumentProxy, PDFDocumentLoadingTask, RenderTask } from 'pdfjs-dist';
import { SOBRAL_MAX_BYTES_POR_ANEXO } from '@/lib/consultor/anexos-contrato';
import { CarregandoPrevia, ErroPrevia } from './PreviaAnexo';
import styles from './PreviaAnexo.module.css';

export default function PreviaPdf({
  src,
  nome,
  tentar,
}: {
  src: string;
  nome: string;
  tentar: () => void;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    let tarefa: PDFDocumentLoadingTask | undefined;
    let ativo = true;
    const timeout = window.setTimeout(() => {
      if (!ativo) return;
      setErro('O arquivo demorou para abrir. Tente novamente.');
      controller.abort();
      void tarefa?.destroy();
    }, 30_000);
    async function carregar() {
      try {
        // O leitor pesado só é baixado ao abrir um PDF. Falha no chunk também
        // fica dentro do modal, preservando a conversa e permitindo nova tentativa.
        const { getDocument, GlobalWorkerOptions, version } = await import('pdfjs-dist');
        if (!ativo || controller.signal.aborted) return;
        const assets = `/vendor/pdfjs/${version}/`;
        GlobalWorkerOptions.workerSrc = `${assets}build/pdf.worker.min.mjs`;
        const resposta = await fetch(src, { cache: 'no-store', signal: controller.signal });
        if (!resposta.ok) throw new Error('arquivo');
        const leitor = resposta.body?.getReader();
        if (!leitor) throw new Error('arquivo');
        const partes: Uint8Array[] = [];
        let total = 0;
        while (true) {
          const { done, value } = await leitor.read();
          if (done) break;
          total += value.byteLength;
          if (total > SOBRAL_MAX_BYTES_POR_ANEXO) {
            await leitor.cancel();
            throw new Error('limite');
          }
          partes.push(value);
        }
        if (!ativo) return;
        const bytes = new Uint8Array(total);
        let offset = 0;
        for (const parte of partes) {
          bytes.set(parte, offset);
          offset += parte.byteLength;
        }
        tarefa = getDocument({
          data: bytes,
          enableXfa: false,
          cMapUrl: `${assets}cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${assets}standard_fonts/`,
          wasmUrl: `${assets}wasm/`,
          iccUrl: `${assets}iccs/`,
          maxImageSize: 16_000_000,
        });
        const documento = await tarefa.promise;
        if (ativo) setPdf(documento);
      } catch (falha) {
        if (ativo)
          setErro(
            falha instanceof Error && falha.name === 'PasswordException'
              ? 'Este PDF tem senha. Baixe o arquivo para abri-lo.'
              : 'Não foi possível abrir o PDF. Você pode tentar novamente ou baixar o arquivo.',
          );
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void carregar();
    return () => {
      ativo = false;
      controller.abort();
      window.clearTimeout(timeout);
      void tarefa?.destroy();
    };
  }, [src]);
  if (erro) return <ErroPrevia mensagem={erro} tentar={tentar} />;
  if (!pdf) return <CarregandoPrevia />;
  return (
    <>
      <div className={styles.controles}>
        <div className={styles.grupo}>
          <button
            type="button"
            aria-label="Página anterior"
            disabled={pagina === 1}
            onClick={() => setPagina((n) => n - 1)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <span role="status">
            Página {pagina} de {pdf.numPages}
          </span>
          <button
            type="button"
            aria-label="Próxima página"
            disabled={pagina === pdf.numPages}
            onClick={() => setPagina((n) => n + 1)}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.grupo}>
          <button
            type="button"
            aria-label="Diminuir PDF"
            disabled={zoom === 1}
            onClick={() => setZoom((n) => Math.max(1, n - 0.5))}
          >
            <ZoomOut size={20} aria-hidden="true" />
          </button>
          <span>{zoom === 1 ? 'Ajustado' : `${zoom * 100}%`}</span>
          <button
            type="button"
            aria-label="Ampliar PDF"
            disabled={zoom === 2}
            onClick={() => setZoom((n) => Math.min(2, n + 0.5))}
          >
            <ZoomIn size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
      <PaginaPdf key={`${pagina}-${zoom}`} pdf={pdf} numero={pagina} zoom={zoom} nome={nome} />
    </>
  );
}

function PaginaPdf({
  pdf,
  numero,
  zoom,
  nome,
}: {
  pdf: PDFDocumentProxy;
  numero: number;
  zoom: number;
  nome: string;
}) {
  const palco = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [texto, setTexto] = useState<string[] | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    let render: RenderTask | undefined;
    let timer: ReturnType<typeof setTimeout>;
    // Fila serial: o mesmo canvas nunca recebe duas renderizações simultâneas.
    let fila = Promise.resolve();
    const desenhar = () => {
      render?.cancel();
      fila = fila
        .catch(() => undefined)
        .then(async () => {
          if (!ativo || !canvas.current || !palco.current) return;
          setEstado('carregando');
          try {
            const pagina = await pdf.getPage(numero);
            if (!ativo || !canvas.current || !palco.current) return;
            const base = pagina.getViewport({ scale: 1 });
            const largura = Math.max(200, palco.current.clientWidth - 32);
            const viewport = pagina.getViewport({
              scale: Math.min(largura / base.width, 1.5) * zoom,
            });
            const dpr = Math.min(
              window.devicePixelRatio || 1,
              2,
              Math.sqrt(4_000_000 / (viewport.width * viewport.height)),
            );
            canvas.current.width = Math.floor(viewport.width * dpr);
            canvas.current.height = Math.floor(viewport.height * dpr);
            canvas.current.style.width = `${viewport.width}px`;
            canvas.current.style.height = `${viewport.height}px`;
            render = pagina.render({
              canvas: canvas.current,
              viewport,
              transform: [dpr, 0, 0, dpr, 0, 0],
            });
            await render.promise;
            const conteudo = await pagina.getTextContent();
            if (!ativo) return;
            const linhas: string[] = [];
            let linha = '';
            for (const item of conteudo.items) {
              if (!('str' in item)) continue;
              linha += `${item.str} `;
              if (item.hasEOL) {
                linhas.push(linha.trim());
                linha = '';
              }
            }
            if (linha.trim()) linhas.push(linha.trim());
            setTexto(linhas);
            setEstado('pronto');
          } catch (falha) {
            if (ativo && !(falha instanceof Error && falha.name === 'RenderingCancelledException'))
              setEstado('erro');
          }
        });
    };
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(desenhar, 120);
    });
    if (palco.current) observer.observe(palco.current);
    return () => {
      ativo = false;
      clearTimeout(timer);
      observer.disconnect();
      render?.cancel();
    };
  }, [pdf, numero, zoom, tentativa]);
  return (
    <>
      <div
        ref={palco}
        className={styles.palco}
        role="region"
        aria-label={`Página ${numero} do PDF`}
        tabIndex={0}
      >
        {estado === 'carregando' ? <CarregandoPrevia /> : null}
        {estado === 'erro' ? (
          <ErroPrevia
            mensagem="Não foi possível exibir esta página."
            tentar={() => setTentativa((n) => n + 1)}
          />
        ) : null}
        <canvas
          ref={canvas}
          hidden={estado !== 'pronto'}
          role="img"
          aria-label={`${nome}, página ${numero}. Texto disponível abaixo.`}
        />
      </div>
      {estado === 'pronto' ? (
        <details className={styles.texto}>
          <summary>Ler texto da página</summary>
          {texto?.some(Boolean) ? (
            texto.map((linha, i) => <p key={i}>{linha}</p>)
          ) : (
            <p>Esta página não tem texto selecionável. Use a imagem ou baixe o PDF.</p>
          )}
        </details>
      ) : null}
    </>
  );
}
