import { notFound } from 'next/navigation';
import '@livekit/components-styles';
import { montarPlanoCall } from '@/lib/calls/plano';
import { tipoCallValido } from '@/lib/calls/tipos';
import { SalaDispositivosPreview } from '../sala-dispositivos/SalaDispositivosPreview';

/** Sala sintética, sem conexão, gravação ou geração. Nunca disponível em produção. */
export default async function PreviewRoteiroSala({
  searchParams,
}: PageProps<'/preview/roteiro-sala'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const params = await searchParams;
  if (params.papel === 'convidado') return <SalaDispositivosPreview convidado />;
  const tipo = tipoCallValido(params.tipo) ? params.tipo : 'descoberta';
  const plano = montarPlanoCall({
    tipo,
    empresa: 'Horizonte',
    oportunidade: 'Atendimento com IA',
    proximaAcao: 'Combinar um piloto com o responsável.',
    dossie: null,
  });
  if (params.estado === 'vazio') plano.perguntas = [];
  if (params.estado === 'extenso' && plano.perguntas[0])
    plano.perguntas[0].pergunta +=
      ' Considere os turnos da manhã e da noite, as mensagens que chegam fora do horário e os contatos que dependem da aprovação de outra pessoa para receber uma resposta.';
  return (
    <SalaDispositivosPreview
      reuniaoId={params.reuniao === 'outra' ? 'preview-outra-reuniao' : 'preview-roteiro-sala'}
      falharSaida={params.saida === 'erro'}
      roteiro={{
        plano: params.estado === 'indisponivel' ? null : plano,
        tipo,
        ativo: params.coach === 'ligado',
      }}
    />
  );
}
