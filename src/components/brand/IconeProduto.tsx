import type { ReactNode } from 'react';

/**
 * Pictogramas das áreas do Subido. Grade de 24, traço de 1.65, cantos abertos
 * e planos discretos. O recorte diagonal acompanha o símbolo da marca sem
 * transformar cada ícone em um logotipo. Ações universais continuam no Lucide.
 * SVG puro: pode ser serializado pelo servidor, sem biblioteca ou IDs de filtro.
 */
const DESENHOS = {
  inicio: (
    <>
      <path
        d="m4 10 8-7 8 7v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
        fill="currentColor"
        fillOpacity=".08"
        stroke="none"
      />
      <path d="m4 10 8-7 8 7v9a2 2 0 0 1-2 2h-3v-7H9v7H6a2 2 0 0 1-2-2Z" />
    </>
  ),
  sobral: (
    <>
      <path d="M4 3h11l4 4v8H8l-4 4Z" fill="currentColor" fillOpacity=".08" stroke="none" />
      <path d="M4 3h11l4 4v8H8l-4 4V3Z" />
      <path d="M8 8h3m-3 3h7m0 8h3l3 3V11" />
    </>
  ),
  formacoes: (
    <>
      <path
        d="M12 6c-3-2-6-2-9-2v15c3 0 6 0 9 2Z"
        fill="currentColor"
        fillOpacity=".1"
        stroke="none"
      />
      <path d="M12 6c-3-2-6-2-9-2v15c3 0 6 0 9 2 3-2 6-2 9-2V4c-3 0-6 0-9 2v15" />
      <path d="M16 8h2m-2 4h2" />
    </>
  ),
  projetos: (
    <>
      <path d="M7 3h9l4 4v12H7Z" fill="currentColor" fillOpacity=".08" stroke="none" />
      <path d="M7 3h9l4 4v12H7V3Zm9 0v4h4M3 7v14h13" />
      <path d="M11 11h5m-5 4h3" />
    </>
  ),
  estudio: (
    <>
      <path d="M12 3 21 16l-9 5-9-5Z" fill="currentColor" fillOpacity=".08" stroke="none" />
      <path d="m12 3 9 13-9 5-9-5 9-13Zm0 0v12m-9 1 9-1 9 1" />
      <path d="m9 18 3-3 3 3" />
    </>
  ),
  mentorias: (
    <>
      <path
        d="M3 21v-3a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v3"
        fill="currentColor"
        fillOpacity=".08"
        stroke="none"
      />
      <circle cx="8.5" cy="7" r="3.5" />
      <path d="M3 21v-3a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v3m2-17a3.5 3.5 0 0 1 0 7m2 4a4 4 0 0 1 3 4v2" />
    </>
  ),
  certificados: (
    <>
      <path d="M4 3h12l4 4v10H4Z" fill="currentColor" fillOpacity=".08" stroke="none" />
      <path d="M8 17H4V3h12l4 4v10h-4M8 7h4m-4 3h8" />
      <circle cx="12" cy="15" r="3" />
      <path d="M10 17.5V22l2-1.5 2 1.5v-4.5" />
    </>
  ),
  prospeccao: (
    <>
      <circle cx="10.5" cy="10.5" r="7.5" fill="currentColor" fillOpacity=".08" stroke="none" />
      <circle cx="10.5" cy="10.5" r="7.5" />
      <path d="m16 16 5 5M7 12V8h3m1 5h3V9" />
    </>
  ),
  vendas: (
    <>
      <path d="M4 4h4v16H4Z" fill="currentColor" fillOpacity=".1" stroke="none" />
      <path d="M4 4h4v16H4V4Zm6 0h4v11h-4V4Zm6 0h4v7h-4V4Z" />
      <path d="m15 20 5-5m-4 0h4v4" />
    </>
  ),
  metricas: (
    <>
      <path
        d="M6 14h3v7H6Zm6-5h3v12h-3Zm6-6h3v18h-3Z"
        fill="currentColor"
        fillOpacity=".1"
        stroke="none"
      />
      <path d="M3 3v18h18M7 16v-2m6 2V9m6 7V3" />
    </>
  ),
  reunioes: (
    <>
      <path d="M3 5h10l3 3v11H3Z" fill="currentColor" fillOpacity=".08" stroke="none" />
      <path d="M3 5h10l3 3v11H3V5Zm13 5 5-3v12l-5-3M6 9h3" />
    </>
  ),
  propostas: (
    <>
      <path d="M4 3h10l4 4v7l-7 7H4Z" fill="currentColor" fillOpacity=".08" stroke="none" />
      <path d="M8 21H4V3h10l4 4v3M14 3v4h4M8 8h2m-2 4h5" />
      <path d="m12 18 7-7 3 3-7 7h-3v-3Zm5-5 3 3" />
    </>
  ),
  entregas: (
    <>
      <path d="m3 7 9-4 9 4v11l-9 4-9-4Z" fill="currentColor" fillOpacity=".08" stroke="none" />
      <path d="m3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4m-9 4v11M8 5l9 4" />
      <path d="m15 15 1.5 1 2.5-3" />
    </>
  ),
  admin: (
    <>
      <path
        d="m12 3 8 3v7c0 4-4 7-8 9-4-2-8-5-8-9V6Z"
        fill="currentColor"
        fillOpacity=".08"
        stroke="none"
      />
      <path d="m12 3 8 3v7c0 4-4 7-8 9-4-2-8-5-8-9V6l8-3Z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  conta: (
    <>
      <path
        d="M3 21v-3a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v3"
        fill="currentColor"
        fillOpacity=".08"
        stroke="none"
      />
      <circle cx="12" cy="6" r="3.5" />
      <path d="M3 21v-3a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type AreaIconeProduto = keyof typeof DESENHOS;

/** O nome acessível pertence ao link/botão que contém o pictograma. */
export function IconeProduto({
  nome,
  tamanho = 22,
  className,
}: {
  nome: AreaIconeProduto;
  tamanho?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      data-icone-produto={nome}
    >
      {DESENHOS[nome]}
    </svg>
  );
}
