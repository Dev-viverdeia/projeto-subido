import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SalaCall } from '@/app/sala/[codigo]/SalaCall';
import type { ConviteCall } from '@/lib/calls/queries';

export const metadata: Metadata = { title: 'Preview · Sala da reunião' };

const CONVITE: ConviteCall = {
  reuniaoId: 'preview-sala-call',
  titulo: 'Descoberta do atendimento da Clínica Rios',
  agendadaPara: '2026-08-12T18:30:00-03:00',
  duracaoMinutos: 45,
  status: 'agendada',
  liveCoachAtivo: true,
  salaProvedor: 'preview',
  disponivel: true,
};

export default function PreviewSalaCallPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <SalaCall
      codigo="preview"
      convite={CONVITE}
      anfitriao
      nomeSugerido="Rafael Milagre"
      videoConfigurado
    />
  );
}
