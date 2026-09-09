import { paginaSegura } from './contrato';

export const CONTEXTOS_FALHA = {
  agenda: {
    pagina: '/conta',
    guia: 'conectar-google-agenda',
    assunto: 'Problema ao conectar a agenda',
  },
  reuniao: {
    pagina: '/reunioes',
    guia: 'agendar-reuniao',
    assunto: 'Problema ao agendar uma reunião',
  },
  proposta: {
    pagina: '/propostas/nova',
    guia: 'criar-proposta-sem-reuniao',
    assunto: 'Problema ao criar uma proposta',
  },
  entrega: {
    pagina: '/entregas',
    guia: 'entrega-pontual-recorrente',
    assunto: 'Problema ao gerenciar uma entrega',
  },
  pagina: {
    pagina: '/inicio',
    guia: 'pagina-ou-operacao-com-erro',
    assunto: 'Uma página não carregou',
  },
} as const;
export type ContextoFalha = keyof typeof CONTEXTOS_FALHA;

export function contextoFalha(valor: unknown): ContextoFalha | null {
  return typeof valor === 'string' && Object.hasOwn(CONTEXTOS_FALHA, valor)
    ? (valor as ContextoFalha)
    : null;
}

/** Só compartilha a rota permitida e um assunto conhecido; nunca erro cru, query ou formulário. */
export function linkAjudaNaFalha(contexto: ContextoFalha, pagina?: string | null) {
  const origem = paginaSegura(pagina) ?? CONTEXTOS_FALHA[contexto].pagina;
  return `/suporte/novo?${new URLSearchParams({ origem, contexto })}`;
}
