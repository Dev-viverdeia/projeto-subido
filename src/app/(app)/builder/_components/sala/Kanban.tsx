'use client';

import { useId, useRef, useState, useTransition } from 'react';
import { ArrowRight, Check, ChevronDown, Circle, LoaderCircle, RotateCcw } from 'lucide-react';
import type { DocumentoSolucao } from '@/lib/builder/schema';
import type { EstadoTarefa } from '@/lib/builder/queries';
import { moverTarefa } from '@/lib/builder/actions';
import { BotaoCopiar } from '../../../_components/BotaoCopiar';
import { agruparPorFase } from './fases';
import styles from './Kanban.module.css';

const ROTULO: Record<EstadoTarefa, string> = {
  a_fazer: 'A fazer',
  fazendo: 'Em execução',
  feito: 'Concluída',
};
const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'a_fazer', rotulo: 'A fazer' },
  { id: 'fazendo', rotulo: 'Em execução' },
  { id: 'feito', rotulo: 'Concluídas' },
] as const;

/** Índice e tarefa em foco usam os mesmos estados persistidos do antigo quadro. */
export function Kanban({
  id,
  etapas,
  tarefas,
  salvar = moverTarefa,
}: {
  id: string;
  etapas: DocumentoSolucao['etapas'];
  tarefas: Record<number, EstadoTarefa>;
  salvar?: (dados: FormData) => Promise<{ ok: boolean }>;
}) {
  const uid = useId();
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const bloqueado = useRef(false);
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState(false);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['id']>('todas');
  const [fase, setFase] = useState('');
  const [listaAberta, setListaAberta] = useState(false);
  const estadoDe = (i: number): EstadoTarefa => tarefas[i] ?? 'a_fazer';
  const fases = agruparPorFase(etapas, tarefas);
  const visiveis = etapas
    .map((etapa, indice) => ({ etapa, indice }))
    .filter(
      ({ indice }) =>
        (filtro === 'todas' || estadoDe(indice) === filtro) &&
        (!fase ||
          Boolean(fases?.find((item) => item.numero === Number(fase))?.indices.includes(indice))),
    );
  const atual =
    visiveis.find((item) => item.indice === escolhida) ??
    visiveis.find((item) => estadoDe(item.indice) === 'fazendo') ??
    visiveis.find((item) => estadoDe(item.indice) === 'a_fazer') ??
    visiveis[0];
  const estado = atual ? estadoDe(atual.indice) : 'a_fazer';
  const proxima = visiveis.find(
    (item) => item.indice !== atual?.indice && estadoDe(item.indice) !== 'feito',
  );
  const concluidas = etapas.filter((_, i) => estadoDe(i) === 'feito').length;
  const selecionar = (indice: number) => {
    setEscolhida(indice);
    setListaAberta(false);
    setErro(false);
    requestAnimationFrame(() => tituloRef.current?.focus({ preventScroll: true }));
  };
  const mover = (destino: EstadoTarefa) => {
    if (!atual || bloqueado.current) return;
    bloqueado.current = true;
    const dados = new FormData();
    dados.set('id', id);
    dados.set('indice', String(atual.indice));
    dados.set('estado', destino);
    setEscolhida(atual.indice);
    setErro(false);
    iniciar(async () => {
      try {
        const resultado = await salvar(dados);
        if (!resultado.ok) setErro(true);
      } catch {
        setErro(true);
      } finally {
        bloqueado.current = false;
        tituloRef.current?.focus({ preventScroll: true });
      }
    });
  };

  return (
    <section className={styles.raiz} aria-label="Tarefas do projeto">
      <div className={styles.filtros}>
        <div className={styles.estados} role="group" aria-label="Filtrar tarefas">
          {FILTROS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filtro === item.id}
              disabled={salvando}
              onClick={() => {
                setFiltro(item.id);
                setErro(false);
              }}
            >
              {item.rotulo}
              <span>
                {etapas.filter((_, i) => item.id === 'todas' || estadoDe(i) === item.id).length}
              </span>
            </button>
          ))}
        </div>
        {fases ? (
          <select
            aria-label="Filtrar por fase"
            value={fase}
            disabled={salvando}
            onChange={(event) => {
              setFase(event.target.value);
              setErro(false);
            }}
          >
            <option value="">Todas as fases</option>
            {fases.map((item) => (
              <option key={item.numero} value={item.numero}>
                {item.rotulo}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {atual ? (
        <div className={styles.mesa}>
          <aside className={styles.indice} data-aberta={listaAberta || undefined}>
            <button
              className={styles.abrirLista}
              type="button"
              aria-expanded={listaAberta}
              aria-controls={uid + '-tarefas'}
              onClick={() => setListaAberta(!listaAberta)}
            >
              <span>
                {listaAberta ? 'Fechar lista' : 'Ver tarefas'} ({visiveis.length})
              </span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            <nav id={uid + '-tarefas'} aria-label="Escolher tarefa">
              {visiveis.map(({ etapa, indice }) => (
                <button
                  key={indice}
                  type="button"
                  aria-current={atual.indice === indice ? 'step' : undefined}
                  disabled={salvando}
                  onClick={() => selecionar(indice)}
                >
                  <span className={styles.marcador} aria-hidden="true">
                    {estadoDe(indice) === 'feito' ? <Check size={18} /> : indice + 1}
                  </span>
                  <span>
                    <strong>{etapa.titulo}</strong>
                    <small>{ROTULO[estadoDe(indice)]}</small>
                  </span>
                </button>
              ))}
            </nav>
          </aside>
          <article className={styles.tarefa} aria-labelledby={uid + '-titulo'} aria-busy={salvando}>
            <div className={styles.topo}>
              <span className={styles.estado} data-concluida={estado === 'feito' || undefined}>
                {estado === 'feito' ? (
                  <Check size={17} aria-hidden="true" />
                ) : (
                  <Circle size={14} aria-hidden="true" />
                )}
                {ROTULO[estado]}
              </span>
              <span className={styles.posicao}>
                Tarefa {atual.indice + 1} de {etapas.length}
              </span>
            </div>
            <h2 ref={tituloRef} id={uid + '-titulo'} tabIndex={-1}>
              {atual.etapa.titulo}
            </h2>
            <p className={styles.instrucao}>{atual.etapa.descricao}</p>
            {atual.etapa.ferramentas.length ? (
              <ul className={styles.ferramentas} aria-label="Ferramentas desta tarefa">
                {atual.etapa.ferramentas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            <div className={styles.rodape}>
              <p>
                {estado === 'feito'
                  ? 'Conclusão registrada. Revise ou abra outra tarefa.'
                  : 'Conclua depois de executar e conferir o resultado.'}
              </p>
              <div className={styles.acoes}>
                <button
                  type="button"
                  className={estado === 'feito' ? styles.secundario : styles.principal}
                  disabled={salvando}
                  onClick={() =>
                    mover(
                      estado === 'a_fazer' ? 'fazendo' : estado === 'fazendo' ? 'feito' : 'fazendo',
                    )
                  }
                >
                  {salvando ? (
                    <LoaderCircle className={styles.spinner} size={18} aria-hidden="true" />
                  ) : estado === 'feito' ? (
                    <RotateCcw size={17} aria-hidden="true" />
                  ) : null}
                  {salvando
                    ? 'Salvando…'
                    : estado === 'a_fazer'
                      ? 'Iniciar tarefa'
                      : estado === 'fazendo'
                        ? 'Concluir tarefa'
                        : 'Reabrir tarefa'}
                </button>
                {estado === 'fazendo' ? (
                  <button
                    type="button"
                    className={styles.secundario}
                    disabled={salvando}
                    onClick={() => mover('a_fazer')}
                  >
                    Voltar para a fazer
                  </button>
                ) : null}
                <BotaoCopiar
                  texto={atual.etapa.titulo + '\n\n' + atual.etapa.descricao}
                  rotuloDoQue="instruções da tarefa"
                />
              </div>
              {erro ? (
                <p className={styles.erro} role="alert">
                  Não foi possível salvar. Sua tarefa continua aqui; tente novamente.
                </p>
              ) : null}
            </div>
            {estado === 'feito' && proxima ? (
              <button
                type="button"
                className={styles.proxima}
                onClick={() => selecionar(proxima.indice)}
              >
                Abrir próxima tarefa <ArrowRight size={18} aria-hidden="true" />
              </button>
            ) : null}
          </article>
        </div>
      ) : (
        <div className={styles.vazio}>
          <h2>
            {etapas.length === 0
              ? 'Este plano ainda não tem tarefas'
              : 'Nenhuma tarefa neste filtro'}
          </h2>
          {etapas.length > 0 ? (
            <button
              type="button"
              className={styles.secundario}
              onClick={() => {
                setFiltro('todas');
                setFase('');
              }}
            >
              Ver todas as tarefas
            </button>
          ) : null}
        </div>
      )}
      {etapas.length > 0 && concluidas === etapas.length ? (
        <p className={styles.conclusao} role="status">
          <Check size={20} aria-hidden="true" /> Todas as tarefas concluídas. A entrega ao cliente é
          gerenciada em Entregas.
        </p>
      ) : null}
    </section>
  );
}
