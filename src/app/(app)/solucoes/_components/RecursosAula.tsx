'use client';

import { useId, useMemo, useState } from 'react';
import { BookOpenText, Check, ExternalLink, FileText, ListChecks, Network } from 'lucide-react';
import type { RoteiroProjeto } from '@/lib/projetos/roteiro';
import { BotaoCopiar } from '../../_components/BotaoCopiar';
import styles from './RecursosAula.module.css';

type Trilha = NonNullable<RoteiroProjeto['trilhaDidatica']>;
type Recurso = Trilha['aulas'][number]['recursos'][number];

const ROTULOS = {
  mapa_mental: { rotulo: 'Mapa mental', acao: 'Ver mapa', Icone: Network },
  quiz: { rotulo: 'Quiz', acao: 'Responder quiz', Icone: ListChecks },
  ebook: { rotulo: 'E-book', acao: 'Ler guia', Icone: BookOpenText },
  modelo: { rotulo: 'Modelo', acao: 'Usar modelo', Icone: FileText },
} as const;

type EtapaMapa = { titulo: string; detalhes: string[] };

function etapasDoMapa(conteudo: string): EtapaMapa[] {
  const linhas = conteudo
    .split(/\n+/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  if (linhas.length === 1 && /→|->/.test(linhas[0]!)) {
    return linhas[0]!
      .split(/\s*(?:→|->)\s*/)
      .filter(Boolean)
      .map((titulo) => ({ titulo, detalhes: [] }));
  }

  const etapas: EtapaMapa[] = [];
  for (const linha of linhas) {
    const detalhe = linha.replace(/^(?:→|->|[-•])\s*/, '').trim();
    const eDetalhe = /^(?:→|->|[-•])/.test(linha);

    if (eDetalhe && etapas.length > 0) {
      etapas.at(-1)!.detalhes.push(detalhe);
      continue;
    }

    etapas.push({ titulo: detalhe, detalhes: [] });
  }

  return etapas;
}

function perguntasDoQuiz(conteudo: string) {
  const linhas = conteudo
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean);
  const perguntas = linhas
    .filter((linha) => /^\d+[.)]\s+/.test(linha))
    .map((linha) => linha.replace(/^\d+[.)]\s+/, ''));

  if (perguntas.length === 0) {
    const avulsas = linhas.filter((linha) => linha.endsWith('?'));
    return { perguntas: avulsas, orientacao: linhas.filter((linha) => !linha.endsWith('?')) };
  }

  return {
    perguntas,
    orientacao: linhas.filter((linha) => !/^\d+[.)]\s+/.test(linha)),
  };
}

