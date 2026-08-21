export const PERIODOS_METRICAS = ['30d', '90d', 'total'] as const;

export type PeriodoMetricas = (typeof PERIODOS_METRICAS)[number];

export const ROTULO_PERIODO: Record<PeriodoMetricas, string> = {
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  total: 'Todo o histórico',
};

export type LeadMetrica = {
  criadoEm: string;
  ultimoContatoEm: string | null;
  tentativasContato: number;
};

export type OportunidadeMetrica = {
  criadoEm: string;
  etapa: string;
  valorCentavos: number | null;
  proximaAcao: string | null;
  ganhaEm: string | null;
  perdidaEm: string | null;
  motivoPerda: string | null;
};

export type PropostaMetrica = {
  status: string;
  apresentadaEm: string | null;
};

export type CallMetrica = {
  status: string;
  encerradaEm: string | null;
};

export type FonteMetricasComerciais = {
  leads: LeadMetrica[];
  oportunidades: OportunidadeMetrica[];
  propostas: PropostaMetrica[];
  calls: CallMetrica[];
};

export type ContagemComercial = {
  prospeccoes: number;
  abordagens: number;
  oportunidades: number;
  propostas: number;
  ganhos: number;
  perdas: number;
};

export type TaxasComerciais = {
  abordagem: number | null;
  oportunidade: number | null;
  proposta: number | null;
  fechamento: number | null;
  total: number | null;
};

export type DiagnosticoComercial = {
  titulo: string;
  descricao: string;
  observacoes: string[];
  acao: {
    rotulo: string;
    href: '/prospeccao' | '/vendas' | '/propostas' | '/reunioes';
  };
};

export type MetricasComerciais = {
  periodo: PeriodoMetricas;
  rotuloPeriodo: string;
  inicioPeriodo: string | null;
  funil: ContagemComercial;
  periodoAnterior: ContagemComercial | null;
  taxas: TaxasComerciais;
  saude: {
    oportunidadesAbertas: number;
    semProximaAcao: number;
    propostasAguardando: number;
    callsConcluidas: number;
    valorPipelineCentavos: number;
    ticketMedioGanhoCentavos: number | null;
  };
  perdasPorMotivo: Array<{ motivo: string; quantidade: number }>;
  diagnostico: DiagnosticoComercial;
  temAtividade: boolean;
};

type Janela = {
  inicio: number | null;
  fim: number;
};

const DIA_EM_MS = 86_400_000;

const ROTULOS_MOTIVO_PERDA: Record<string, string> = {
  preco: 'Investimento',
  sem_prioridade: 'Sem prioridade agora',
  sem_resposta: 'Sem resposta',
  concorrente: 'Escolheu outra solução',
  projeto_adiado: 'Projeto adiado',
  proposta_recusada: 'Proposta não aprovada',
  outro: 'Outro motivo',
};

export function lerPeriodoMetricas(valor: string | string[] | undefined): PeriodoMetricas {
  const primeiro = Array.isArray(valor) ? valor[0] : valor;
  return PERIODOS_METRICAS.includes(primeiro as PeriodoMetricas)
    ? (primeiro as PeriodoMetricas)
    : '30d';
}

export function inicioLeituraMetricas(periodo: PeriodoMetricas, agora = new Date()): string | null {
  if (periodo === 'total') return null;
  const dias = periodo === '30d' ? 60 : 180;
  return new Date(agora.getTime() - dias * DIA_EM_MS).toISOString();
}

function criarJanelas(
  periodo: PeriodoMetricas,
  agora: Date,
): {
  atual: Janela;
  anterior: Janela | null;
} {
  const fim = agora.getTime();
  if (periodo === 'total') return { atual: { inicio: null, fim }, anterior: null };

  const dias = periodo === '30d' ? 30 : 90;
  const inicioAtual = fim - dias * DIA_EM_MS;
  return {
    atual: { inicio: inicioAtual, fim },
    anterior: { inicio: inicioAtual - dias * DIA_EM_MS, fim: inicioAtual },
  };
}

function estaNaJanela(valor: string | null, janela: Janela): boolean {
  if (!valor) return false;
  const instante = Date.parse(valor);
  if (!Number.isFinite(instante) || instante > janela.fim) return false;
  return janela.inicio === null || instante >= janela.inicio;
}

