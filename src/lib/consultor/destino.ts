import type { AcaoSobral, SinaisSobral } from './direcao';
import type { DominioRadarSobral } from './radar';

export type AcaoExecutavelSobral = {
  destino: string;
  rotulo: string;
};

function dominioDoDestino(destino: AcaoSobral['destino']): DominioRadarSobral | null {
  if (destino === '/crm') return 'crm';
  if (destino === '/calls') return 'calls';
  if (destino === '/propostas') return 'propostas';
  if (destino === '/solucoes') return 'projetos';
  return null;
}

const ROTULO_POR_DESTINO: Record<AcaoSobral['destino'], string> = {
  '/inicio': 'Abrir início',
  '/formacoes': 'Abrir formação',
  '/solucoes': 'Abrir Projetos',
  '/crm': 'Abrir no CRM',
  '/calls': 'Agendar call',
  '/propostas': 'Abrir propostas',
  '/propostas/nova': 'Criar proposta',
  '/builder': 'Personalizar projeto',
  '/mentorias': 'Abrir mentorias',
};

const ROTULO_REGISTRO: Partial<Record<DominioRadarSobral, string>> = {
  crm: 'Abrir no CRM',
  calls: 'Abrir call',
  propostas: 'Abrir proposta',
  projetos: 'Abrir projeto',
  plano: 'Abrir compromisso',
};

/**
 * Transforma uma orientação abstrata do modelo num movimento executável.
 *
 * O modelo escolhe apenas um módulo permitido. Os IDs continuam vindo dos
 * fatos do banco: quando já existe algo para retomar, abre o registro exato;
 * quando a ação precisa nascer, leva o cliente em foco para o formulário.
 */
export function resolverAcaoSobral(acao: AcaoSobral, sinais: SinaisSobral): AcaoExecutavelSobral {
  const foco = sinais.foco;

  if (acao.destino === '/propostas/nova') {
    return {
      destino: foco
        ? `/propostas/nova?oportunidade=${encodeURIComponent(foco.oportunidadeId)}`
        : acao.destino,
      rotulo: ROTULO_POR_DESTINO[acao.destino],
    };
  }

  if (acao.destino === '/builder') {
    return {
      destino: foco
        ? `/builder?oportunidade=${encodeURIComponent(foco.oportunidadeId)}`
        : acao.destino,
      rotulo: ROTULO_POR_DESTINO[acao.destino],
    };
  }

  const dominio = dominioDoDestino(acao.destino);
  const registro = dominio ? sinais.radar.find((item) => item.dominio === dominio) : undefined;

  if (registro) {
    return {
      destino: registro.destino,
      rotulo: ROTULO_REGISTRO[registro.dominio] ?? 'Executar próximo passo',
    };
  }

  if (acao.destino === '/calls' && foco) {
    return {
      destino: `/calls?nova=1&oportunidade=${encodeURIComponent(foco.oportunidadeId)}`,
      rotulo: 'Agendar call',
    };
  }

  if (acao.destino === '/crm' && foco) {
    return {
      destino: `/crm/${encodeURIComponent(foco.oportunidadeId)}`,
      rotulo: 'Abrir no CRM',
    };
  }

  return { destino: acao.destino, rotulo: ROTULO_POR_DESTINO[acao.destino] };
}
