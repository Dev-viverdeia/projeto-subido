'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { FormacaoResumo } from '@/lib/conteudo/queries';
import {
  contarConcluidas,
  estadoDoProgresso,
  formacaoMaisRecente,
  type EstadoProgressoConta,
  useProgresso,
} from '@/lib/progresso/local';
import { CartaoFormacao } from './CartaoFormacao';
import styles from './TrilhaFormacoes.module.css';

const PERFIL: Record<string, { etapa: string; foco: string }> = {
  'formacao-de-chatgpt': {
    etapa: 'Base de trabalho',
    foco: 'Use IA com contexto, método e segurança nas tarefas do dia a dia.',
  },
  'formacao-de-gpt-agents': {
    etapa: 'Automação guiada',
    foco: 'Crie agentes com instruções claras, ferramentas e limites de atuação.',
  },
  'formacao-de-lovable': {
    etapa: 'Construção visual',
    foco: 'Transforme uma necessidade em uma primeira versão funcional e publicável.',
  },
  'formacao-de-claude-code': {
    etapa: 'Desenvolvimento assistido',
    foco: 'Construa automações e ferramentas com IA apoiando o trabalho técnico.',
  },
};

function perfil(formacao: FormacaoResumo, indice: number) {
  return (
    PERFIL[formacao.slug] ?? {
      etapa: `Formação ${String(indice + 1).padStart(2, '0')}`,
      foco: formacao.resumo ?? 'Desenvolva uma nova habilidade para o trabalho com IA.',
    }
  );
}

export function selecionarProximaFormacao(
  formacoes: FormacaoResumo[],
  progresso: EstadoProgressoConta,
): FormacaoResumo | null {
  const recente = formacaoMaisRecente(progresso);
  const emAndamento = recente
    ? formacoes.find((formacao) => {
        if (formacao.slug !== recente) return false;
        const feitas = contarConcluidas(progresso, formacao.aulaIds);
        return feitas > 0 && feitas < formacao.aulas;
      })
    : null;

  if (emAndamento) return emAndamento;

  return (
    formacoes.find((formacao) => {
      const feitas = contarConcluidas(progresso, formacao.aulaIds);
      return estadoDoProgresso(feitas, formacao.aulas) !== 'concluida';
    }) ?? null
  );
}

export function TrilhaFormacoes({ formacoes }: { formacoes: FormacaoResumo[] }) {
  const progresso = useProgresso();
  const proxima = selecionarProximaFormacao(formacoes, progresso);
  const feitas = proxima ? contarConcluidas(progresso, proxima.aulaIds) : 0;
  const perfilProxima = proxima ? perfil(proxima, formacoes.indexOf(proxima)) : null;
  const concluidas = formacoes.filter((formacao) => {
    const totalFeitas = contarConcluidas(progresso, formacao.aulaIds);
    return estadoDoProgresso(totalFeitas, formacao.aulas) === 'concluida';
  }).length;

  return (
    <section id="trilha-formacoes" className={styles.raiz} aria-labelledby="trilha-titulo">
      {proxima && perfilProxima ? (
        <Link href={`/formacoes/${proxima.slug}`} className={styles.proxima}>
          <div className={styles.proximaIdentidade}>
            <span className={styles.proximaRotulo}>
              {feitas > 0 ? 'Continue aprendendo' : 'Comece por aqui'}
            </span>
            <strong>{proxima.titulo}</strong>
            <span>{perfilProxima.foco}</span>
          </div>
          <div className={styles.proximaAcao}>
            <span>
              {feitas} de {proxima.aulas} aulas
            </span>
            <strong>
              {feitas > 0 ? 'Retomar formação' : 'Começar formação'}
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </strong>
          </div>
        </Link>
      ) : formacoes.length > 0 ? (
        <div className={styles.conclusao} role="status">
          <div>
            <span>Trilha concluída</span>
            <strong>Você concluiu as {formacoes.length} formações disponíveis.</strong>
          </div>
          <Link href="/solucoes">Escolher um projeto</Link>
        </div>
      ) : null}

      <header className={styles.cabecalho}>
        <div>
          <p className={styles.eyebrow}>Biblioteca</p>
          <h2 id="trilha-titulo">Todas as formações</h2>
        </div>
        <p>
          {formacoes.length}{' '}
          {formacoes.length === 1 ? 'formação disponível' : 'formações disponíveis'}
          {concluidas > 0
            ? ` · ${concluidas} ${concluidas === 1 ? 'concluída' : 'concluídas'}`
            : ''}
        </p>
      </header>

      <ol className={styles.grade} aria-label="Formações em ordem recomendada">
        {formacoes.map((formacao, indice) => {
          const dados = perfil(formacao, indice);
          return (
            <li key={formacao.id}>
              <CartaoFormacao
                formacao={formacao}
                numero={indice + 1}
                etapa={dados.etapa}
                foco={dados.foco}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
