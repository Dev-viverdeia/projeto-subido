import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SalaCall } from '@/app/sala/[codigo]/SalaCall';
import type { ConviteCall } from '@/lib/calls/queries';

export const metadata: Metadata = { title: 'Preview · Sala da reunião' };

const CONVITE: ConviteCall = {
  reuniaoId: 'preview-sala-call',
  titulo: 'Descoberta do atendimento da Clínica Rios',
  tipo: 'descoberta',
  agendadaPara: '2026-08-12T18:30:00-03:00',
  duracaoMinutos: 45,
  status: 'agendada',
  liveCoachAtivo: true,
  salaProvedor: 'preview',
  disponivel: true,
};

export default async function PreviewSalaCallPage({
  searchParams,
}: PageProps<'/preview/sala-call'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;
  const kickoff = parametros.tipo === 'kickoff';
  const convite: ConviteCall = kickoff
    ? { ...CONVITE, tipo: 'kickoff', titulo: 'Kickoff do projeto de atendimento' }
    : CONVITE;

  return (
    <SalaCall
      codigo="preview"
      convite={convite}
      anfitriao
      nomeSugerido="Rafael Milagre"
      videoConfigurado
      planoAnfitriao={
        kickoff
          ? {
              origem: 'base',
              objetivo: 'Começar o projeto com resultado, responsáveis e acessos claros.',
              abertura: 'Hoje vamos transformar o que foi vendido em um plano claro.',
              perguntas: [
                {
                  etapa: 'contexto',
                  pergunta: 'Qual resultado mostra que este projeto deu certo?',
                  intencao: 'Definir o critério de sucesso.',
                  projetoRelacionado: null,
                },
              ],
              fechamento: {
                sinalParaAvancar: 'Resultado, responsáveis, acessos e prazo definidos.',
                frase: 'Podemos recapitular o acordo?',
                proximoPasso: 'Revisar o acordo do projeto.',
              },
              fatos: [],
              hipoteses: [],
              projetos: [],
            }
          : null
      }
    />
  );
}
