'use client';

import { useSyncExternalStore } from 'react';

/**
 * Progresso de aulas NO DISPOSITIVO — `localStorage`, até o backend existir.
 *
 * TODO(backend): trocar por tabela + Server Action quando o schema de progresso
 * entrar. A API daqui foi desenhada para essa troca: quem consome recebe um
 * `Set<string>` de aulas concluídas e não sabe de onde ele veio. As query keys
 * (`keys.formacoes.*`) já existem para o dia da migração.
 *
 * POR QUE `useSyncExternalStore` E NÃO `useEffect` + `setState`
 * O localStorage é um store EXTERNO ao React (regra registrada no CLAUDE.md).
 * O snapshot de SERVIDOR devolve o estado vazio: o HTML chega com 0% e o cliente
 * corrige após a hidratação — sem mismatch. A janela de "0% por um frame" é o
 * custo honesto de progresso local; some quando o backend assumir.
 *
 * LIMITAÇÃO DITA, NÃO ESCONDIDA: este progresso não acompanha o usuário entre
 * dispositivos. É progresso do navegador, não da conta.
 */

const CHAVE = 'subido_progresso_v1';

type Estado = {
  /** aulaId → ISO da conclusão. */
  aulas: Record<string, string>;
  /** slug da formação → ISO do último toque (alimenta o "continue de onde parou"). */
  formacoes: Record<string, string>;
  /** id do `solucao_itens` tipo `etapa` → ISO da conclusão. */
  etapas: Record<string, string>;
  /** slug da solução → ISO do último toque (alimenta a retomada do catálogo). */
  solucoes: Record<string, string>;
};

const VAZIO: Estado = { aulas: {}, formacoes: {}, etapas: {}, solucoes: {} };

/* Cache do snapshot: `useSyncExternalStore` exige que `getSnapshot` devolva a
   MESMA referência enquanto nada mudou — parsear o JSON a cada chamada criaria um
   objeto novo por render e um loop infinito de re-render. */
let cache: Estado | null = null;
const ouvintes = new Set<() => void>();

/**
 * NORMALIZA AO LER, e isso não é paranoia.
 *
 * A chave `subido_progresso_v1` já está gravada em navegadores com a forma
 * ANTIGA — só `aulas` e `formacoes`. Quando `etapas` e `solucoes` entraram, todo
 * `Object.keys(estado.etapas)` num desses navegadores viraria
 * `Cannot convert undefined or null to object`, em runtime, para quem já usava o
 * produto — e nunca para quem testa com storage limpo. Preencher o que falta na
 * leitura custa uma linha e dispensa uma versão nova de chave.
 */
function ler(): Estado {
  if (cache) return cache;
  try {
    const cru = localStorage.getItem(CHAVE);
    const bruto = cru ? (JSON.parse(cru) as Partial<Estado>) : null;
    cache = bruto ? { ...VAZIO, ...bruto } : VAZIO;
  } catch {
    cache = VAZIO;
  }
  return cache;
}

function gravar(proximo: Estado) {
  cache = proximo;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(proximo));
  } catch {
    /* Aba anônima com quota zerada: o estado vive só em memória nesta sessão. */
  }
  for (const avisar of ouvintes) avisar();
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  /* Outra aba concluiu uma aula → o evento `storage` invalida o cache desta. */
  const aoMudarStorage = (e: StorageEvent) => {
    if (e.key === CHAVE) {
      cache = null;
      avisar();
    }
  };
  window.addEventListener('storage', aoMudarStorage);
  return () => {
    ouvintes.delete(avisar);
    window.removeEventListener('storage', aoMudarStorage);
  };
}

const snapshotServidor = () => VAZIO;

/** Estado bruto do progresso. Re-renderiza quando qualquer aula é concluída. */
export function useProgresso(): Estado {
  return useSyncExternalStore(assinar, ler, snapshotServidor);
}