function percentual(numerador: number, denominador: number): number | null {
  if (denominador <= 0) return null;
  return Math.round((numerador / denominador) * 100);
}

function contarNaJanela(fonte: FonteMetricasComerciais, janela: Janela): ContagemComercial {
  return {
    prospeccoes: fonte.leads.filter((lead) => estaNaJanela(lead.criadoEm, janela)).length,
    abordagens: fonte.leads.filter(
      (lead) => lead.tentativasContato > 0 && estaNaJanela(lead.ultimoContatoEm, janela),
    ).length,
    oportunidades: fonte.oportunidades.filter((item) => estaNaJanela(item.criadoEm, janela)).length,
    propostas: fonte.propostas.filter((item) => estaNaJanela(item.apresentadaEm, janela)).length,
    ganhos: fonte.oportunidades.filter((item) => estaNaJanela(item.ganhaEm, janela)).length,
    perdas: fonte.oportunidades.filter((item) => estaNaJanela(item.perdidaEm, janela)).length,
  };
}

function criarDiagnostico(
  funil: ContagemComercial,
  taxas: TaxasComerciais,
  saude: MetricasComerciais['saude'],
): DiagnosticoComercial {
  const observacoes: string[] = [];
  if (taxas.abordagem !== null) {
    observacoes.push(`${taxas.abordagem}% das empresas encontradas receberam uma abordagem.`);
  }
  if (saude.semProximaAcao > 0) {
    observacoes.push(
      `${saude.semProximaAcao} ${saude.semProximaAcao === 1 ? 'oportunidade aberta está' : 'oportunidades abertas estão'} sem próxima ação.`,
    );
  }
  if (saude.propostasAguardando > 0) {
    observacoes.push(
      `${saude.propostasAguardando} ${saude.propostasAguardando === 1 ? 'proposta aguarda' : 'propostas aguardam'} resposta do cliente.`,
    );
  }
  if (taxas.fechamento !== null) {
    observacoes.push(`${taxas.fechamento}% das decisões terminaram em venda ganha.`);
  }

  if (funil.prospeccoes === 0) {
    return {
      titulo: 'Ainda falta uma lista para analisar.',
      descricao: 'Crie uma prospecção para começar a medir abordagem, avanço no CRM e fechamento.',
      observacoes: ['Os indicadores passam a ser calculados assim que as empresas forem salvas.'],
      acao: { rotulo: 'Criar lista', href: '/prospeccao' },
    };
  }

  if (funil.abordagens === 0 || (taxas.abordagem !== null && taxas.abordagem < 35)) {
    return {
      titulo: 'O gargalo está na primeira abordagem.',
      descricao:
        'Há empresas na lista, mas poucas receberam uma tentativa de contato. Trabalhe a lista antes de buscar mais volume.',
      observacoes: observacoes.slice(0, 3),
      acao: { rotulo: 'Trabalhar lista', href: '/prospeccao' },
    };
  }

  if (funil.oportunidades === 0 || (taxas.oportunidade !== null && taxas.oportunidade < 15)) {
    return {
      titulo: 'As abordagens ainda não viraram oportunidades.',
      descricao:
        'Revise a mensagem inicial e leve para Vendas apenas as empresas que aceitaram conversar sobre um projeto.',
      observacoes: observacoes.slice(0, 3),
      acao: { rotulo: 'Revisar vendas', href: '/vendas' },
    };
  }

  if (funil.propostas === 0 || (taxas.proposta !== null && taxas.proposta < 25)) {
    return {
      titulo: 'As oportunidades não estão chegando à proposta.',
      descricao:
        'Confira se as reuniões estão confirmando problema, prioridade, decisão e próximo passo antes de montar o documento.',
      observacoes: observacoes.slice(0, 3),
      acao: { rotulo: 'Ver reuniões', href: '/reunioes' },
    };
  }

  if (funil.ganhos + funil.perdas === 0) {
    return {
      titulo: 'As propostas precisam de uma decisão.',
      descricao:
        'Registre o próximo follow-up e confirme com o cliente quando a proposta será aprovada ou recusada.',
      observacoes: observacoes.slice(0, 3),
      acao: { rotulo: 'Ver propostas', href: '/propostas' },
    };
  }

  if (saude.semProximaAcao > 0) {
    return {
      titulo: 'O pipeline pede próximas ações.',
      descricao:
        'Antes de aumentar a prospecção, defina data e tarefa para cada oportunidade que continua aberta.',
      observacoes: observacoes.slice(0, 3),
      acao: { rotulo: 'Organizar vendas', href: '/vendas' },
    };
  }

  return {
    titulo: 'O processo comercial está avançando.',
    descricao:
      'Use a consultoria para revisar as perdas, repetir o que gerou vendas e definir a próxima meta de atividade.',
    observacoes: observacoes.slice(0, 3),
    acao: { rotulo: 'Revisar vendas', href: '/vendas' },
  };
}

