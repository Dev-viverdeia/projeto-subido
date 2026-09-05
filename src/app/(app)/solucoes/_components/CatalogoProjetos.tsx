'use client';

import Link from 'next/link';
import { ArrowRight, Check, FolderOpen, Layers } from 'lucide-react';
import type { SolucaoResumo } from '@/lib/conteudo/queries';
import {
  contarEtapasFeitas,
  estadoDoProgresso,
  percentual,
  solucaoMaisRecente,
  useProgresso,
} from '@/lib/progresso/local';
import styles from './CatalogoProjetos.module.css';

const ROTULO_NIVEL = {
  entrada: 'Para começar',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
} as const;

type ProjetoComProgresso = {
  solucao: SolucaoResumo;
  feitas: number;
  total: number;
  estado: ReturnType<typeof estadoDoProgresso>;
};

function rotuloAcao(projeto: ProjetoComProgresso): string {
  if (projeto.estado === 'concluida') return 'Revisar projeto';
  if (projeto.estado === 'em-andamento') return 'Retomar projeto';
  return 'Ver projeto';
}

/**
 * A biblioteca responde apenas a duas perguntas: por qual projeto começar e quais
 * são as outras opções. Aulas, fases, ferramentas e modelos aparecem somente
 * depois da escolha, onde ajudam a executar em vez de competir pela atenção.
 */
