'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { DadosRoteiroProjeto, ItemSolucao, VizinhaSolucao } from '@/lib/conteudo/queries';
import type { ContextoRotaComercialProjeto } from '@/lib/projetos/rota-comercial-modelo';
import { idsAulasProjeto, idsPassosProjeto } from '@/lib/projetos/roteiro';
import { contarEtapasFeitas, useProgresso } from '@/lib/progresso/local';
import { AprendizadoProjeto } from './AprendizadoProjeto';
import { ImplementacaoProjeto } from './ImplementacaoProjeto';
import { KitProjeto } from './KitProjeto';
import { ProximaSolucao } from './ProximaSolucao';
import styles from './ProjetoGuiadoNovo.module.css';

const ROTULO_NIVEL = {
  entrada: 'Para começar',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
} as const;

export function ProjetoGuiado({
  slug,
  titulo,
  categoria,
  projeto,
  ferramentas,
  prompts,
  videoUrl,
  proxima,
  rotaComercial,
}: {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string | null;
  projeto: DadosRoteiroProjeto;
  ferramentas: ItemSolucao[];
  prompts: ItemSolucao[];
  videoUrl: string | null;
  proxima: VizinhaSolucao | null;
  rotaComercial: ContextoRotaComercialProjeto;
}) {
  const progresso = useProgresso();
  const roteiro = projeto.roteiro;
  const todosIds = idsPassosProjeto(slug, roteiro);
  const feitas = contarEtapasFeitas(progresso, todosIds);
  const idsAulas = idsAulasProjeto(slug, roteiro);
  const aulasFeitas = contarEtapasFeitas(progresso, idsAulas);
  const aprendizadoConcluido = idsAulas.length === 0 || aulasFeitas === idsAulas.length;
  const proximoPasso = roteiro.fases
    .flatMap((fase) =>
      fase.passos.map((passo) => ({
        passo,
        id: `projeto:${slug}:${fase.id}:${passo.id}`,
      })),
    )
    .find(({ id }) => !progresso.etapas[id]);

  const irAoProximo = () => {
    document
      .getElementById('implementacao-projeto')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.raiz}>
      <header className={styles.cabecalho} aria-labelledby="titulo-projeto">
        <div className={styles.cabecalhoTexto}>
          <p className={styles.eyebrow}>{categoria ?? 'Projeto de IA'}</p>
          <h1 id="titulo-projeto">{titulo}</h1>
          <p className={styles.resultado}>{projeto.resultado}</p>
        </div>
        <div className={styles.cabecalhoAcao}>
          <dl>
            <div>
              <dt>Preparação</dt>
              <dd>{roteiro.trilhaDidatica?.tempoTotal ?? 'Comece pela aula'}</dd>
            </div>
            {roteiro.perfil ? (
              <div>
                <dt>Nível</dt>
                <dd>{ROTULO_NIVEL[roteiro.perfil.nivel]}</dd>
              </div>
            ) : null}
            <div>
              <dt>Implementação</dt>
              <dd>
                {feitas} de {todosIds.length} passos
              </dd>
            </div>
          </dl>

          {proximoPasso ? (
            <button type="button" onClick={irAoProximo} className={styles.acaoPrincipal}>
              <span>
                <small>Próximo passo</small>
                {proximoPasso.passo.titulo}
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          ) : !aprendizadoConcluido ? (
            <a href="#aprendizado-projeto" className={styles.acaoPrincipal}>
              <span>
                <small>Falta concluir</small>
                Concluir aulas do projeto
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          ) : (
            <Link href={`/certificados/solucao/${slug}`} className={styles.acaoPrincipal}>
              <span>
                <small>Projeto concluído</small>
                Ver certificado
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>

      {roteiro.trilhaDidatica ? (
        <AprendizadoProjeto
          slug={slug}
          titulo={titulo}
          trilha={roteiro.trilhaDidatica}
          videoUrl={videoUrl}
        />
      ) : null}
      <ImplementacaoProjeto slug={slug} roteiro={roteiro} />
      <KitProjeto
        slug={slug}
        titulo={titulo}
        projeto={projeto}
        ferramentas={ferramentas}
        prompts={prompts}
        rotaComercial={rotaComercial}
      />
      {proxima ? <ProximaSolucao proxima={proxima} /> : null}
    </div>
  );
}
