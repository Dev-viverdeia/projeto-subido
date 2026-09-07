'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ClipboardList,
  Clock3,
  Gauge,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { RoteiroProjeto } from '@/lib/projetos/roteiro';
import styles from './ProjetoGuiado.module.css';
import visual from './LeituraProjeto.module.css';

const ROTULO_NIVEL = {
  entrada: 'Entrada',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
} as const;
type Perfil = NonNullable<RoteiroProjeto['perfil']>;
type Escopo = NonNullable<RoteiroProjeto['escopo']>;
type Artefatos = NonNullable<RoteiroProjeto['artefatosEntrega']>;

export function FichaCampoProjeto({ perfil, escopo }: { perfil: Perfil; escopo: Escopo }) {
  const [grupo, setGrupo] = useState<keyof Escopo>('inclui');
  const grupos = [
    { id: 'inclui', titulo: 'O piloto inclui', icone: <Check size={19} /> },
    { id: 'preRequisitos', titulo: 'O cliente precisa ter', icone: <ClipboardList size={19} /> },
    { id: 'naoInclui', titulo: 'Fora do piloto', icone: <ShieldCheck size={19} /> },
    { id: 'evolucoes', titulo: 'Depois de validar', icone: <ArrowUpRight size={19} /> },
  ] as const;
  const ativo = grupos.find((item) => item.id === grupo)!;
  return (
    <section className={visual.escopo} aria-labelledby="ficha-campo-titulo">
      <header className={visual.escopoTopo}>
        <div>
          <h2 id="ficha-campo-titulo">Escopo do piloto</h2>
          <p>{perfil.formatoPiloto}</p>
        </div>
        <dl>
          <div>
            <dt>
              <Clock3 size={17} aria-hidden="true" />
              Prazo
            </dt>
            <dd>{perfil.prazo}</dd>
          </div>
          <div>
            <dt>
              <Gauge size={17} aria-hidden="true" />
              Complexidade
            </dt>
            <dd>{ROTULO_NIVEL[perfil.nivel]}</dd>
          </div>
        </dl>
      </header>
      {perfil.recomendadoParaComecar ? (
        <p className={visual.recomendado}>Recomendado para começar</p>
      ) : null}
      <div className={visual.escopoCorpo}>
        <nav aria-label="Partes do escopo" className={visual.partesEscopo}>
          {grupos.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={grupo === item.id}
              onClick={() => setGrupo(item.id)}
            >
              <span aria-hidden="true">{item.icone}</span>
              <span>
                {item.titulo}
                <small>
                  {escopo[item.id].length} {escopo[item.id].length === 1 ? 'item' : 'itens'}
                </small>
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          ))}
        </nav>
        <section className={visual.listaEscopo} aria-label={ativo.titulo}>
          <h3>{ativo.titulo}</h3>
          <ul className={visual.lista} aria-label={ativo.titulo}>
            {escopo[grupo].map((item) => (
              <li key={item}>
                <span className={visual.marcaItem} aria-hidden="true">
                  {ativo.icone}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className={visual.teste}>
        <Target size={24} aria-hidden="true" />
        <div>
          <h3>Primeiro teste</h3>
          <p>{perfil.primeiraProva}</p>
        </div>
      </div>
    </section>
  );
}

export function ArtefatosEntregaProjeto({ artefatos }: { artefatos: Artefatos }) {
  return (
    <section className={styles.artefatos} aria-labelledby="artefatos-titulo">
      <header>
        <p>Documentos do cliente</p>
        <h3 id="artefatos-titulo">Arquivos da entrega</h3>
      </header>
      <ol>
        {artefatos.map((artefato, indice) => (
          <li key={artefato.titulo}>
            <span>{String(indice + 1).padStart(2, '0')}</span>
            <div>
              <h4>{artefato.titulo}</h4>
              <p>{artefato.descricao}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
