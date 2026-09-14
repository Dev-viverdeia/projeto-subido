import type { Metadata } from 'next';
import { z } from 'zod';
import { listarPaginaAgenda, listarRetornosAgenda } from '@/lib/calls/agenda-queries';
import { lerFiltrosAgenda } from '@/lib/calls/agenda-filtros';
import { tipoCallValido } from '@/lib/calls/tipos';
import { listarOportunidadesSeletor } from '@/lib/crm/queries';
import { obterEstadoGoogleCalendar } from '@/lib/google-calendar/queries';
import { obterAcessoRecurso } from '@/lib/planos/server';
import { createClient } from '@/lib/supabase/server';
import { PainelCalls } from './_components/PainelCalls';

export const metadata: Metadata = { title: 'Reuniões' };

export default async function CallsPage({ searchParams }: PageProps<'/calls'>) {
  const acessoComercial = await obterAcessoRecurso('modulo_comercial');
  const comercialLiberado = acessoComercial.permitido;
  const parametros = await searchParams;
  const filtros = lerFiltrosAgenda(parametros);
  const agendada = z.uuid().safeParse(parametros.agendada);
  const editar = z.uuid().safeParse(parametros.editar);
  const agora = new Date();
  const [agenda, retornos, oportunidades, calendar] = await Promise.all([
    listarPaginaAgenda(filtros, agora),
    listarRetornosAgenda([
      ...(agendada.success ? [agendada.data] : []),
      ...(editar.success ? [editar.data] : []),
    ]),
    comercialLiberado ? listarOportunidadesSeletor() : Promise.resolve([]),
    obterEstadoGoogleCalendar(),
  ]);
  const supabase = await createClient();
  const { data: sessao } = await supabase.auth.getClaims();

  return (
    <PainelCalls
      reunioes={agenda.reunioes}
      retornos={retornos}
      navegacao={{ filtros, proximoCursor: agenda.proximoCursor }}
      agora={agora}
      oportunidades={oportunidades}
      comercialLiberado={comercialLiberado}
      calendar={calendar}
      agendadaId={agendada.success ? agendada.data : undefined}
      editarId={editar.success ? editar.data : undefined}
      rascunhoDono={sessao?.claims.sub}
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