function MapaMental({ conteudo }: { conteudo: string }) {
  const etapas = useMemo(() => etapasDoMapa(conteudo), [conteudo]);

  return (
    <ol className={styles.mapa} aria-label="Etapas do mapa mental">
      {etapas.map((etapa, indice) => (
        <li key={`${etapa.titulo}-${indice}`}>
          <span>{String(indice + 1).padStart(2, '0')}</span>
          <div>
            <strong>{etapa.titulo}</strong>
            {etapa.detalhes.length > 0 ? (
              <ul>
                {etapa.detalhes.map((detalhe) => (
                  <li key={detalhe}>{detalhe}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Quiz({ titulo, conteudo }: { titulo: string; conteudo: string }) {
  const { perguntas, orientacao } = useMemo(() => perguntasDoQuiz(conteudo), [conteudo]);
  const [respostas, setRespostas] = useState<Record<number, boolean>>({});
  const respondidas = Object.keys(respostas).length;
  const ajustes = Object.values(respostas).filter((valor) => !valor).length;
  const completo = perguntas.length > 0 && respondidas === perguntas.length;

  if (perguntas.length === 0) {
    return <TextoLongo conteudo={conteudo} />;
  }

  return (
    <div className={styles.quiz}>
      <div className={styles.quizProgresso}>
        <span>
          <strong>{respondidas}</strong> de {perguntas.length} respondidas
        </span>
        <span
          role="progressbar"
          aria-label={`Progresso do quiz ${titulo}`}
          aria-valuemin={0}
          aria-valuemax={perguntas.length}
          aria-valuenow={respondidas}
        >
          <span style={{ transform: `scaleX(${respondidas / perguntas.length})` }} />
        </span>
      </div>

      <ol>
        {perguntas.map((pergunta, indice) => (
          <li key={pergunta}>
            <span>{String(indice + 1).padStart(2, '0')}</span>
            <div>
              <p>{pergunta}</p>
              <div className={styles.respostas} role="group" aria-label={`Resposta: ${pergunta}`}>
                <button
                  type="button"
                  aria-pressed={respostas[indice] === true}
                  onClick={() => setRespostas((atual) => ({ ...atual, [indice]: true }))}
                >
                  Sim
                </button>
                <button
                  type="button"
                  aria-pressed={respostas[indice] === false}
                  onClick={() => setRespostas((atual) => ({ ...atual, [indice]: false }))}
                >
                  Ainda não
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {completo ? (
        <output className={styles.resultadoQuiz} data-ajustes={ajustes > 0 || undefined}>
          <Check size={17} strokeWidth={1.8} aria-hidden="true" />
          <span>
            <strong>
              {ajustes === 0
                ? 'Revisão concluída. Você pode seguir.'
                : `${ajustes} ${ajustes === 1 ? 'ponto pede' : 'pontos pedem'} ajuste.`}
            </strong>
            {ajustes > 0 && orientacao.length > 0 ? <small>{orientacao.join(' ')}</small> : null}
          </span>
        </output>
      ) : null}
    </div>
  );
}

function TextoLongo({ conteudo }: { conteudo: string }) {
  const blocos = conteudo
    .split(/\n{2,}/)
    .map((bloco) => bloco.trim())
    .filter(Boolean);

  return (
    <div className={styles.leitura}>
      {blocos.map((bloco, indice) => {
        const linhas = bloco.split('\n').filter(Boolean);
        const titulo = /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+$/.test(linhas[0]!);
        const texto = titulo ? linhas.slice(1) : linhas;

        return (
          <section key={`${bloco.slice(0, 32)}-${indice}`}>
            {titulo ? <h5>{linhas[0]}</h5> : null}
            {texto.length > 0 ? <p>{texto.join('\n')}</p> : null}
          </section>
        );
      })}
    </div>
  );
}

function ConteudoRecurso({ recurso }: { recurso: Recurso }) {
  if (!recurso.conteudo) return null;

  if (recurso.tipo === 'mapa_mental') return <MapaMental conteudo={recurso.conteudo} />;
  if (recurso.tipo === 'quiz') {
    return <Quiz titulo={recurso.titulo} conteudo={recurso.conteudo} />;
  }
  if (recurso.tipo === 'ebook') return <TextoLongo conteudo={recurso.conteudo} />;

  return (
    <div className={styles.modelo}>
      <BotaoCopiar texto={recurso.conteudo} rotuloDoQue={recurso.titulo} />
      <pre>{recurso.conteudo}</pre>
    </div>
  );
}

function CartaoRecurso({ recurso }: { recurso: Recurso }) {
  const { rotulo, acao, Icone } = ROTULOS[recurso.tipo];

  return (
    <article className={styles.cartao} data-tipo={recurso.tipo}>
      <header>
        <span className={styles.icone} aria-hidden="true">
          <Icone size={18} strokeWidth={1.7} />
        </span>
        <div>
          <small>{rotulo}</small>
          <strong>{recurso.titulo}</strong>
          <p>{recurso.descricao}</p>
        </div>
      </header>

      {recurso.url ? (
        <a href={recurso.url} target="_blank" rel="noreferrer">
          {acao} <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
        </a>
      ) : null}

      {recurso.conteudo ? (
        <details className={styles.detalhe}>
          <summary>{acao}</summary>
          <div className={styles.conteudo}>
            <ConteudoRecurso recurso={recurso} />
          </div>
        </details>
      ) : null}
    </article>
  );
}

export function RecursosAula({ recursos }: { recursos: Recurso[] }) {
  const tituloId = useId();
  if (recursos.length === 0) return null;

  return (
    <section className={styles.raiz} aria-labelledby={tituloId}>
      <header className={styles.cabecalho}>
        <div>
          <p>Para consultar e aplicar</p>
          <h4 id={tituloId}>Recursos desta aula</h4>
        </div>
        <span>{recursos.length} recursos</span>
      </header>
      <div className={styles.grade}>
        {recursos.map((recurso) => (
          <CartaoRecurso key={`${recurso.tipo}-${recurso.titulo}`} recurso={recurso} />
        ))}
      </div>
    </section>
  );
}
