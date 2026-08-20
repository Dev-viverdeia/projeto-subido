import type { AcaoSobral, SinaisSobral } from './direcao';

function destinoDaJornada(destino: string): AcaoSobral['destino'] {
  if (destino.startsWith('/inicio')) return '/inicio';
  if (destino.startsWith('/formacoes')) return '/formacoes';
  if (destino.startsWith('/solucoes')) return '/solucoes';
  if (destino.startsWith('/vendas')) return '/vendas';
  if (destino.startsWith('/reunioes')) return '/reunioes';
  if (destino.startsWith('/propostas/nova')) return '/propostas/nova';
  if (destino.startsWith('/propostas')) return '/propostas';
  if (destino.startsWith('/builder')) return '/builder';
  if (destino.startsWith('/mentorias')) return '/mentorias';
  return '/inicio';
}

function acaoDaJornada(sinais: SinaisSobral): AcaoSobral {
  const passo = sinais.jornada.proximoPasso;
  return {
    titulo: passo.titulo,
    detalhe: passo.detalhe,
    evidencia: passo.evidencia,
    destino: destinoDaJornada(passo.destino),
  };
}

export function alinharAcoesComJornada(sinais: SinaisSobral, acoes: AcaoSobral[]): AcaoSobral[] {
  const principal = acaoDaJornada(sinais);
  return [
    principal,
    ...acoes.filter(
      (item) => item.titulo !== principal.titulo || item.destino !== principal.destino,
    ),
  ].slice(0, 3);
}