export function CatalogoProjetos({
  solucoes,
  tituloComo = 'h1',
}: {
  solucoes: SolucaoResumo[];
  tituloComo?: 'h1' | 'h2';
}) {
  const progresso = useProgresso();
  const Titulo = tituloComo;

  if (solucoes.length === 0) {
    return (
      <section className={styles.catalogoVazio} aria-labelledby="catalogo-vazio-titulo">
        <span className={styles.catalogoVazioIcone} aria-hidden="true">
          <FolderOpen size={22} strokeWidth={1.7} />
        </span>
        <div>
          <Titulo id="catalogo-vazio-titulo">Nenhum projeto disponível</Titulo>
          <p>Enquanto os guias não chegam, explore as formações.</p>
        </div>
        <Link href="/formacoes" className={styles.acaoSecundaria}>
          Ver formações <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    );
  }

  const projetos: ProjetoComProgresso[] = solucoes.map((solucao) => {
    const total = solucao.etapaIds.length;
    const feitas = contarEtapasFeitas(progresso, solucao.etapaIds);
    return { solucao, feitas, total, estado: estadoDoProgresso(feitas, total) };
  });
  const recente = solucaoMaisRecente(progresso);
  const destaque =
    projetos.find(
      (projeto) => projeto.estado === 'em-andamento' && projeto.solucao.slug === recente,
    ) ??
    projetos.find((projeto) => projeto.estado === 'em-andamento') ??
    projetos.find(
      (projeto) =>
        projeto.estado === 'nao-iniciada' &&
        projeto.solucao.projeto?.roteiro.perfil?.recomendadoParaComecar,
    ) ??
    projetos.find((projeto) => projeto.estado === 'nao-iniciada') ??
    projetos[0]!;
  const restantes = projetos.filter((projeto) => projeto.solucao.id !== destaque.solucao.id);

  return (
    <div className={styles.raiz}>
      <header className={styles.abertura}>
        <div>
          <Titulo id="titulo-projetos" className={styles.titulo}>
            Projetos
          </Titulo>
          <p className={styles.apoio}>Guias para implementar IA para seus clientes.</p>
        </div>
        <p className={styles.contagem}>
          {solucoes.length} {solucoes.length === 1 ? 'projeto' : 'projetos'}
        </p>
      </header>

      <section aria-labelledby="projeto-destaque-titulo">
        <Link
          href={`/solucoes/${destaque.solucao.slug}`}
          className={styles.destaque}
          data-estado={destaque.estado}
        >
          <div className={styles.destaquePrincipal}>
            <div className={styles.destaqueIdentidade}>
              <span className={styles.iconeDestaque} aria-hidden="true">
                {destaque.estado === 'concluida' ? (
                  <Check size={24} />
                ) : (
                  <Layers size={24} strokeWidth={1.6} />
                )}
              </span>
              <h2 id="projeto-destaque-titulo" className={styles.rotuloDestaque}>
                {destaque.estado === 'em-andamento'
                  ? 'Continue de onde parou'
                  : destaque.estado === 'concluida'
                    ? 'Projeto concluído'
                    : destaque.estado === 'sem-itens'
                      ? 'Conheça o projeto'
                      : 'Comece por aqui'}
              </h2>
            </div>
            <h3>{destaque.solucao.titulo}</h3>
            <p className={styles.resultado}>
              {destaque.solucao.projeto?.resultado ?? destaque.solucao.resumo}
            </p>
          </div>

          <div className={styles.destaqueRodape}>
            <div className={styles.metadados}>
              {destaque.solucao.projeto?.roteiro.perfil ? (
                <>
                  <span>{destaque.solucao.projeto.roteiro.perfil.prazo}</span>
                  <span>{ROTULO_NIVEL[destaque.solucao.projeto.roteiro.perfil.nivel]}</span>
                </>
              ) : (
                <span>Passo a passo guiado</span>
              )}
              {destaque.estado === 'em-andamento' ? (
                <span>
                  {destaque.feitas} de {destaque.total} passos
                </span>
              ) : null}
            </div>
            <span className={styles.acaoPrincipal}>
              {rotuloAcao(destaque)} <ArrowRight size={17} aria-hidden="true" />
            </span>
          </div>

          {destaque.feitas > 0 ? (
            <span className={styles.progresso} aria-hidden="true">
              <span
                style={{
                  transform: `scaleX(${percentual(destaque.feitas, destaque.total) / 100})`,
                }}
              />
            </span>
          ) : null}
        </Link>
      </section>

      {restantes.length > 0 ? (
        <section className={styles.outros} aria-labelledby="outros-projetos-titulo">
          <div className={styles.secaoCabecalho}>
            <h2 id="outros-projetos-titulo">Outros projetos</h2>
          </div>

          <ul className={styles.grade} aria-label="Outros projetos">
            {restantes.map((projeto) => {
              const perfil = projeto.solucao.projeto?.roteiro.perfil;
              return (
                <li key={projeto.solucao.id}>
                  <Link
                    href={`/solucoes/${projeto.solucao.slug}`}
                    className={styles.cartao}
                    data-estado={projeto.estado}
                  >
                    <div className={styles.cartaoTopo}>
                      <span className={styles.categoria}>
                        <FolderOpen size={18} aria-hidden="true" />
                        {projeto.solucao.categoria ?? 'Projeto guiado'}
                      </span>
                      {projeto.estado === 'concluida' ? (
                        <span className={styles.concluido}>
                          <Check size={16} aria-hidden="true" /> Concluído
                        </span>
                      ) : projeto.estado === 'em-andamento' ? (
                        <span className={styles.emAndamento}>
                          {projeto.feitas}/{projeto.total} passos
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.cartaoCorpo}>
                      <h3>{projeto.solucao.titulo}</h3>
                      <p>{projeto.solucao.projeto?.resultado ?? projeto.solucao.resumo}</p>
                    </div>
                    <footer>
                      <span>{perfil?.prazo ?? 'Passo a passo guiado'}</span>
                      <strong>
                        {rotuloAcao(projeto)} <ArrowRight size={15} aria-hidden="true" />
                      </strong>
                    </footer>
                    {projeto.feitas > 0 ? (
                      <span className={styles.progresso} aria-hidden="true">
                        <span
                          style={{
                            transform: `scaleX(${percentual(projeto.feitas, projeto.total) / 100})`,
                          }}
                        />
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
