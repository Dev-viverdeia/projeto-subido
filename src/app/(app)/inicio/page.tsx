import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listarAgenda } from '@/lib/mentorias/queries';
import { listarFormacoes, listarSolucoes } from '@/lib/conteudo/queries';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { ICONES_CATEGORIAS, ICONE_CATEGORIA_PADRAO } from '../_components/iconesCategorias';
import entrada from '../_components/entrada.module.css';
import { RetomadaFormacao } from '../formacoes/_components/RetomadaFormacao';
import { horaCurta, rotuloDoDia } from '../mentorias/_components/estadoMentoria';
import { CartaoSolucao } from '../solucoes/_components/CartaoSolucao';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Início' };

/**
 * O painel de entrada compõe os três pilares SEM inventar número: a retomada só
 * aparece com progresso local real, as soluções são as últimas publicadas do
 * banco, e a mentoria vem da agenda — que deixou de ser gerada em código.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const [{ data }, solucoes, formacoes, agenda] = await Promise.all([
    supabase.auth.getClaims(),
    listarSolucoes(),
    listarFormacoes(),
    listarAgenda(),
  ]);

  const claims = data?.claims;
  const meta = (claims?.user_metadata ?? {}) as { nome?: string };
  const nome = meta.nome?.split(' ')[0] ?? null;

  const agora = new Date();
  /* A agenda já vem ordenada por início; aqui só sobra descartar o que terminou.
     Sem mentoria cadastrada, o bloco inteiro some — nada de convite vazio. */
  const proximaMentoria = agenda.find((s) => new Date(s.fimIso).getTime() > agora.getTime());

  const recentes = solucoes.slice(0, 3);

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo={nome ? `Bem-vindo, ${nome}` : 'Início'} oculto />

      <div className={`${entrada.bloco} ${styles.linhaTopo}`}>
        <RetomadaFormacao formacoes={formacoes} />

        {proximaMentoria && (
          <Link href="/mentorias" className={styles.mentoria}>
            <span className={styles.mentoriaTextos}>
              {/* A pill "demonstração" saiu junto com os dados de exemplo: a
                  sessão que aparece aqui está cadastrada e publicada. */}
              <span className={styles.mentoriaRotulo}>Próxima mentoria</span>
              <span className={styles.mentoriaTitulo}>{proximaMentoria.titulo}</span>
              <span className={styles.mentoriaMeta}>
                {rotuloDoDia(proximaMentoria.inicioIso, agora).principal} ·{' '}
                {horaCurta(proximaMentoria.inicioIso)}
              </span>
            </span>
            <span className={styles.mentoriaSeta} aria-hidden="true">
              <ArrowRight size={16} strokeWidth={2} />
            </span>
          </Link>
        )}
      </div>

      {recentes.length > 0 && (
        <section
          className={`${entrada.bloco} ${entrada.atraso1} ${styles.secao}`}
          aria-labelledby="inicio-solucoes"
        >
          <div className={styles.secaoTopo}>
            <h2 id="inicio-solucoes" className={styles.secaoTitulo}>
              Últimas soluções
            </h2>
            <Link href="/solucoes" className={styles.verTodas}>
              Ver todas
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.grade}>
            {recentes.map((solucao) => (
              <CartaoSolucao
                key={solucao.id}
                solucao={solucao}
                icone={
                  (solucao.categoria && ICONES_CATEGORIAS[solucao.categoria]) ||
                  ICONE_CATEGORIA_PADRAO
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
