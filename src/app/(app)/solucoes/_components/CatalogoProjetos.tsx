'use client';

import Link from 'next/link';
import { ArrowUpRight, Check, FolderOpen } from 'lucide-react';
import type { SolucaoResumo } from '@/lib/conteudo/queries';
import { idPassoProjeto } from '@/lib/projetos/roteiro';
import {
  contarEtapasFeitas,
  estadoDoProgresso,
  percentual,
  useProgresso,
} from '@/lib/progresso/local';
import styles from './CatalogoProjetos.module.css';

const FASES = ['Entender', 'Preparar', 'Construir', 'Validar', 'Entregar'];

/**
 * A biblioteca não é mais um marketplace de dezenas de soluções. São cinco
 * entregas deliberadas, então busca, paginação e facetas só esconderiam a tese.
 * A assinatura é a linha de execução repetida em todos os projetos.
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
  const totalPassos = solucoes.reduce((total, solucao) => total + solucao.etapaIds.length, 0);

  if (solucoes.length === 0) {
    return (
      <section className={styles.catalogoVazio} aria-labelledby="catalogo-vazio-titulo">
        <span className={styles.catalogoVazioIcone} aria-hidden="true">
          <FolderOpen size={24} strokeWidth={1.6} />
        </span>
        <div className={styles.catalogoVazioTexto}>
          <p className={styles.eyebrow}>Biblioteca em preparação</p>
          <Titulo id="catalogo-vazio-titulo" className={styles.catalogoVazioTitulo}>
            Os projetos guiados ainda não foram publicados.
          </Titulo>
          <p className={styles.catalogoVazioDescricao}>
            Assim que a primeira entrega estiver pronta, ela aparece aqui com roteiro, ferramentas e
            critérios de validação.
          </p>
        </div>
        <div className={styles.catalogoVazioRodape}>
          <dl>
            <div>
              <dt>Projetos publicados</dt>
              <dd>00</dd>
            </div>
          </dl>
          <Link href="/formacoes" className={styles.catalogoVazioCta}>
            Continuar em Formações <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.raiz}>
      <section className={styles.abertura} data-on-dark aria-labelledby="titulo-projetos">
        <div className={styles.aberturaCorpo}>
          <div className={styles.aberturaTexto}>
            <p className={styles.eyebrow}>Biblioteca de execução</p>
            <Titulo id="titulo-projetos" className={styles.titulo}>
              Cinco projetos.
              <br />
              <span>Um jeito de entregar.</span>
            </Titulo>
            <p className={styles.apoio}>
              Você não recebe só a ideia. Cada projeto começa no diagnóstico e termina com uma
              operação validada nas mãos do cliente.
            </p>
          </div>

          <dl className={styles.resumoBiblioteca} aria-label="Resumo da biblioteca">
            <div>
              <dt>Projetos prontos</dt>
              <dd>{String(solucoes.length).padStart(2, '0')}</dd>
            </div>
            <div>
              <dt>Passos guiados</dt>
              <dd>{String(totalPassos).padStart(2, '0')}</dd>
            </div>
            <div>
              <dt>Fases por entrega</dt>
              <dd>{String(FASES.length).padStart(2, '0')}</dd>
            </div>
          </dl>
        </div>

        <ol className={styles.linhaEntrega} aria-label="Método dos projetos">
          {FASES.map((fase, indice) => (
            <li key={fase}>
              <span className={styles.numeroFase}>{String(indice + 1).padStart(2, '0')}</span>
              <span>{fase}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className={styles.introducao}>
        <p className={styles.introducaoRotulo}>Escolha a primeira entrega</p>
        <p className={styles.introducaoTexto}>
          Abra um projeto, execute os passos em ordem e use o Estúdio quando precisar adaptar a
          entrega ao contexto de um cliente.
        </p>
      </div>

      <ol className={styles.grade}>
        {solucoes.map((solucao, indice) => {
          const total = solucao.etapaIds.length;
          const feitas = contarEtapasFeitas(progresso, solucao.etapaIds);
          const estado = estadoDoProgresso(feitas, total);
          const projeto = solucao.projeto;
          const andamento = estado === 'em-andamento' || estado === 'concluida';

          return (
            <li key={solucao.id} className={styles.item}>
              <Link
                href={`/solucoes/${solucao.slug}`}
                className={styles.cartao}
                data-estado={andamento ? estado : undefined}
                data-indice={String(indice + 1).padStart(2, '0')}
              >
                <div className={styles.cartaoTopo}>
                  <span className={styles.indice}>{String(indice + 1).padStart(2, '0')}</span>
                  <span className={styles.categoria}>{solucao.categoria}</span>
                  {andamento ? (
                    <span className={styles.estado}>
                      {estado === 'concluida' ? 'Concluído' : `${feitas}/${total}`}
                    </span>
                  ) : null}
                </div>

                <div className={styles.cartaoCorpo}>
                  <h2>{solucao.titulo}</h2>
                  <p>{projeto?.resultado ?? solucao.resumo}</p>
                </div>

                <div className={styles.miniLinha} aria-label="Cinco fases do projeto">
                  {FASES.map((fase, faseIndice) => {
                    const faseRoteiro = projeto?.roteiro.fases[faseIndice];
                    const idsFase = faseRoteiro
                      ? faseRoteiro.passos.map((passo) =>
                          idPassoProjeto(solucao.slug, faseRoteiro.id, passo.id),
                        )
                      : [];
                    const completa =
                      idsFase.length > 0 &&
                      contarEtapasFeitas(progresso, idsFase) === idsFase.length;
                    return (
                      <span
                        key={fase}
                        className={styles.miniFase}
                        data-completa={completa || undefined}
                      >
                        <span aria-hidden="true">
                          {completa ? <Check size={10} /> : faseIndice + 1}
                        </span>
                        <em>{fase}</em>
                      </span>
                    );
                  })}
                </div>

                <footer className={styles.rodape}>
                  <div className={styles.fatos}>
                    <span>5 fases</span>
                    <span>{total} passos</span>
                    <span>{solucao.ferramentas.length} ferramentas</span>
                  </div>
                  <span className={styles.abrir}>
                    {estado === 'concluida'
                      ? 'Revisar projeto'
                      : estado === 'em-andamento'
                        ? 'Retomar projeto'
                        : 'Abrir projeto'}{' '}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </footer>

                {andamento ? (
                  <span className={styles.trilho} aria-hidden="true">
                    <span style={{ transform: `scaleX(${percentual(feitas, total) / 100})` }} />
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
