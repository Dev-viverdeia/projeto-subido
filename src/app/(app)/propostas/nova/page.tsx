import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { obterPosCall } from '@/lib/calls/queries';
import { listarOpcoesNovaProposta, obterPropostaDaReuniao } from '@/lib/propostas/queries';
import { MontadorProposta } from './_components/MontadorProposta';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Nova proposta comercial' };

export default async function NovaPropostaPage({ searchParams }: PageProps<'/propostas/nova'>) {
  const parametros = await searchParams;
  const oportunidadeInicial =
    typeof parametros.oportunidade === 'string' ? parametros.oportunidade : '';
  const origemInicial =
    typeof parametros.projeto === 'string'
      ? `projeto:${parametros.projeto}`
      : typeof parametros.builder === 'string'
        ? `estudio:${parametros.builder}`
        : '';
  const reuniaoInicial = typeof parametros.reuniao === 'string' ? parametros.reuniao : '';
  const diagnosticoInicial =
    typeof parametros.diagnostico === 'string' ? parametros.diagnostico : '';
  const erro = typeof parametros.erro === 'string' ? parametros.erro : null;
  const [opcoes, posCall, propostaExistente] = await Promise.all([
    listarOpcoesNovaProposta(),
    reuniaoInicial ? obterPosCall(reuniaoInicial) : Promise.resolve(null),
    reuniaoInicial ? obterPropostaDaReuniao(reuniaoInicial) : Promise.resolve(null),
  ]);
  if (propostaExistente) redirect(`/propostas/${propostaExistente.id}?origem=call`);
  const analise =
    posCall?.oportunidade.id === oportunidadeInicial &&
    posCall.analise?.status === 'concluida' &&
    posCall.analise.resumo
      ? posCall.analise
      : null;
  const contextoCall =
    posCall && analise
      ? {
          titulo: posCall.reuniao.titulo,
          resumo: analise.resumo ?? '',
          decisoes: analise.decisoes.length,
          compromissos: analise.compromissos.length,
          pontosAValidar: new Set([...analise.objecoes, ...analise.lacunas]).size,
          oportunidadesProjeto: analise.oportunidadesProjeto,
        }
      : null;
  const veioDaCall = Boolean(contextoCall);

  return (
    <div className={styles.pagina}>
      <Link href="/propostas" className={styles.voltar}>
        <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
        Voltar às propostas
      </Link>

      <header className={styles.hero}>
        <div>
          <p className={styles.sobretitulo}>
            {veioDaCall ? 'Da call para a proposta' : 'Novo documento'}
          </p>
          <h1>
            {veioDaCall
              ? 'A conversa já preparou o primeiro rascunho.'
              : 'Conecte o contexto ao que você vai entregar.'}
          </h1>
        </div>
        <p>
          {veioDaCall
            ? 'Cliente, fatos confirmados e pontos a validar já estão conectados. Escolha a estrutura da entrega e revise o documento.'
            : 'A plataforma usa os fatos do CRM e a estrutura do Projeto para preparar o primeiro rascunho. Você continua no controle de cada palavra.'}
        </p>
      </header>

      <MontadorProposta
        opcoes={opcoes}
        oportunidadeInicial={oportunidadeInicial}
        origemInicial={origemInicial}
        reuniaoInicial={reuniaoInicial}
        diagnosticoInicial={diagnosticoInicial}
        contextoCall={contextoCall}
        erro={Boolean(erro)}
      />
    </div>
  );
}
