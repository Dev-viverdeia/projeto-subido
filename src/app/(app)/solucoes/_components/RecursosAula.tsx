'use client';

import { useId, useMemo, useState } from 'react';
import {
  BookOpenText,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  ListChecks,
  Network,
  RotateCcw,
} from 'lucide-react';
import type { RoteiroProjeto } from '@/lib/projetos/roteiro';
import { nomeArquivoMaterial } from '@/lib/projetos/kit-visual';
import { MaterialProjeto } from './MaterialProjeto';
import styles from './RecursosAula.module.css';

type Trilha = NonNullable<RoteiroProjeto['trilhaDidatica']>;
type Recurso = Trilha['aulas'][number]['recursos'][number];

const ROTULOS = {
  mapa_mental: { rotulo: 'Mapa mental', Icone: Network },
  quiz: { rotulo: 'Autoavaliação', Icone: ListChecks },
  ebook: { rotulo: 'Guia', Icone: BookOpenText },
  modelo: { rotulo: 'Modelo', Icone: FileText },
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
      {orientacao.length > 0 ? <p className={styles.orientacao}>{orientacao.join('\n')}</p> : null}
      <div className={styles.quizProgresso}>
        <span>
          <strong>{respondidas}</strong> de {perguntas.length} respondidas · sem nota
        </span>
        <span
          role="progressbar"
          aria-label={`Progresso da autoavaliação ${titulo}`}
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
                  {respostas[indice] === true ? <Check size={16} aria-hidden="true" /> : null}
                  Sim
                </button>
                <button
                  type="button"
                  aria-pressed={respostas[indice] === false}
                  onClick={() => setRespostas((atual) => ({ ...atual, [indice]: false }))}
                >
                  {respostas[indice] === false ? <Check size={16} aria-hidden="true" /> : null}
                  Ainda não
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {completo ? (
        <div className={styles.resultadoQuiz}>
          <output>
            <strong>
              {ajustes === 0
                ? 'Você marcou todos os pontos como prontos.'
                : `${ajustes} ${ajustes === 1 ? 'ponto para revisar.' : 'pontos para revisar.'}`}
            </strong>
            <span>Essa revisão não conclui a aula.</span>
          </output>
        </div>
      ) : null}
      {respondidas > 0 ? (
        <button type="button" className={styles.refazer} onClick={() => setRespostas({})}>
          <RotateCcw size={16} aria-hidden="true" /> Refazer autoavaliação
        </button>
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

  return null;
}

function CartaoRecurso({ recurso }: { recurso: Recurso }) {
  const { rotulo, Icone } = ROTULOS[recurso.tipo];
  const id = useId();
  const temConteudo = Boolean(recurso.conteudo?.trim());
  const url = enderecoRecurso(recurso.url);
  const cabecalho = (
    <>
      <span className={styles.icone} aria-hidden="true">
        <Icone size={22} strokeWidth={1.7} />
      </span>
      <span className={styles.titulo}>
        <small>{rotulo}</small>
        <strong id={id}>{recurso.titulo}</strong>
      </span>
    </>
  );
  const origem = url ? (
    <a className={styles.linkExterno} href={url} target="_blank" rel="noopener noreferrer">
      Abrir arquivo original <ExternalLink size={16} aria-hidden="true" />
      <span className={styles.srOnly}> (nova aba)</span>
    </a>
  ) : null;

  if (recurso.tipo === 'modelo' && temConteudo) {
    return (
      <div className={styles.modelo}>
        <MaterialProjeto
          nivelTitulo={5}
          titulo={recurso.titulo}
          conteudo={recurso.conteudo!}
          quandoUsar={recurso.descricao}
        />
        {origem}
      </div>
    );
  }

  return (
    <article className={styles.cartao} data-tipo={recurso.tipo} aria-labelledby={id}>
      {temConteudo ? (
        <details className={styles.detalhe}>
          <summary>
            {cabecalho}
            <ChevronDown size={19} aria-hidden="true" />
          </summary>
          <div className={styles.conteudo}>
            {recurso.descricao ? <p className={styles.descricao}>{recurso.descricao}</p> : null}
            <ConteudoRecurso recurso={recurso} />
          </div>
        </details>
      ) : (
        <header className={styles.semConteudo}>{cabecalho}</header>
      )}
      {recurso.tipo === 'ebook' && temConteudo ? (
        <a
          className={styles.download}
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(recurso.conteudo!)}`}
          download={nomeArquivoMaterial(recurso.titulo)}
          aria-label={`Baixar .txt: ${recurso.titulo}`}
        >
          <Download size={17} aria-hidden="true" />
          Baixar .txt
        </a>
      ) : null}
      {origem}
      {!temConteudo ? (
        <p className={styles.vazio}>
          {url ? recurso.descricao : 'O conteúdo deste recurso ainda não foi adicionado.'}
        </p>
      ) : null}
    </article>
  );
}

function enderecoRecurso(valor?: string) {
  if (!valor) return null;
  try {
    const url = new URL(valor);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function RecursosAula({
  recursos,
  compacto = false,
}: {
  recursos: Recurso[];
  compacto?: boolean;
}) {
  const tituloId = useId();
  if (recursos.length === 0) return null;

  return (
    <section
      data-recursos-aula
      className={styles.raiz}
      data-compacto={compacto || undefined}
      aria-labelledby={compacto ? undefined : tituloId}
      aria-label={compacto ? 'Recursos desta aula' : undefined}
    >
      {!compacto ? (
        <header className={styles.cabecalho}>
          <h4 id={tituloId}>Recursos desta aula</h4>
        </header>
      ) : null}
      <div className={styles.grade}>
        {recursos.map((recurso) => (
          <CartaoRecurso key={`${recurso.tipo}-${recurso.titulo}`} recurso={recurso} />
        ))}
      </div>
    </section>
  );
}
