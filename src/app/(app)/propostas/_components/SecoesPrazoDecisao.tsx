import { Plus, Trash2 } from 'lucide-react';
import { reaisParaCentavos, type DocumentoProposta } from '@/lib/propostas/schema';
import type { MudarDocumento } from './SecoesContextoEntrega';
import styles from './EditorProposta.module.css';

export function SecoesPrazoDecisao({
  documento,
  mudar,
  valor,
  setValor,
}: {
  documento: DocumentoProposta;
  mudar: MudarDocumento;
  valor: string;
  setValor: (valor: string) => void;
}) {
  function atualizarCronograma(
    indice: number,
    campo: 'fase' | 'duracao' | 'descricao',
    valorNovo: string,
  ) {
    mudar((atual) => ({
      ...atual,
      cronograma: atual.cronograma.map((item, itemIndice) =>
        itemIndice === indice ? { ...item, [campo]: valorNovo } : item,
      ),
    }));
  }

  return (
    <>
      <section className={styles.bloco}>
        <header className={styles.blocoTopo}>
          <span>03</span>
          <div>
            <p>Prazo</p>
            <h2>Cronograma</h2>
          </div>
        </header>
        <div className={styles.listaTopo}>
          <div>
            <strong>Marcos da entrega</strong>
            <span>Fases e duração previstas</span>
          </div>
          <button
            type="button"
            disabled={documento.cronograma.length >= 8}
            onClick={() =>
              mudar((atual) => ({
                ...atual,
                cronograma: [
                  ...atual.cronograma,
                  {
                    fase: 'Nova fase',
                    duracao: 'A combinar',
                    descricao: 'Descreva o resultado desta fase.',
                  },
                ],
              }))
            }
          >
            <Plus size={14} aria-hidden="true" /> Adicionar
          </button>
        </div>
        <div className={styles.listaEditavel}>
          {documento.cronograma.map((item, indice) => (
            <div className={styles.itemCronograma} key={indice}>
              <span>{(indice + 1).toString().padStart(2, '0')}</span>
              <div className={styles.camposCronograma}>
                <input
                  aria-label={`Fase ${indice + 1}`}
                  value={item.fase}
                  maxLength={120}
                  onChange={(evento) => atualizarCronograma(indice, 'fase', evento.target.value)}
                />
                <input
                  aria-label={`Duração da fase ${indice + 1}`}
                  value={item.duracao}
                  maxLength={80}
                  onChange={(evento) => atualizarCronograma(indice, 'duracao', evento.target.value)}
                />
                <textarea
                  aria-label={`Descrição da fase ${indice + 1}`}
                  value={item.descricao}
                  rows={2}
                  maxLength={600}
                  onChange={(evento) =>
                    atualizarCronograma(indice, 'descricao', evento.target.value)
                  }
                />
              </div>
              <button
                type="button"
                aria-label={`Remover fase ${indice + 1}`}
                disabled={documento.cronograma.length === 1}
                onClick={() =>
                  mudar((atual) => ({
                    ...atual,
                    cronograma: atual.cronograma.filter((_, itemIndice) => itemIndice !== indice),
                  }))
                }
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.bloco}>
        <header className={styles.blocoTopo}>
          <span>04</span>
          <div>
            <p>Investimento</p>
            <h2>Valor e condições</h2>
          </div>
        </header>
        <div className={styles.camposDois}>
          <label className={styles.campo}>
            <span>Valor do projeto (R$)</span>
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={(evento) => {
                setValor(evento.target.value);
                mudar((atual) => ({
                  ...atual,
                  investimento: {
                    ...atual.investimento,
                    valorCentavos: reaisParaCentavos(evento.target.value),
                  },
                }));
              }}
            />
          </label>
          <label className={styles.campo}>
            <span>Validade da proposta (dias)</span>
            <input
              type="number"
              min={1}
              max={90}
              value={documento.validadeDias}
              onChange={(evento) =>
                mudar((atual) => ({
                  ...atual,
                  validadeDias: Number(evento.target.value),
                }))
              }
            />
          </label>
        </div>
        <label className={styles.campo}>
          <span>Condições de pagamento</span>
          <textarea
            rows={3}
            value={documento.investimento.condicoes}
            maxLength={1200}
            onChange={(evento) =>
              mudar((atual) => ({
                ...atual,
                investimento: { ...atual.investimento, condicoes: evento.target.value },
              }))
            }
          />
        </label>
      </section>

      <section className={styles.bloco}>
        <header className={styles.blocoTopo}>
          <span>05</span>
          <div>
            <p>Decisão</p>
            <h2>Próximos passos</h2>
          </div>
        </header>
        <div className={styles.listaSimples}>
          {documento.proximosPassos.map((item, indice) => (
            <div key={indice}>
              <span className={styles.passo}>{indice + 1}</span>
              <input
                aria-label={`Próximo passo ${indice + 1}`}
                value={item}
                maxLength={300}
                onChange={(evento) =>
                  mudar((atual) => ({
                    ...atual,
                    proximosPassos: atual.proximosPassos.map((valorAtual, itemIndice) =>
                      itemIndice === indice ? evento.target.value : valorAtual,
                    ),
                  }))
                }
              />
              <button
                type="button"
                aria-label={`Remover próximo passo ${indice + 1}`}
                disabled={documento.proximosPassos.length === 1}
                onClick={() =>
                  mudar((atual) => ({
                    ...atual,
                    proximosPassos: atual.proximosPassos.filter(
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
        {documento.proximosPassos.length < 6 && (
          <button
            type="button"
            className={styles.adicionarLinha}
            onClick={() =>
              mudar((atual) => ({
                ...atual,
                proximosPassos: [...atual.proximosPassos, 'Novo próximo passo'],
              }))
            }
          >
            <Plus size={14} aria-hidden="true" /> Adicionar próximo passo
          </button>
        )}
        <label className={styles.campo}>
          <span>
            Observações finais <small>opcional</small>
          </span>
          <textarea
            rows={4}
            value={documento.observacoes ?? ''}
            maxLength={2000}
            onChange={(evento) =>
              mudar((atual) => ({
                ...atual,
                observacoes: evento.target.value || null,
              }))
            }
          />
        </label>
      </section>
    </>
  );
}
