'use client';

import Link from 'next/link';
import { ArrowRight, Check, FolderOpen } from 'lucide-react';
import type { SolucaoResumo } from '@/lib/conteudo/queries';
import {
  contarEtapasFeitas,
  estadoDoProgresso,
  percentual,
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
          <p className={styles.eyebrow}>Projetos</p>
          <Titulo id="catalogo-vazio-titulo">
            Os projetos guiados ainda não foram publicados.
          </Titulo>
          <p>
            Enquanto isso, você pode continuar nas formações e aprender os fundamentos para a
            primeira implementação.
          </p>
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
  const destaque =
    projetos.find((projeto) => projeto.estado === 'em-andamento') ??
    projetos.find((projeto) => projeto.solucao.projeto?.roteiro.perfil?.recomendadoParaComecar) ??
    projetos[0]!;
  const restantes = projetos.filter((projeto) => projeto.solucao.id !== destaque.solucao.id);

  return (
    <div className={styles.raiz}>
      <header className={styles.abertura}>
        <div>
          <p className={styles.eyebrow}>Projetos guiados</p>
          <Titulo id="titulo-projetos" className={styles.titulo}>
            Aprenda um projeto. Entregue para um cliente.
          </Titulo>
          <p className={styles.apoio}>
            Escolha o que quer implementar. Cada projeto reúne aula, passo a passo e modelos em uma
            única sequência.
          </p>
        </div>
        <p className={styles.contagem}>
          <strong>{String(solucoes.length).padStart(2, '0')}</strong>
          projetos disponíveis
        </p>
      </header>

      <section className={styles.secaoDestaque} aria-labelledby="projeto-destaque-titulo">
        <div className={styles.secaoCabecalho}>
          <div>
            <p className={styles.eyebrow}>
              {destaque.estado === 'em-andamento'
                ? 'Continue de onde parou'
                : 'Melhor ponto de partida'}
            </p>
            <h2 id="projeto-destaque-titulo">Seu próximo projeto</h2>
          </div>
          <p>Abra o projeto para ver apenas a aula ou a etapa que precisa fazer agora.</p>
        </div>

        <Link
          href={`/solucoes/${destaque.solucao.slug}`}
          className={styles.destaque}
          data-estado={destaque.estado}
        >
          <div className={styles.destaquePrincipal}>
            <p className={styles.projetoTipo}>{destaque.solucao.categoria ?? 'Projeto de IA'}</p>
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
              {destaque.estado !== 'nao-iniciada' ? (
                <span>
                  {destaque.estado === 'concluida'
                    ? 'Projeto concluído'
                    : `${destaque.feitas} de ${destaque.total} passos`}
                </span>
              ) : null}
            </div>
            <span className={styles.acaoPrincipal}>
              {rotuloAcao(destaque)} <ArrowRight size={17} aria-hidden="true" />
            </span>
          </div>

          {destaque.estado !== 'nao-iniciada' ? (
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
            <div>
              <p className={styles.eyebrow}>Biblioteca</p>
              <h2 id="outros-projetos-titulo">Outros projetos</h2>
            </div>
            <p>Escolha pelo resultado que faz sentido para o cliente que você quer atender.</p>
          </div>

          <ol className={styles.grade}>
            {restantes.map((projeto, indice) => {
              const perfil = projeto.solucao.projeto?.roteiro.perfil;
              return (
                <li key={projeto.solucao.id}>
                  <Link
                    href={`/solucoes/${projeto.solucao.slug}`}
                    className={styles.cartao}
                    data-estado={projeto.estado}
                  >
                    <div className={styles.cartaoTopo}>
                      <span>{String(indice + 2).padStart(2, '0')}</span>
                      {projeto.estado === 'concluida' ? (
                        <span className={styles.concluido}>
                          <Check size={12} aria-hidden="true" /> Concluído
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
                    {projeto.estado !== 'nao-iniciada' ? (
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
          </ol>
        </section>
      ) : null}
    </div>
  );
}
