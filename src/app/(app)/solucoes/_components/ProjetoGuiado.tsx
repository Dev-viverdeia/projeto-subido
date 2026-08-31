'use client';

import { useState } from 'react';
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
  const temAprendizado = Boolean(roteiro.trilhaDidatica);
  const [abaAtiva, setAbaAtiva] = useState<'aprender' | 'implementar' | 'materiais'>(
    temAprendizado ? 'aprender' : 'implementar',
  );
  const proximoPasso = roteiro.fases
    .flatMap((fase) =>
      fase.passos.map((passo) => ({
        passo,
        id: `projeto:${slug}:${fase.id}:${passo.id}`,
      })),
    )
    .find(({ id }) => !progresso.etapas[id]);

  const abas = [
    ...(temAprendizado ? ([{ id: 'aprender', rotulo: 'Aprender' }] as const) : []),
    { id: 'implementar', rotulo: 'Implementar' },
    { id: 'materiais', rotulo: 'Materiais' },
  ] as const;

  return (
    <div className={styles.raiz}>
      <header className={styles.cabecalho} aria-labelledby="titulo-projeto">
        <div className={styles.cabecalhoTexto}>
          <h1 id="titulo-projeto">{titulo}</h1>
          <p className={styles.resultado}>{projeto.resultado}</p>
          <p className={styles.metaProjeto}>
            {categoria ?? 'Projeto de IA'}
            <span aria-hidden="true">·</span>
            {roteiro.trilhaDidatica?.tempoTotal ?? 'Comece pela implementação'}
            {roteiro.perfil ? (
              <>
                <span aria-hidden="true">·</span>
                {ROTULO_NIVEL[roteiro.perfil.nivel]}
              </>
            ) : null}
          </p>
        </div>
        <div className={styles.cabecalhoAcao}>
          <p className={styles.progressoCabecalho}>
            <strong>
              {feitas} de {todosIds.length}
            </strong>
            passos concluídos
          </p>

          {proximoPasso ? (
            <button
              type="button"
              onClick={() => setAbaAtiva('implementar')}
              className={styles.acaoPrincipal}
            >
              <span>
                <small>Próximo passo</small>
                {proximoPasso.passo.titulo}
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          ) : !aprendizadoConcluido ? (
            <button
              type="button"
              onClick={() => setAbaAtiva('aprender')}
              className={styles.acaoPrincipal}
            >
              <span>
                <small>Falta concluir</small>
                Concluir aulas do projeto
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
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

      <div className={styles.etapasProjeto}>
        <nav className={styles.abasProjeto} aria-label="Áreas do projeto" role="tablist">
          {abas.map((aba) => (
            <button
              key={aba.id}
              type="button"
              role="tab"
              id={`aba-${aba.id}`}
              aria-selected={abaAtiva === aba.id}
              aria-controls={`painel-${aba.id}`}
              data-ativa={abaAtiva === aba.id ? '' : undefined}
              onClick={() => setAbaAtiva(aba.id)}
            >
              {aba.rotulo}
            </button>
          ))}
        </nav>

        <div
          className={styles.painelProjeto}
          id={`painel-${abaAtiva}`}
          role="tabpanel"
          aria-labelledby={`aba-${abaAtiva}`}
        >
          {abaAtiva === 'aprender' && roteiro.trilhaDidatica ? (
            <AprendizadoProjeto
              slug={slug}
              titulo={titulo}
              trilha={roteiro.trilhaDidatica}
              videoUrl={videoUrl}
              onIrImplementacao={() => setAbaAtiva('implementar')}
            />
          ) : null}
          {abaAtiva === 'implementar' ? (
            <ImplementacaoProjeto slug={slug} roteiro={roteiro} />
          ) : null}
          {abaAtiva === 'materiais' ? (
            <>
              <KitProjeto
                slug={slug}
                titulo={titulo}
                projeto={projeto}
                ferramentas={ferramentas}
                prompts={prompts}
                rotaComercial={rotaComercial}
                direto
              />
              {proxima ? <ProximaSolucao proxima={proxima} /> : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
