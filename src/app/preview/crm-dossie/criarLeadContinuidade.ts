import type { DossieLead } from '@/lib/crm/queries';

export function criarLeadContinuidade(
  leadOperacional: DossieLead,
  leadNovo: DossieLead,
): DossieLead {
  return {
    ...leadNovo,
    oportunidade: {
      ...leadNovo.oportunidade,
      titulo: 'Expansão: SDR de Atendimento',
      dominio: leadOperacional.oportunidade.dominio,
      enriquecidoEm: leadOperacional.oportunidade.enriquecidoEm,
      proximaAcao: 'Validar a expansão para os canais de Instagram e site.',
      proximaAcaoEm: '2026-09-09T15:00:00.000Z',
      ultimoFato: 'Oportunidade criada depois da revisão da entrega',
      ultimoFatoEm: '2026-08-31T13:00:00.000Z',
    },
    empresa: leadOperacional.empresa,
    eventos: [
      {
        id: 'evento-continuidade',
        titulo: 'Oportunidade criada depois da revisão da entrega',
        descricao: 'Resultado confirmado: o tempo de primeira resposta caiu de 18 para 4 minutos.',
        tipo: 'continuidade_pos_entrega',
        ocorridoEm: '2026-08-31T13:00:00.000Z',
        fonte: 'entrega',
      },
    ],
    continuidadePosEntrega: {
      projetoId: '66666666-6666-4666-8666-666666666666',
      projetoTitulo: 'SDR de Atendimento da Clínica Aurora',
      resumoEntrega:
        'Atendimento inicial automatizado, triagem e encaminhamento para a recepção implantados.',
      resultadoPrincipal: 'Redução do tempo médio de primeira resposta no WhatsApp.',
      resultadoObservado:
        'O tempo médio de primeira resposta caiu de 18 para 4 minutos durante as quatro semanas após a implantação.',
      evidenciaResultadoUrl: 'https://example.com/resultado-clinica-aurora',
      decisao: 'expandir',
      proximoPasso: 'Validar a expansão para os canais de Instagram e site.',
      proximoPassoEm: '2026-09-09',
      aceitaEm: '2026-07-28T18:00:00.000Z',
      registradaEm: '2026-08-31T13:00:00.000Z',
    },
  };
}
