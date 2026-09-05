'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Play } from 'lucide-react';
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
    foco: 'Pesquisa, escrita e análise no dia a dia.',
  },
  'formacao-de-gpt-agents': {
    etapa: 'Automação guiada',
    foco: 'Agentes com ferramentas, memória e limites claros.',
  },
  'formacao-de-lovable': {
    etapa: 'Construção visual',
    foco: 'Aplicações funcionais, da ideia à publicação.',
  },
  'formacao-de-claude-code': {
    etapa: 'Desenvolvimento assistido',
    foco: 'Código e automações com o apoio da IA.',
  },
};

function perfil(formacao: FormacaoResumo) {
  return (
    PERFIL[formacao.slug] ?? {
      etapa: 'Aprendizado prático',
      foco: formacao.resumo ?? 'Uma nova habilidade para trabalhar com IA.',
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
      return estadoDoProgresso(feitas, formacao.aulas) === 'em-andamento';
    }) ??
    formacoes.find((formacao) => {
      const feitas = contarConcluidas(progresso, formacao.aulaIds);
      return estadoDoProgresso(feitas, formacao.aulas) === 'nao-iniciada';
    }) ??
    null
  );
}

export function TrilhaFormacoes({ formacoes }: { formacoes: FormacaoResumo[] }) {
  const progresso = useProgresso();
  const proxima = selecionarProximaFormacao(formacoes, progresso);
  const feitas = proxima ? contarConcluidas(progresso, proxima.aulaIds) : 0;
  const concluidas = formacoes.filter((formacao) => {
    const totalFeitas = contarConcluidas(progresso, formacao.aulaIds);
    return estadoDoProgresso(totalFeitas, formacao.aulas) === 'concluida';
  }).length;

  return (
    <section id="trilha-formacoes" className={styles.raiz} aria-labelledby="trilha-titulo">
      <h2 id="trilha-titulo" className={styles.srOnly}>
        Todas as formações
      </h2>
      {proxima && feitas > 0 ? (
        <Link href={`/formacoes/${proxima.slug}`} className={styles.proxima}>
          <span className={styles.sinal} aria-hidden="true">
            <Play size={22} />
          </span>
          <div className={styles.proximaIdentidade}>
            <span className={styles.proximaRotulo}>Continue de onde parou</span>
            <strong>{proxima.titulo}</strong>
            <span>
              {feitas} de {proxima.aulas} aulas concluídas
            </span>
          </div>
          <div className={styles.proximaAcao}>
            Retomar formação <ArrowRight size={18} aria-hidden="true" />
          </div>
        </Link>
      ) : concluidas > 0 && concluidas === formacoes.length ? (
        <div className={styles.conclusao} role="status">
          <span className={styles.sinal} aria-hidden="true">
            <Check size={22} />
          </span>
          <div>
            <strong>Formações concluídas</strong>
            <span>Escolha um projeto para aplicar o que aprendeu.</span>
          </div>
          <Link href="/solucoes">
            Ver projetos <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      {formacoes.length === 0 ? (
        <div className={styles.vazio}>
          <span className={styles.sinal} aria-hidden="true">
            <BookOpen size={24} />
          </span>
          <h3>Nenhuma formação disponível</h3>
          <p>As aulas publicadas aparecerão aqui.</p>
        </div>
      ) : (
        <p className={styles.contagem}>
          {formacoes.length}{' '}
          {formacoes.length === 1 ? 'formação disponível' : 'formações disponíveis'}
          {concluidas > 0
            ? ` · ${concluidas} ${concluidas === 1 ? 'concluída' : 'concluídas'}`
            : ''}
        </p>
      )}

      <ol className={styles.grade} aria-label="Formações em ordem recomendada">
        {formacoes.map((formacao) => {
          const dados = perfil(formacao);
          return (
            <li key={formacao.id}>
              <CartaoFormacao
                formacao={formacao}
                recomendada={feitas === 0 && proxima?.id === formacao.id}
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
