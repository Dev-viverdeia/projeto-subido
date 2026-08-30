import type { OrigemBriefingKickoff } from '@/lib/projetos-execucao/briefing';

export const ROTULO_ORIGEM_BRIEFING: Record<OrigemBriefingKickoff, string> = {
  proposta: 'Dados trazidos da proposta',
  kickoff: 'Dados trazidos do kickoff',
  salvo: 'Revisado por você',
};

export const ETAPAS_BRIEFING = [
  {
    id: 'resultado',
    numero: '01',
    rotulo: 'Resultado',
    campos: ['objetivo', 'criterioSucesso'],
  },
  {
    id: 'responsaveis',
    numero: '02',
    rotulo: 'Responsáveis',
    campos: ['responsavelCliente', 'responsavelTecnico'],
  },
  {
    id: 'condicoes',
    numero: '03',
    rotulo: 'Acessos e limites',
    campos: ['acessos', 'limites'],
  },
  {
    id: 'inicio',
    numero: '04',
    rotulo: 'Primeiro plano',
    campos: ['proximosPassos'],
  },
] as const;

export type EtapaBriefingId = (typeof ETAPAS_BRIEFING)[number]['id'];