export function montarMetricasComerciais(
  fonte: FonteMetricasComerciais,
  periodo: PeriodoMetricas,
  agora = new Date(),
): MetricasComerciais {
  const janelas = criarJanelas(periodo, agora);
  const funil = contarNaJanela(fonte, janelas.atual);
  const periodoAnterior = janelas.anterior ? contarNaJanela(fonte, janelas.anterior) : null;
  const oportunidadesAbertas = fonte.oportunidades.filter(
    (item) => item.etapa !== 'ganho' && item.etapa !== 'perdido',
  );
  const ganhosDoPeriodo = fonte.oportunidades.filter((item) =>
    estaNaJanela(item.ganhaEm, janelas.atual),
  );
  const valoresGanhos = ganhosDoPeriodo
    .map((item) => item.valorCentavos)
    .filter((valor): valor is number => valor !== null);
  const taxas: TaxasComerciais = {
    abordagem: percentual(funil.abordagens, funil.prospeccoes),
    oportunidade: percentual(funil.oportunidades, funil.abordagens),
    proposta: percentual(funil.propostas, funil.oportunidades),
    fechamento: percentual(funil.ganhos, funil.ganhos + funil.perdas),
    total: percentual(funil.ganhos, funil.prospeccoes),
  };
  const saude: MetricasComerciais['saude'] = {
    oportunidadesAbertas: oportunidadesAbertas.length,
    semProximaAcao: oportunidadesAbertas.filter((item) => !item.proximaAcao?.trim()).length,
    propostasAguardando: fonte.propostas.filter((item) => item.status === 'apresentada').length,
    callsConcluidas: fonte.calls.filter(
      (item) => item.status === 'concluida' && estaNaJanela(item.encerradaEm, janelas.atual),
    ).length,
    valorPipelineCentavos: oportunidadesAbertas.reduce(
      (total, item) => total + (item.valorCentavos ?? 0),
      0,
    ),
    ticketMedioGanhoCentavos: valoresGanhos.length
      ? Math.round(valoresGanhos.reduce((total, valor) => total + valor, 0) / valoresGanhos.length)
      : null,
  };

  const perdas = new Map<string, number>();
  for (const oportunidade of fonte.oportunidades) {
    if (!estaNaJanela(oportunidade.perdidaEm, janelas.atual)) continue;
    const chave = oportunidade.motivoPerda?.trim() || 'outro';
    perdas.set(chave, (perdas.get(chave) ?? 0) + 1);
  }
  const perdasPorMotivo = [...perdas.entries()]
    .map(([motivo, quantidade]) => ({
      motivo: ROTULOS_MOTIVO_PERDA[motivo] ?? 'Outro motivo',
      quantidade,
    }))
    .sort((a, b) => b.quantidade - a.quantidade || a.motivo.localeCompare(b.motivo));

  return {
    periodo,
    rotuloPeriodo: ROTULO_PERIODO[periodo],
    inicioPeriodo:
      janelas.atual.inicio === null ? null : new Date(janelas.atual.inicio).toISOString(),
    funil,
    periodoAnterior,
    taxas,
    saude,
    perdasPorMotivo,
    diagnostico: criarDiagnostico(funil, taxas, saude),
    temAtividade: Object.values(funil).some((valor) => valor > 0),
  };
}
