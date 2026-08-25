import type { Metadata } from 'next';
import { z } from 'zod';
import { listarReunioes } from '@/lib/calls/queries';
import { tipoCallValido } from '@/lib/calls/tipos';
import { listarOportunidadesSeletor } from '@/lib/crm/queries';
import { obterEstadoGoogleCalendar } from '@/lib/google-calendar/queries';
import { obterAcessoRecurso } from '@/lib/planos/server';
import { PainelCalls } from './_components/PainelCalls';

export const metadata: Metadata = { title: 'Reuniões' };

export default async function CallsPage({ searchParams }: PageProps<'/calls'>) {
  const acessoComercial = await obterAcessoRecurso('modulo_comercial');
  const comercialLiberado = acessoComercial.permitido;
  const [reunioes, oportunidades, calendar, parametros] = await Promise.all([
    listarReunioes(),
    comercialLiberado ? listarOportunidadesSeletor() : Promise.resolve([]),
    obterEstadoGoogleCalendar(),
    searchParams,
  ]);
  const agendada = z.uuid().safeParse(parametros.agendada);

  return (
    <PainelCalls
      reunioes={reunioes}
      oportunidades={oportunidades}
      comercialLiberado={comercialLiberado}
      calendar={calendar}
      agendadaId={agendada.success ? agendada.data : undefined}
      modalInicial={parametros.nova === '1'}
      oportunidadeInicial={
        typeof parametros.oportunidade === 'string' ? parametros.oportunidade : undefined
      }
      tipoInicial={tipoCallValido(parametros.tipo) ? parametros.tipo : undefined}
      calendarResultado={
        parametros.calendar === 'sincronizado' || parametros.calendar === 'falhou'
          ? parametros.calendar
          : undefined
      }
      pendenciaResultado={
        parametros.pendencia === 'reagendar' ||
        parametros.pendencia === 'cancelada' ||
        parametros.pendencia === 'erro'
          ? parametros.pendencia
          : undefined
      }
    />
  );
}
