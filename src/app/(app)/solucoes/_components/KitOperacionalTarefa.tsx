'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, BookOpen, ChevronDown, Clock3, FolderUp } from 'lucide-react';
import type { KitOperacionalTarefa as DadosKit } from '@/lib/projetos-execucao/kit-operacional';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import styles from './KitOperacionalTarefa.module.css';

type AbaKit = 'roteiro' | 'modelo';

export function KitOperacionalTarefa({
  kit,
  arquivosDaTarefa,
  onAbrirArquivos,
}: {
  kit: DadosKit;
  arquivosDaTarefa: number;
  onAbrirArquivos: () => void;
}) {
  const temRoteiro = kit.insumos.length > 0 || kit.checklist.length > 0 || Boolean(kit.cuidado);
  const [aba, setAba] = useState<AbaKit>(temRoteiro ? 'roteiro' : 'modelo');
  const [aberto, setAberto] = useState(false);

  return (
    <section className={styles.kit} aria-labelledby="kit-operacional-titulo">
      <header className={styles.cabecalho}>
        <div>
          <p>Guia desta tarefa</p>
          <h3 id="kit-operacional-titulo">Passo a passo e modelo prontos</h3>
        </div>
        <div className={styles.controles}>
          {kit.duracao ? (
            <span className={styles.duracao}>
              <Clock3 size={14} aria-hidden="true" /> {kit.duracao}
            </span>
          ) : null}
          <button
            type="button"
            className={styles.alternar}
            aria-expanded={aberto}
            onClick={() => setAberto((valor) => !valor)}
          >
            {aberto ? 'Fechar guia' : 'Abrir guia'}
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </div>
      </header>

      {aberto ? (
        <>
          <div className={styles.barra}>
            <div className={styles.abas} role="tablist" aria-label="Conteúdo do kit">
              {temRoteiro ? (
                <button
                  type="button"
                  id="aba-roteiro-tarefa"
                  role="tab"
                  aria-selected={aba === 'roteiro'}
                  aria-controls="painel-roteiro-tarefa"
                  onClick={() => setAba('roteiro')}
                >
                  Passo a passo
                  <span>{kit.checklist.length}</span>
                </button>
              ) : null}
              {kit.modelo ? (
                <button
                  type="button"
                  id="aba-modelo-tarefa"
                  role="tab"
                  aria-selected={aba === 'modelo'}
                  aria-controls="painel-modelo-tarefa"
                  onClick={() => setAba('modelo')}
                >
                  Modelo pronto
                </button>
              ) : null}
            </div>
            <Link href={`/solucoes/${kit.projetoSlug}`}>
              <BookOpen size={14} aria-hidden="true" />
              Rever minicurso
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {aba === 'roteiro' && temRoteiro ? (
            <div
              className={styles.painelRoteiro}
              id="painel-roteiro-tarefa"
              role="tabpanel"
              aria-labelledby="aba-roteiro-tarefa"
            >
              {kit.insumos.length > 0 ? (
                <section className={styles.insumos}>
                  <h4>Separe antes</h4>
                  <ul>
                    {kit.insumos.map((insumo) => (
                      <li key={insumo}>{insumo}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {kit.checklist.length > 0 ? (
                <section className={styles.checklist}>
                  <h4>Faça nesta ordem</h4>
                  <ol>
                    {kit.checklist.map((item, indice) => (
                      <li key={item}>
                        <span>{String(indice + 1).padStart(2, '0')}</span>
                        <p>{item}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {kit.cuidado ? (
                <aside className={styles.cuidado}>
                  <strong>Evite este erro</strong>
                  <p>{kit.cuidado}</p>
                </aside>
              ) : null}
            </div>
          ) : null}

          {aba === 'modelo' && kit.modelo ? (
            <section
              className={styles.modelo}
              id="painel-modelo-tarefa"
              role="tabpanel"
              aria-labelledby="aba-modelo-tarefa"
            >
              <header>
                <div>
                  <span>Use como ponto de partida</span>
                  <h4>{kit.modelo.titulo}</h4>
                </div>
                <BotaoCopiar texto={kit.modelo.conteudo} rotuloDoQue={kit.modelo.titulo} />
              </header>
              <pre tabIndex={0} role="region" aria-label={`Modelo: ${kit.modelo.titulo}`}>
                {kit.modelo.conteudo}
              </pre>
            </section>
          ) : null}

          <footer className={styles.rodape}>
            <div>
              <strong>Material produzido</strong>
              <span>
                {arquivosDaTarefa
                  ? `${arquivosDaTarefa} ${arquivosDaTarefa === 1 ? 'arquivo ligado' : 'arquivos ligados'} a esta tarefa`
                  : 'Ainda não há arquivo ligado a esta tarefa'}
              </span>
            </div>
            <button type="button" onClick={onAbrirArquivos}>
              <FolderUp size={15} aria-hidden="true" />
              {arquivosDaTarefa ? 'Ver ou adicionar arquivo' : 'Adicionar arquivo da tarefa'}
            </button>
          </footer>
        </>
      ) : null}
    </section>
  );
}
