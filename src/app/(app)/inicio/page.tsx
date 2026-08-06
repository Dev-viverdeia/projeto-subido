import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listarSolucoesDoBuilder } from '@/lib/builder/queries';
import { listarThreads } from '@/lib/consultor/queries';
import { listarFormacoes, listarSolucoes } from '@/lib/conteudo/queries';
import { listarAgenda } from '@/lib/mentorias/queries';
import { createClient } from '@/lib/supabase/server';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import { ICONES_CATEGORIAS, ICONE_CATEGORIA_PADRAO } from '../_components/iconesCategorias';
import entrada from '../_components/entrada.module.css';
import { RetomadaFormacao } from '../formacoes/_components/RetomadaFormacao';
import { horaCurta, rotuloDoDia } from '../mentorias/_components/estadoMentoria';
import { CartaoSolucao } from '../solucoes/_components/CartaoSolucao';
import { MapaPlataforma } from './_components/MapaPlataforma';
import { PainelProgresso } from './_components/PainelProgresso';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Início' };

/**
 * O INÍCIO: saudação, o mapa da plataforma com o número real de cada pilar,
 * os dois gráficos de progresso e o trilho do agora (retomada + mentoria).
 *
 * SEM NÚMERO INVENTADO — a regra que este painel sempre carregou, agora com
 * mais números: aulas/etapas/certificados derivam do progresso local deste
 * navegador (cliente); projetos, conversas e a agenda vêm do banco via RLS.
 * Todo tile leva para a tela dona do número.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const [{ data }, solucoes, formacoes, agenda, projetos, conversas] = await Promise.all([
    supabase.auth.getClaims(),
    listarSolucoes(),
    listarFormacoes(),
    listarAgenda(),
    listarSolucoesDoBuilder(),
    listarThreads(),
  ]);

  const claims = data?.claims;
  const meta = (claims?.user_metadata ?? {}) as { nome?: string };
  const nome = meta.nome?.split(' ')[0] ?? null;

  const agora = new Date();
  const dataLonga = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  /* A agenda já vem ordenada por início; sobra descartar o que terminou. */
  const proximaMentoria = agenda.find((s) => new Date(s.fimIso).getTime() > agora.getTime());
  const mentoriaCurta = proximaMentoria
    ? `${rotuloDoDia(proximaMentoria.inicioIso, agora).principal === 'Hoje' ? 'HOJE' : rotuloDoDia(proximaMentoria.inicioIso, agora).mono} · ${horaCurta(proximaMentoria.inicioIso)}`
    : null;

  const recentes = solucoes.slice(0, 3);

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Início" oculto />

      {/* SAUDAÇÃO: a data como eyebrow (caixa-alta por conteúdo → tracking de
          eyebrow) e o nome como display. Sem frase de efeito embaixo — o
          conteúdo da página é a frase. */}
      <header className={`${entrada.bloco} ${styles.saudacao}`}>
        <p className={styles.data}>{dataLonga}</p>
        <h1 className={styles.ola}>{nome ? `Olá, ${nome}.` : 'Olá.'}</h1>
      </header>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <MapaPlataforma
          totalSolucoes={solucoes.length}
          totalFormacoes={formacoes.length}
          aulaIdsPorFormacao={formacoes.map((f) => f.aulaIds)}
          etapaIdsPorSolucao={solucoes.map((s) => s.etapaIds)}
          projetosBuilder={projetos.length}
          conversasConsultor={conversas.length}
          proximaMentoria={mentoriaCurta}
        />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso2} ${styles.meio}`}>
        <PainelProgresso
          formacoes={formacoes.map((f) => ({ slug: f.slug, titulo: f.titulo, aulaIds: f.aulaIds }))}
          agoraIso={agora.toISOString()}
        />

        {/* O trilho do AGORA: retomar de onde parou e a próxima sessão. */}
        <aside className={styles.trilho}>
          <RetomadaFormacao formacoes={formacoes} />

          {proximaMentoria && (
            <Link href="/mentorias" className={styles.mentoria}>
              <span className={styles.mentoriaTextos}>
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
        </aside>
      </div>

      {recentes.length > 0 && (
        <section
          className={`${entrada.bloco} ${entrada.atraso3} ${styles.secao}`}
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
            {/* Mesma resolução do catálogo: categoria sem entrada no mapa cai no
                padrão. O ícone chega como ELEMENTO já renderizado do Server
                Component — passar a referência arrastaria o lucide para o cliente. */}
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
