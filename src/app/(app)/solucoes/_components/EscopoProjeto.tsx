import type { RoteiroProjeto } from '@/lib/projetos/roteiro';
import styles from './ProjetoGuiado.module.css';

const ROTULO_NIVEL = {
  entrada: 'Entrada',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
} as const;

type Perfil = NonNullable<RoteiroProjeto['perfil']>;
type Escopo = NonNullable<RoteiroProjeto['escopo']>;
type Artefatos = NonNullable<RoteiroProjeto['artefatosEntrega']>;

export function FichaCampoProjeto({ perfil, escopo }: { perfil: Perfil; escopo: Escopo }) {
  return (
    <section className={styles.fichaCampo} aria-labelledby="ficha-campo-titulo">
      <header className={styles.fichaCampoCabecalho}>
        <div>
          <p>Antes de vender</p>
          <h2 id="ficha-campo-titulo">O combinado deste projeto</h2>
        </div>
        {perfil.recomendadoParaComecar ? <span>Recomendado para começar</span> : null}
      </header>

      <div className={styles.fichaCampoResumo}>
        <dl className={styles.indicadoresProjeto}>
          <div>
            <dt>Complexidade</dt>
            <dd>{ROTULO_NIVEL[perfil.nivel]}</dd>
          </div>
          <div>
            <dt>Prazo do piloto</dt>
            <dd>{perfil.prazo}</dd>
          </div>
          <div>
            <dt>Formato inicial</dt>
            <dd>{perfil.formatoPiloto}</dd>
          </div>
        </dl>

        <div className={styles.primeiraProva}>
          <span>Primeira prova real</span>
          <p>{perfil.primeiraProva}</p>
        </div>
      </div>

      <div className={styles.escopoProjeto}>
        <ListaEscopo titulo="O piloto inclui" itens={escopo.inclui} />
        <ListaEscopo titulo="O cliente precisa ter" itens={escopo.preRequisitos} />
        <ListaEscopo titulo="Fica fora do piloto" itens={escopo.naoInclui} />
      </div>

      <div className={styles.evolucoesProjeto}>
        <span>Depois de provar</span>
        <p>{escopo.evolucoes.join(' · ')}</p>
      </div>
    </section>
  );
}

function ListaEscopo({ titulo, itens }: { titulo: string; itens: string[] }) {
  return (
    <article>
      <span>{titulo}</span>
      <ul>
        {itens.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

export function ArtefatosEntregaProjeto({ artefatos }: { artefatos: Artefatos }) {
  return (
    <section className={styles.artefatos} aria-labelledby="artefatos-titulo">
      <header>
        <p>Documentos do cliente</p>
        <h3 id="artefatos-titulo">O kit que comprova a entrega</h3>
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