export function concluirAula(aulaId: string, formacaoSlug: string) {
  const atual = ler();
  if (atual.aulas[aulaId]) return;
  const agora = new Date().toISOString();
  gravar({
    ...atual,
    aulas: { ...atual.aulas, [aulaId]: agora },
    formacoes: { ...atual.formacoes, [formacaoSlug]: agora },
  });
}

/** Registra "estive aqui" sem concluir — mantém a retomada apontando certo. */
export function tocarFormacao(formacaoSlug: string) {
  const atual = ler();
  gravar({
    ...atual,
    formacoes: { ...atual.formacoes, [formacaoSlug]: new Date().toISOString() },
  });
}

/**
 * ETAPA DE SOLUÇÃO — alterna, ao contrário de aula, que só conclui.
 *
 * A diferença é do objeto, não de gosto: aula assistida não "desassiste", mas
 * etapa de implementação é uma checklist de trabalho, e quem marca por engano
 * precisa desmarcar. Sem o desfazer, o único conserto seria limpar o storage.
 */
export function alternarEtapa(etapaId: string, solucaoSlug: string) {
  const atual = ler();
  const etapas = { ...atual.etapas };

  if (etapas[etapaId]) delete etapas[etapaId];
  else etapas[etapaId] = new Date().toISOString();

  gravar({
    ...atual,
    etapas,
    /* O toque é registrado nos DOIS sentidos: desmarcar também é atividade, e a
       retomada deve apontar para onde a pessoa esteve por último. */
    solucoes: { ...atual.solucoes, [solucaoSlug]: new Date().toISOString() },
  });
}

/* ── Derivações puras (recebem o estado, não o leem) ─────────────────────────── */

export function contarConcluidas(estado: Estado, aulaIds: string[]): number {
  return aulaIds.reduce((n, id) => (estado.aulas[id] ? n + 1 : n), 0);
}

export function percentual(feitas: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((feitas / total) * 100);
}

/** O slug da formação tocada mais recentemente — ou null se nunca houve toque. */
export function formacaoMaisRecente(estado: Estado): string | null {
  return maisRecente(estado.formacoes);
}

/** O slug da solução tocada mais recentemente — ou null se nunca houve toque. */
export function solucaoMaisRecente(estado: Estado): string | null {
  return maisRecente(estado.solucoes);
}

/* ISO 8601 ordena lexicograficamente na mesma ordem que cronologicamente — daí a
   comparação com `>` em vez de `new Date()` por item. */
function maisRecente(registro: Record<string, string>): string | null {
  let melhor: string | null = null;
  let quando = '';
  for (const [chave, iso] of Object.entries(registro)) {
    if (iso > quando) {
      quando = iso;
      melhor = chave;
    }
  }
  return melhor;
}

/** Quantas das etapas dadas já foram marcadas. */
export function contarEtapasFeitas(estado: Estado, etapaIds: string[]): number {
  return etapaIds.reduce((n, id) => (estado.etapas[id] ? n + 1 : n), 0);
}

/**
 * O estado de um conteúdo com progresso — solução por etapas, formação por aulas.
 *
 * O NOME DEIXOU DE DIZER "SOLUÇÃO" porque a conta nunca soube o que estava
 * contando: são dois números. Enquanto o helper se chamava `estadoDaSolucao`, o
 * catálogo de formações escreveu a MESMA regra de novo, com outros nomes e um
 * estado a menos — e as duas versões já discordavam sobre o que fazer com
 * conteúdo vazio.
 *
 * `sem-itens` é um caso à parte de `nao-iniciada`: uma solução sem passo a passo
 * cadastrado, ou uma formação sem aula nenhuma, não está "não iniciada" — ela não
 * tem o que iniciar. Sem essa distinção a tela mostraria "0/0" e uma barra vazia
 * para conteúdo que nem prevê progresso.
 */
export type EstadoProgresso = 'sem-itens' | 'nao-iniciada' | 'em-andamento' | 'concluida';

export function estadoDoProgresso(feitas: number, total: number): EstadoProgresso {
  if (total === 0) return 'sem-itens';
  if (feitas === 0) return 'nao-iniciada';
  return feitas >= total ? 'concluida' : 'em-andamento';
}
