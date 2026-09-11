'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness } from 'lucide-react';
import type { DadosRoteiroProjeto, ItemSolucao, VizinhaSolucao } from '@/lib/conteudo/queries';
import type { ContextoRotaComercialProjeto } from '@/lib/projetos/rota-comercial-modelo';
import { idsAulasProjeto, idsPassosProjeto } from '@/lib/projetos/roteiro';
import { contarEtapasFeitas, percentual, useProgresso } from '@/lib/progresso/local';
import { AprendizadoProjeto } from './AprendizadoProjeto';
import { ImplementacaoProjeto } from './ImplementacaoProjeto';
import { KitProjeto, type AreaKitProjeto } from './KitProjeto';
import { ProximaSolucao } from './ProximaSolucao';
import { VisaoProjeto } from './VisaoProjeto';
import styles from './ProjetoGuiadoNovo.module.css';

const ROTULO_NIVEL = {
  entrada: 'Para começar',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
} as const;

export function ProjetoGuiado({
  slug,
  titulo,
  resumo,
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
  const progressoGeral = percentual(feitas, todosIds.length);
  const idsAulas = idsAulasProjeto(slug, roteiro);
  const aulasFeitas = contarEtapasFeitas(progresso, idsAulas);
  const aprendizadoConcluido = idsAulas.length === 0 || aulasFeitas === idsAulas.length;
  const temAprendizado = Boolean(roteiro.trilhaDidatica);
  const [abaAtiva, setAbaAtiva] = useState<'visao' | 'aprender' | 'implementar' | 'materiais'>(
    'visao',
  );
  const abasRef = useRef<HTMLElement>(null);
  const [areaKit, setAreaKit] = useState<AreaKitProjeto>('preparar');
  const abrirArea = (aba: typeof abaAtiva) => {
    setAbaAtiva(aba);
    const botao = abasRef.current?.querySelector<HTMLButtonElement>(`#aba-${aba}`);
    botao?.focus({ preventScroll: true });
    botao?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  };
  function abrirCliente() {
    setAreaKit('cliente');
    setAbaAtiva('materiais');
    requestAnimationFrame(() => {
      const tituloCliente = document.getElementById('rota-projeto-titulo');
      tituloCliente?.focus({ preventScroll: true });
      tituloCliente?.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
  }
  const proximoPasso = roteiro.fases
    .flatMap((fase) =>
      fase.passos.map((passo) => ({
        passo,
        id: `projeto:${slug}:${fase.id}:${passo.id}`,
      })),
    )
    .find(({ id }) => !progresso.etapas[id]);

  const abas = [
    { id: 'visao', rotulo: 'Visão geral' },
    ...(temAprendizado ? ([{ id: 'aprender', rotulo: 'Aprender' }] as const) : []),
    { id: 'implementar', rotulo: 'Implementar' },
    { id: 'materiais', rotulo: 'Pré-requisitos e materiais' },
  ] as const;
  const mostrarAcaoCabecalho = abaAtiva === 'visao' || abaAtiva === 'materiais';

  return (
    <div className={styles.raiz}>
      <header
        className={styles.cabecalho}
        data-com-acao={mostrarAcaoCabecalho || undefined}
        data-em-trabalho={!mostrarAcaoCabecalho || undefined}
        aria-labelledby="titulo-projeto"
      >
        <div className={styles.cabecalhoTexto}>
          <h1 id="titulo-projeto">{titulo}</h1>
          {mostrarAcaoCabecalho ? (
            <p className={styles.resultado}>{resumo || projeto.resultado}</p>
          ) : null}
          {mostrarAcaoCabecalho ? (
            <p className={styles.metaProjeto}>
              {categoria ?? 'Projeto de IA'}
              <span aria-hidden="true">·</span>
              {roteiro.trilhaDidatica
                ? `${roteiro.trilhaDidatica.aulas.length} aulas`
                : 'Passo a passo guiado'}
              {roteiro.perfil ? (
                <>
                  <span aria-hidden="true">·</span>
                  {ROTULO_NIVEL[roteiro.perfil.nivel]}
                </>
              ) : null}
            </p>
          ) : null}
          <button type="button" className={styles.acaoCliente} onClick={abrirCliente}>
            <BriefcaseBusiness size={18} aria-hidden="true" />
            Usar com cliente
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
        {mostrarAcaoCabecalho && (
          <div
            className={styles.cabecalhoAcao}
            data-acao-curta={(!aprendizadoConcluido && Boolean(proximoPasso)) || undefined}
          >
            <div
              className={styles.progressoCabecalho}
              role="progressbar"
              aria-label="Progresso da implementação"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressoGeral}
            >
              <p>
                <strong>
                  {feitas} de {todosIds.length}
                </strong>
                <span>passos concluídos</span>
              </p>
              <span className={styles.progressoCabecalhoTrilho} aria-hidden="true">
                <span style={{ transform: `scaleX(${progressoGeral / 100})` }} />
              </span>
            </div>

            {!aprendizadoConcluido ? (
              <button
                type="button"
                onClick={() => abrirArea('aprender')}
                className={styles.acaoPrincipal}
              >
                <span>
                  {!proximoPasso
                    ? 'Concluir aulas do projeto'
                    : aulasFeitas > 0
                      ? 'Retomar aulas'
                      : 'Ver aulas'}
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            ) : proximoPasso ? (
              <button
                type="button"
                onClick={() => abrirArea('implementar')}
                className={styles.acaoPrincipal}
              >
                <span>
                  <small>Próximo passo</small>
                  {proximoPasso.passo.titulo}
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
        )}
      </header>

      <div className={styles.etapasProjeto}>
        <nav
          ref={abasRef}
          className={styles.abasProjeto}
          aria-label="Áreas do projeto"
          role="tablist"
          data-total={abas.length}
        >
          {abas.map((aba, indice) => (
            <button
              key={aba.id}
              type="button"
              role="tab"
              id={`aba-${aba.id}`}
              aria-selected={abaAtiva === aba.id}
              aria-controls="painel-projeto"
              tabIndex={abaAtiva === aba.id ? 0 : -1}
              data-ativa={abaAtiva === aba.id ? '' : undefined}
              onClick={() => setAbaAtiva(aba.id)}
              onKeyDown={(event) => {
                const destino =
                  event.key === 'ArrowRight'
                    ? (indice + 1) % abas.length
                    : event.key === 'ArrowLeft'
                      ? (indice - 1 + abas.length) % abas.length
                      : event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? abas.length - 1
                          : null;
                if (destino === null) return;
                event.preventDefault();
                const proximaAba = abas[destino];
                if (proximaAba) abrirArea(proximaAba.id);
              }}
            >
              {aba.rotulo}
            </button>
          ))}
        </nav>

        <div
          className={styles.painelProjeto}
          id="painel-projeto"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`aba-${abaAtiva}`}
        >
          {abaAtiva === 'visao' ? (
            <VisaoProjeto slug={slug} titulo={titulo} projeto={projeto} videoUrl={videoUrl} />
          ) : null}
          {abaAtiva === 'aprender' && roteiro.trilhaDidatica ? (
            <AprendizadoProjeto
              slug={slug}
              titulo={titulo}
              trilha={roteiro.trilhaDidatica}
              videoUrl={videoUrl}
              onIrImplementacao={() => abrirArea('implementar')}
            />
          ) : null}
          {abaAtiva === 'implementar' ? (
            <ImplementacaoProjeto
              slug={slug}
              roteiro={roteiro}
              onIrMateriais={() => abrirArea('materiais')}
            />
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
                area={areaKit}
                aoMudarArea={setAreaKit}
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
