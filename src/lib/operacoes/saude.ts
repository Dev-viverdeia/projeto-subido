export type ResumoEscalaOperacional = {
  pendentes: number;
  processando: number;
  concluidas: number;
  falhas: number;
  retomadas: number;
  espera_maxima_segundos: number;
  latencia_p95_segundos: number;
  taxa_sucesso: number;
  chamadas_provedores: number;
  falhas_provedores: number;
  latencia_p95_provedor_ms: number;
  custo_usd_micros: number;
  limite_fila_segundos: number;
  limite_taxa_falha: number;
  limite_custo_usd_micros: number;
  capacidade_prospeccao: number;
  capacidade_pos_call: number;
};

export type NivelSaudeOperacional = 'saudavel' | 'atencao' | 'critico';

export type AlertaOperacional = {
  id: 'fila' | 'falhas' | 'provedores' | 'custo';
  nivel: Exclude<NivelSaudeOperacional, 'saudavel'>;
  titulo: string;
  detalhe: string;
};

function nivel(valor: number, limite: number): NivelSaudeOperacional {
  if (valor >= limite * 2) return 'critico';
  if (valor >= limite) return 'atencao';
  return 'saudavel';
}

function piorNivel(niveis: NivelSaudeOperacional[]): NivelSaudeOperacional {
  if (niveis.includes('critico')) return 'critico';
  if (niveis.includes('atencao')) return 'atencao';
  return 'saudavel';
}

function percentual(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 }).format(
    valor,
  );
}

function duracao(segundos: number) {
  if (segundos < 60) return `${Math.max(0, Math.round(segundos))} s`;
  return `${Math.round(segundos / 60)} min`;
}

export function avaliarSaudeOperacional(resumo: ResumoEscalaOperacional) {
  const taxaFalha = Math.max(0, 1 - resumo.taxa_sucesso);
  const taxaFalhaProvedores = resumo.chamadas_provedores
    ? resumo.falhas_provedores / resumo.chamadas_provedores
    : 0;
  const niveis = {
    fila: nivel(resumo.espera_maxima_segundos, resumo.limite_fila_segundos),
    falhas: nivel(taxaFalha, resumo.limite_taxa_falha),
    provedores: nivel(taxaFalhaProvedores, resumo.limite_taxa_falha),
    custo: nivel(resumo.custo_usd_micros, resumo.limite_custo_usd_micros),
  };
  const alertas: AlertaOperacional[] = [];

  if (niveis.fila !== 'saudavel') {
    alertas.push({
      id: 'fila',
      nivel: niveis.fila,
      titulo: 'A fila está demorando mais que o combinado.',
      detalhe: `O trabalho mais antigo aguarda ${duracao(resumo.espera_maxima_segundos)}. O alerta começa em ${duracao(resumo.limite_fila_segundos)}.`,
    });
  }
  if (niveis.falhas !== 'saudavel') {
    alertas.push({
      id: 'falhas',
      nivel: niveis.falhas,
      titulo: 'Mais operações estão terminando com erro.',
      detalhe: `${percentual(taxaFalha)} das operações encerradas falharam nesta janela.`,
    });
  }
  if (niveis.provedores !== 'saudavel') {
    alertas.push({
      id: 'provedores',
      nivel: niveis.provedores,
      titulo: 'Um ou mais provedores precisam de atenção.',
      detalhe: `${percentual(taxaFalhaProvedores)} das chamadas rastreadas falharam nesta janela.`,
    });
  }
  if (niveis.custo !== 'saudavel') {
    alertas.push({
      id: 'custo',
      nivel: niveis.custo,
      titulo: 'O consumo rastreado passou do alerta diário.',
      detalhe: `Foram registrados US$ ${(resumo.custo_usd_micros / 1_000_000).toFixed(2)} em integrações.`,
    });
  }

  return {
    nivel: piorNivel(Object.values(niveis)),
    alertas,
    taxaFalha,
    taxaFalhaProvedores,
    capacidadeTotal: resumo.capacidade_prospeccao + resumo.capacidade_pos_call,
  };
}
