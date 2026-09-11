import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { DocumentoProposta } from '@/lib/propostas/schema';
import styles from './EditorProposta.module.css';

export type MudarDocumento = (mutacao: (atual: DocumentoProposta) => DocumentoProposta) => void;

export function SecoesContextoEntrega({
  documento,
  mudar,
}: {
  documento: DocumentoProposta;
  mudar: MudarDocumento;
}) {
  function atualizarEscopo(indice: number, campo: 'titulo' | 'descricao', valor: string) {
    mudar((atual) => ({
      ...atual,
      escopo: atual.escopo.map((item, itemIndice) =>
        itemIndice === indice ? { ...item, [campo]: valor } : item,
      ),
    }));
  }

  return (
    <>
      <details className={styles.bloco} name="editar-proposta" data-previa="cliente">
        <summary className={styles.blocoTopo}>
          <div>
            <h2>Cliente e objetivo</h2>
            <p className={styles.resumoBloco}>{documento.cliente.empresa}</p>
          </div>
          <ChevronDown className={styles.blocoSeta} size={18} aria-hidden="true" />
        </summary>
        <div className={styles.blocoConteudo}>
          <div className={styles.camposDois}>
            <label className={styles.campo}>
              <span>Empresa</span>
              <input
                data-campo-preview="cliente"
                value={documento.cliente.empresa}
                maxLength={160}
                onChange={(evento) =>
                  mudar((atual) => ({
                    ...atual,
                    cliente: { ...atual.cliente, empresa: evento.target.value },
                  }))
                }
              />
            </label>
            <label className={styles.campo}>
              <span>Contato</span>
              <input
                value={documento.cliente.contato ?? ''}
                maxLength={160}
                onChange={(evento) =>
                  mudar((atual) => ({
                    ...atual,
                    cliente: { ...atual.cliente, contato: evento.target.value || null },
                  }))
                }
              />
            </label>
            <label className={styles.campo}>
              <span>Cargo</span>
              <input
                value={documento.cliente.cargo ?? ''}
                maxLength={160}
                onChange={(evento) =>
                  mudar((atual) => ({
                    ...atual,
                    cliente: { ...atual.cliente, cargo: evento.target.value || null },
                  }))
                }
              />
            </label>
            <label className={styles.campo}>
              <span>E-mail</span>
              <input
                type="email"
                value={documento.cliente.email ?? ''}
                maxLength={320}
                onChange={(evento) =>
                  mudar((atual) => ({
                    ...atual,
                    cliente: { ...atual.cliente, email: evento.target.value || null },
                  }))
                }
              />
            </label>
          </div>
          <label className={styles.campo} data-previa="contexto">
            <span>Desafio identificado</span>
            <textarea
              data-campo-preview="contexto"
              rows={5}
              value={documento.desafio}
              maxLength={4000}
              onChange={(evento) => mudar((atual) => ({ ...atual, desafio: evento.target.value }))}
            />
          </label>
          <label className={styles.campo} data-previa="contexto">
            <span>Objetivo do projeto</span>
            <textarea
              rows={3}
              value={documento.objetivo}
              maxLength={2000}
              onChange={(evento) => mudar((atual) => ({ ...atual, objetivo: evento.target.value }))}
            />
          </label>
        </div>
      </details>

      <details className={styles.bloco} name="editar-proposta" data-previa="escopo">
        <summary className={styles.blocoTopo}>
          <div>
            <h2>Projeto e escopo</h2>
            <p className={styles.resumoBloco}>
              {documento.escopo.length} {documento.escopo.length === 1 ? 'etapa' : 'etapas'} de
              escopo
            </p>
          </div>
          <ChevronDown className={styles.blocoSeta} size={18} aria-hidden="true" />
        </summary>
        <div className={styles.blocoConteudo}>
          <label className={styles.campo} data-previa="cliente">
            <span>Nome do projeto</span>
            <input
              value={documento.projeto.titulo}
              maxLength={180}
              onChange={(evento) =>
                mudar((atual) => ({
                  ...atual,
                  projeto: { ...atual.projeto, titulo: evento.target.value },
                }))
              }
            />
          </label>
          <label className={styles.campo} data-previa="solucao">
            <span>Resumo da solução</span>
            <textarea
              data-campo-preview="solucao"
              rows={3}
              value={documento.projeto.resumo}
              maxLength={1200}
              onChange={(evento) =>
                mudar((atual) => ({
                  ...atual,
                  projeto: { ...atual.projeto, resumo: evento.target.value },
                }))
              }
            />
          </label>

          <div className={styles.listaTopo}>
            <div>
              <strong>Escopo</strong>
              <span>O que será feito</span>
            </div>
            <button
              type="button"
              disabled={documento.escopo.length >= 10}
              aria-label="Adicionar etapa ao escopo"
              onClick={() =>
                mudar((atual) => ({
                  ...atual,
                  escopo: [
                    ...atual.escopo,
                    {
                      titulo: 'Nova etapa',
                      descricao: 'Descreva o que será realizado nesta etapa.',
                    },
                  ],
                }))
              }
            >
              <Plus size={14} aria-hidden="true" /> Adicionar
            </button>
          </div>
          <div className={styles.listaEditavel}>
            {documento.escopo.map((item, indice) => (
              <div className={styles.itemEscopo} key={indice}>
                <span>{(indice + 1).toString().padStart(2, '0')}</span>
                <div>
                  <input
                    data-campo-preview={indice === 0 ? 'escopo' : undefined}
                    aria-label={`Título da etapa ${indice + 1}`}
                    value={item.titulo}
                    maxLength={140}
                    onChange={(evento) => atualizarEscopo(indice, 'titulo', evento.target.value)}
                  />
                  <textarea
                    aria-label={`Descrição da etapa ${indice + 1}`}
                    value={item.descricao}
                    rows={3}
                    maxLength={1200}
                    onChange={(evento) => atualizarEscopo(indice, 'descricao', evento.target.value)}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remover etapa ${indice + 1}`}
                  disabled={documento.escopo.length === 1}
                  onClick={() =>
                    mudar((atual) => ({
                      ...atual,
                      escopo: atual.escopo.filter((_, itemIndice) => itemIndice !== indice),
                    }))
                  }
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.listaTopo}>
            <div>
              <strong>Entregáveis</strong>
              <span>O que o cliente recebe</span>
            </div>
            <button
              type="button"
              disabled={documento.entregaveis.length >= 12}
              aria-label="Adicionar entregável"
              onClick={() =>
                mudar((atual) => ({
                  ...atual,
                  entregaveis: [...atual.entregaveis, 'Novo entregável'],
                }))
              }
            >
              <Plus size={14} aria-hidden="true" /> Adicionar
            </button>
          </div>
          <div className={styles.listaSimples} data-previa="entregaveis">
            {documento.entregaveis.map((item, indice) => (
              <div key={indice}>
                <Check size={14} aria-hidden="true" />
                <input
                  data-campo-preview={indice === 0 ? 'entregaveis' : undefined}
                  aria-label={`Entregável ${indice + 1}`}
                  value={item}
                  maxLength={300}
                  onChange={(evento) =>
                    mudar((atual) => ({
                      ...atual,
                      entregaveis: atual.entregaveis.map((valor, itemIndice) =>
                        itemIndice === indice ? evento.target.value : valor,
                      ),
                    }))
                  }
                />
                <button
                  type="button"
                  aria-label={`Remover entregável ${indice + 1}`}
                  disabled={documento.entregaveis.length === 1}
                  onClick={() =>
                    mudar((atual) => ({
                      ...atual,
                      entregaveis: atual.entregaveis.filter(
                        (_, itemIndice) => itemIndice !== indice,
                      ),
                    }))
                  }
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </details>
    </>
  );
}
