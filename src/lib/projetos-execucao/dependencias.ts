import type { BriefingKickoff } from './briefing';

export type ResponsavelDependencia = 'cliente' | 'prestador';
export type CategoriaDependencia = 'acesso' | 'dependencia';

export type DependenciaDoBriefing = {
  chave: string;
  titulo: string;
  categoria: CategoriaDependencia;
  responsavelTipo: ResponsavelDependencia;
  responsavelNome: string;
  visivelCliente: boolean;
};

function chaveDoTexto(prefixo: string, texto: string): string {
  let hash = 2166136261;
  const normalizado = texto.trim().toLocaleLowerCase('pt-BR');
  for (let indice = 0; indice < normalizado.length; indice += 1) {
    hash ^= normalizado.charCodeAt(indice);
    hash = Math.imul(hash, 16777619);
  }
  return `briefing:${prefixo}:${(hash >>> 0).toString(36)}`;
}

function passoDependeDoCliente(texto: string): boolean {
  return /^(cliente|empresa|respons[aá]vel do cliente)\b/i.test(texto.trim());
}

export function montarDependenciasDoBriefing(briefing: BriefingKickoff): DependenciaDoBriefing[] {
  const acessos = briefing.acessos.map((titulo) => ({
    chave: chaveDoTexto('acesso', titulo),
    titulo,
    categoria: 'acesso' as const,
    responsavelTipo: 'cliente' as const,
    responsavelNome: briefing.responsavelCliente,
    visivelCliente: true,
  }));

  const passos = briefing.proximosPassos.map((titulo) => {
    const cliente = passoDependeDoCliente(titulo);
    return {
      chave: chaveDoTexto('passo', titulo),
      titulo,
      categoria: 'dependencia' as const,
      responsavelTipo: cliente ? ('cliente' as const) : ('prestador' as const),
      responsavelNome: cliente ? briefing.responsavelCliente : briefing.responsavelTecnico,
      visivelCliente: cliente,
    };
  });

  return [...new Map([...acessos, ...passos].map((item) => [item.chave, item])).values()];
}
