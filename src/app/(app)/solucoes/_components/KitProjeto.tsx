import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Layers3 } from 'lucide-react';
import type { DadosRoteiroProjeto, ItemSolucao } from '@/lib/conteudo/queries';
import type { ContextoRotaComercialProjeto } from '@/lib/projetos/rota-comercial-modelo';
import { ArtefatosEntregaProjeto, FichaCampoProjeto } from './EscopoProjeto';
import { Ferramentas, Prompts } from './KitSolucao';
import { RotaComercialProjeto } from './RotaComercialProjeto';
import styles from './ProjetoGuiadoNovo.module.css';

export function KitProjeto({
  slug,
  titulo,
  projeto,
  ferramentas,
  prompts,
  rotaComercial,
  direto = false,
}: {
  slug: string;
  titulo: string;
  projeto: DadosRoteiroProjeto;
  ferramentas: ItemSolucao[];
  prompts: ItemSolucao[];
  rotaComercial: ContextoRotaComercialProjeto;
  direto?: boolean;
}) {
  const roteiro = projeto.roteiro;
  const destinoCrm = `/vendas?novo=projeto&projeto=${encodeURIComponent(titulo)}&projetoSlug=${encodeURIComponent(slug)}`;
  const conteudo = (
    <div className={styles.kitCorpo}>
      <section className={styles.resumoProjeto} aria-label="Resumo do projeto">
        <div>
          <span>Cliente ideal</span>
          <p>{projeto.clienteIdeal}</p>
        </div>
        <div>
          <span>Entrega final</span>
          <p>{projeto.entregavelFinal}</p>
        </div>
      </section>
      {roteiro.perfil && roteiro.escopo ? (
        <FichaCampoProjeto perfil={roteiro.perfil} escopo={roteiro.escopo} />
      ) : null}
      {roteiro.fundamentos.length > 0 ? (
        <section className={styles.fundamentos} aria-labelledby="fundamentos-projeto">
          <header>
            <p>Antes de executar</p>
            <h2 id="fundamentos-projeto">Regras que protegem este projeto</h2>
          </header>
          <ol>
            {roteiro.fundamentos.map((fundamento, indice) => (
              <li key={fundamento.titulo}>
                <span>{String(indice + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{fundamento.titulo}</h3>
                  <p>{fundamento.descricao}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {roteiro.artefatosEntrega ? (
        <ArtefatosEntregaProjeto artefatos={roteiro.artefatosEntrega} />
      ) : null}
      <div className={styles.kitFerramentas}>
        <Ferramentas itens={ferramentas} />
        <Prompts itens={prompts} />
      </div>
      <RotaComercialProjeto
        slug={slug}
        titulo={titulo}
        contexto={rotaComercial}
        destinoNovoLead={destinoCrm}
      />
      <section className={styles.estudio}>
        <Layers3 size={18} aria-hidden="true" />
        <div>
          <strong>Precisa adaptar o projeto?</strong>
          <p>Use esta estrutura como base e ajuste o escopo no Estúdio.</p>
        </div>
        <Link href={`/builder?projeto=${encodeURIComponent(slug)}`}>
          Personalizar no Estúdio <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );

  if (direto) {
    return (
      <section
        id="kit-projeto"
        className={`${styles.kitProjeto} ${styles.kitProjetoDireto}`}
        aria-label="Materiais do projeto"
      >
        {conteudo}
      </section>
    );
  }

  return (
    <details id="kit-projeto" className={styles.kitProjeto}>
      <summary>
        <span>
          <small>Consulta e aplicação</small>Escopo, arquivos e uso comercial
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      {conteudo}
    </details>
  );
}
