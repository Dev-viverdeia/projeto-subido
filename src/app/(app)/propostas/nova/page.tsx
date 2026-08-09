import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { listarOpcoesNovaProposta } from '@/lib/propostas/queries';
import { MontadorProposta } from './_components/MontadorProposta';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Nova proposta comercial' };

export default async function NovaPropostaPage({ searchParams }: PageProps<'/propostas/nova'>) {
  const [opcoes, parametros] = await Promise.all([listarOpcoesNovaProposta(), searchParams]);
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

  return (
    <div className={styles.pagina}>
      <Link href="/propostas" className={styles.voltar}>
        <ArrowLeft size={15} strokeWidth={1.9} aria-hidden="true" />
        Voltar às propostas
      </Link>

      <header className={styles.hero}>
        <p className={styles.sobretitulo}>Novo documento</p>
        <h1>Conecte o contexto ao que você vai entregar.</h1>
        <p>
          A plataforma usa os fatos do CRM e a estrutura do Projeto para preparar o primeiro
          rascunho. Você continua no controle de cada palavra.
        </p>
      </header>

      <MontadorProposta
        opcoes={opcoes}
        oportunidadeInicial={oportunidadeInicial}
        origemInicial={origemInicial}
        reuniaoInicial={reuniaoInicial}
        diagnosticoInicial={diagnosticoInicial}
        erro={Boolean(erro)}
      />
    </div>
  );
}
