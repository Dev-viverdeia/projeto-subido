import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { resolverReuniaoProposta } from '@/lib/propostas/contexto-reuniao';
import { listarOpcoesNovaProposta, obterPropostaDaReuniao } from '@/lib/propostas/queries';
import { MontadorProposta } from './_components/MontadorProposta';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Nova proposta' };

export default async function NovaPropostaPage({ searchParams }: PageProps<'/propostas/nova'>) {
  const parametros = await searchParams;
  const oportunidadeInicial =
    typeof parametros.oportunidade === 'string' ? parametros.oportunidade : '';
  const origemInicial =
    typeof parametros.projeto === 'string'
      ? `projeto:${parametros.projeto}`
      : typeof parametros.builder === 'string'
        ? `estudio:${parametros.builder}`
        : parametros.origem === 'sem-base'
          ? 'sem-base'
          : '';
  const reuniaoSolicitada = typeof parametros.reuniao === 'string' ? parametros.reuniao : '';
  const erro = typeof parametros.erro === 'string' ? parametros.erro : null;
  const [opcoes, posCall] = await Promise.all([
    listarOpcoesNovaProposta(),
    oportunidadeInicial
      ? resolverReuniaoProposta(oportunidadeInicial, reuniaoSolicitada)
      : Promise.resolve(null),
  ]);
  const reuniaoInicial = posCall?.reuniao.id ?? '';
  const propostaExistente = reuniaoInicial ? await obterPropostaDaReuniao(reuniaoInicial) : null;
  if (propostaExistente) redirect(`/propostas/${propostaExistente.id}?origem=reuniao`);
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
  const retorno =
    reuniaoSolicitada && posCall
      ? { href: `/reunioes/${posCall.reuniao.id}`, rotulo: 'Voltar à reunião' }
      : opcoes.oportunidades.some((item) => item.id === oportunidadeInicial)
        ? { href: `/vendas/${oportunidadeInicial}`, rotulo: 'Voltar à ficha' }
        : { href: '/propostas', rotulo: 'Voltar às propostas' };

  return (
    <div className={styles.pagina}>
      <Link href={retorno.href} className={styles.voltar}>
        <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
        {retorno.rotulo}
      </Link>

      <header className={styles.hero}>
        <h1>Criar proposta</h1>
        <p>Do que foi conversado ao que você vai entregar.</p>
      </header>

      <MontadorProposta
        key={[oportunidadeInicial, origemInicial, reuniaoInicial, erro].join(':')}
        opcoes={opcoes}
        oportunidadeInicial={oportunidadeInicial}
        origemInicial={origemInicial}
        reuniaoInicial={reuniaoInicial}
        contextoCall={contextoCall}
        erro={erro || (reuniaoSolicitada && !posCall ? 'reuniao' : null)}
      />
    </div>
  );
}
