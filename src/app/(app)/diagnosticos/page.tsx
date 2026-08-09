import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileSearch, Plus, ScanSearch } from 'lucide-react';
import { listarDiagnosticos } from '@/lib/diagnosticos/queries';
import { ROTULO_CANAL } from '@/lib/diagnosticos/schema';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Diagnósticos de atendimento' };

const ROTULO_STATUS = {
  na_fila: 'Preparando',
  processando: 'Analisando',
  concluido: 'Concluído',
  falhou: 'Revisar',
} as const;

function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(iso));
}

export default async function DiagnosticosPage() {
  const diagnosticos = await listarDiagnosticos();
  const concluidos = diagnosticos.filter((item) => item.status === 'concluido');
  const notas = concluidos.flatMap((item) => (item.notaGeral === null ? [] : [item.notaGeral]));
  const media = notas.length
    ? Math.round(notas.reduce((total, nota) => total + nota, 0) / notas.length)
    : null;
  const emAnalise = diagnosticos.filter(
    (item) => item.status === 'na_fila' || item.status === 'processando',
  ).length;

  return (
    <div className={styles.pagina}>
      <section
        className={`${styles.hero} via-noise`}
        data-on-dark
        aria-labelledby="diagnosticos-titulo"
      >
        <div className={styles.heroTexto}>
          <p className={styles.sobretituloClaro}>Inteligência de pré-venda</p>
          <h1 id="diagnosticos-titulo">Veja o atendimento pelo olhar do cliente.</h1>
          <p>
            Observe a jornada pública, analise conversas autorizadas e converta falhas verificáveis
            em um plano de projeto.
          </p>
          <Link href="/diagnosticos/novo" className={styles.ctaHero}>
            Criar diagnóstico <Plus size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className={styles.leituraHero} aria-label="Como o diagnóstico funciona">
          <span className={styles.mira} aria-hidden="true">
            <ScanSearch size={30} strokeWidth={1.35} />
          </span>
          <ol>
            <li>
              <span>01</span> Coleta o que pode ser observado
            </li>
            <li>
              <span>02</span> Separa evidência de hipótese
            </li>
            <li>
              <span>03</span> Desenha a correção e a abordagem
            </li>
          </ol>
        </div>
      </section>

      <section className={styles.resumo} aria-label="Resumo dos diagnósticos">
        <article>
          <strong>{diagnosticos.length}</strong>
          <span>diagnósticos criados</span>
        </article>
        <article>
          <strong>{media ?? '—'}</strong>
          <span>{media === null ? 'sem nota medida' : 'média observada'}</span>
        </article>
        <article>
          <strong>{emAnalise}</strong>
          <span>em análise agora</span>
        </article>
      </section>

      <section className={styles.historico} aria-labelledby="historico-titulo">
        <header className={styles.historicoTopo}>
          <div>
            <p className={styles.sobretitulo}>Biblioteca de evidências</p>
            <h2 id="historico-titulo">Relatórios recentes</h2>
          </div>
          <span>{diagnosticos.length} no total</span>
        </header>

        {diagnosticos.length ? (
          <div className={styles.lista}>
            {diagnosticos.map((diagnostico) => (
              <Link
                href={`/diagnosticos/${diagnostico.id}`}
                className={styles.item}
                key={diagnostico.id}
              >
                <span className={styles.data}>{dataCurta(diagnostico.solicitadoEm)}</span>
                <span className={styles.identidade}>
                  <strong>{diagnostico.empresa}</strong>
                  <small>{diagnostico.oportunidade}</small>
                </span>
                <span className={styles.canal}>{ROTULO_CANAL[diagnostico.canal]}</span>
                <span className={styles.status} data-status={diagnostico.status}>
                  {ROTULO_STATUS[diagnostico.status]}
                </span>
                <span className={styles.nota}>
                  {diagnostico.notaGeral ?? '—'}
                  <small>{diagnostico.notaGeral === null ? 'sem nota' : 'de 100'}</small>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.vazio}>
            <FileSearch size={26} strokeWidth={1.45} aria-hidden="true" />
            <div>
              <h3>O primeiro laudo começa por um lead real</h3>
              <p>Escolha uma oportunidade do CRM e defina o cenário que será observado.</p>
            </div>
            <Link href="/diagnosticos/novo">Criar diagnóstico</Link>
          </div>
        )}
      </section>
    </div>
  );
}
