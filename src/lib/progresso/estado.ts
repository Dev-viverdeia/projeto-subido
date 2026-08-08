export type EstadoProgressoConta = {
  /** aulaId → ISO da primeira conclusão. */
  aulas: Record<string, string>;
  /** slug da formação → ISO da atividade mais recente. */
  formacoes: Record<string, string>;
  /** chave editorial da etapa → ISO da conclusão. */
  etapas: Record<string, string>;
  /** slug do projeto → ISO da atividade mais recente. */
  solucoes: Record<string, string>;
};

export const PROGRESSO_VAZIO: EstadoProgressoConta = {
  aulas: {},
  formacoes: {},
  etapas: {},
  solucoes: {},
};

function escolherData(a: string | undefined, b: string, modo: 'primeira' | 'ultima'): string {
  if (!a) return b;
  return modo === 'primeira' ? (a < b ? a : b) : a > b ? a : b;
}

/**
 * Une o registro da conta com o legado do navegador sem mudar datas históricas:
 * conclusão preserva a primeira data; retomada preserva a atividade mais nova.
 */
export function mesclarProgresso(
  conta: EstadoProgressoConta,
  legado: EstadoProgressoConta,
): EstadoProgressoConta {
  const aulas = { ...conta.aulas };
  const formacoes = { ...conta.formacoes };
  const etapas = { ...conta.etapas };
  const solucoes = { ...conta.solucoes };

  for (const [id, iso] of Object.entries(legado.aulas)) {
    aulas[id] = escolherData(aulas[id], iso, 'primeira');
  }
  for (const [slug, iso] of Object.entries(legado.formacoes)) {
    formacoes[slug] = escolherData(formacoes[slug], iso, 'ultima');
  }
  for (const [id, iso] of Object.entries(legado.etapas)) {
    etapas[id] = escolherData(etapas[id], iso, 'primeira');
  }
  for (const [slug, iso] of Object.entries(legado.solucoes)) {
    solucoes[slug] = escolherData(solucoes[slug], iso, 'ultima');
  }

  return { aulas, formacoes, etapas, solucoes };
}

export function temProgresso(estado: EstadoProgressoConta): boolean {
  return (
    Object.keys(estado.aulas).length > 0 ||
    Object.keys(estado.formacoes).length > 0 ||
    Object.keys(estado.etapas).length > 0 ||
    Object.keys(estado.solucoes).length > 0
  );
}

export function contarConcluidas(estado: EstadoProgressoConta, aulaIds: string[]): number {
  return aulaIds.reduce((n, id) => (estado.aulas[id] ? n + 1 : n), 0);
}

export function percentual(feitas: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((feitas / total) * 100);
}

export function formacaoMaisRecente(estado: EstadoProgressoConta): string | null {
  return maisRecente(estado.formacoes);
}

export function solucaoMaisRecente(estado: EstadoProgressoConta): string | null {
  return maisRecente(estado.solucoes);
}

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

export function contarEtapasFeitas(estado: EstadoProgressoConta, etapaIds: string[]): number {
  return etapaIds.reduce((n, id) => (estado.etapas[id] ? n + 1 : n), 0);
}

export type EstadoProgresso = 'sem-itens' | 'nao-iniciada' | 'em-andamento' | 'concluida';

export function estadoDoProgresso(feitas: number, total: number): EstadoProgresso {
  if (total === 0) return 'sem-itens';
  if (feitas === 0) return 'nao-iniciada';
  return feitas >= total ? 'concluida' : 'em-andamento';
}
