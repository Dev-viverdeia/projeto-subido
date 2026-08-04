'use client';

import { useState, useTransition } from 'react';
import type { DocumentoSolucao } from '@/lib/builder/schema';
import type { EstadoTarefa } from '@/lib/builder/queries';
import { moverTarefa } from '@/lib/builder/actions';
import { BotaoCopiar } from '../../../_components/BotaoCopiar';
import { agruparPorFase } from './fases';
import styles from './Kanban.module.css';

/**
 * O quadro de tarefas — as etapas do documento viram trabalho com estado.
 *
 * NÃO HÁ ARRASTAR, e a ausência é decisão. A referência arrasta; arrastar exige
 * ponteiro, e num quadro de três colunas com toque ele vira uma armadilha
 * (a coluna de destino sai da tela). Os botões movem nos dois sentidos, funcionam
 * por teclado sem nenhuma ARIA extra e não precisam de biblioteca. Se o arrastar
 * entrar depois, entra COMO ADIÇÃO — os botões continuam sendo o caminho
 * acessível.
 *
 * A TAREFA NÃO GUARDA O TEXTO DELA. O quadro cruza `documento.etapas[i]` com o
 * estado gravado em `(projeto, índice)`. Se o documento for regerado com etapas
 * diferentes, o texto acompanha; uma cópia no banco teria congelado o texto
 * antigo e o quadro passaria a descrever um plano que não existe mais.
 *
 * `useTransition` sem estado otimista: quem confirma o movimento é o banco, e a
 * revalidação traz a verdade. Mostrar a tarefa já movida e depois voltar atrás
 * seria pior que meio segundo de espera.
 */
const COLUNAS: Array<{ id: EstadoTarefa; rotulo: string }> = [
  { id: 'a_fazer', rotulo: 'A fazer' },
  { id: 'fazendo', rotulo: 'Fazendo' },
  { id: 'feito', rotulo: 'Feito' },
];

const VAZIO: Record<EstadoTarefa, string> = {
  a_fazer: 'Tudo que estava aqui já saiu.',
  fazendo: 'Comece uma tarefa para ela aparecer aqui.',
  feito: 'O que você concluir aparece aqui.',
};

export function Kanban({
  id,
  etapas,
  tarefas,
}: {
  id: string;
  etapas: DocumentoSolucao['etapas'];
  tarefas: Record<number, EstadoTarefa>;
}) {
  const [movendo, iniciar] = useTransition();
  const fases = agruparPorFase(etapas, tarefas);
  /* `null` = todas as fases. A régua começa em "todas" de propósito: o quadro é
     a visão do projeto inteiro, e filtrar por padrão esconderia trabalho. */
  const [fase, setFase] = useState<number | null>(null);

  const estadoDe = (i: number): EstadoTarefa => tarefas[i] ?? 'a_fazer';
  const visivel = (i: number) =>
    fase === null || (fases?.find((f) => f.numero === fase)?.indices.includes(i) ?? true);

  const mover = (indice: number, estado: EstadoTarefa) => {
    const dados = new FormData();
    dados.set('id', id);
    dados.set('indice', String(indice));
    dados.set('estado', estado);
    iniciar(() => {
      void moverTarefa(dados);
    });
  };

  return (
    <div className={styles.raiz}>
      {/* A régua de fases só existe quando o documento declara fase — ver
          `fases.ts`. Documento antigo não agrupa, e o quadro fica inteiro. */}
      {fases && (
        <div className={styles.fases} role="group" aria-label="Filtrar por fase">
          <button
            type="button"
            className={styles.fase}
            data-ativa={fase === null ? '' : undefined}
            onClick={() => setFase(null)}
          >
            <span className={styles.faseRotulo}>Todas as fases</span>
            <span className={styles.faseContagem}>
              {etapas.reduce((n, _, i) => (estadoDe(i) === 'feito' ? n + 1 : n), 0)}/{etapas.length}
            </span>
          </button>

          {fases.map((f) => (
            <button
              key={f.numero}
              type="button"
              className={styles.fase}
              data-ativa={fase === f.numero ? '' : undefined}
              onClick={() => setFase(f.numero)}
            >
              <span className={styles.faseEyebrow}>fase {f.numero}</span>
              <span className={styles.faseRotulo}>{f.rotulo}</span>
              <span className={styles.faseContagem}>
                {f.feitas}/{f.indices.length}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.quadro}>
        {COLUNAS.map((coluna) => {
          const daColuna = etapas
            .map((etapa, i) => ({ etapa, i }))
            .filter(({ i }) => estadoDe(i) === coluna.id && visivel(i));

          return (
            <section key={coluna.id} className={styles.coluna} aria-label={coluna.rotulo}>
              <header className={styles.colunaTopo}>
                <h3 className={styles.colunaRotulo}>{coluna.rotulo}</h3>
                <span className={styles.colunaTotal}>{daColuna.length}</span>
              </header>

              {daColuna.length === 0 ? (
                <p className={styles.vazio}>{VAZIO[coluna.id]}</p>
              ) : (
                <ul className={styles.lista}>
                  {daColuna.map(({ etapa, i }) => (
                    <li key={i} className={styles.tarefa}>
                      <p className={styles.tarefaTitulo}>{etapa.titulo}</p>
                      <p className={styles.tarefaTexto}>{etapa.descricao}</p>

                      {etapa.ferramentas.length > 0 && (
                        <ul className={styles.marcas}>
                          {etapa.ferramentas.map((f) => (
                            <li key={f} className={styles.marca}>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className={styles.acoes}>
                        {coluna.id !== 'a_fazer' && (
                          <button
                            type="button"
                            className={styles.voltar}
                            disabled={movendo}
                            onClick={() => mover(i, coluna.id === 'feito' ? 'fazendo' : 'a_fazer')}
                          >
                            Voltar
                          </button>
                        )}

                        {coluna.id !== 'feito' && (
                          <button
                            type="button"
                            className={styles.avancar}
                            disabled={movendo}
                            onClick={() => mover(i, coluna.id === 'a_fazer' ? 'fazendo' : 'feito')}
                          >
                            {coluna.id === 'a_fazer' ? 'Começar' : 'Concluir'}
                          </button>
                        )}

                        {/* O prompt da tarefa é a própria descrição da etapa —
                          é o que a pessoa cola na ferramenta. */}
                        <BotaoCopiar
                          texto={`${etapa.titulo}\n\n${etapa.descricao}`}
                          rotuloDoQue={`a tarefa "${etapa.titulo}"`}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
