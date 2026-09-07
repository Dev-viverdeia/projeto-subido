'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Layers3 } from 'lucide-react';
import type { DadosRoteiroProjeto, ItemSolucao } from '@/lib/conteudo/queries';
import type { ContextoRotaComercialProjeto } from '@/lib/projetos/rota-comercial-modelo';
import { ArtefatosEntregaProjeto, FichaCampoProjeto } from './EscopoProjeto';
import { Ferramentas, Prompts } from './KitSolucao';
import { RotaComercialProjeto } from './RotaComercialProjeto';
import styles from './ProjetoGuiadoNovo.module.css';
import visual from './LeituraProjeto.module.css';

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
  const [area, setArea] = useState('escopo');
  const roteiro = projeto.roteiro;
  const destinoCrm = `/vendas?novo=projeto&projeto=${encodeURIComponent(titulo)}&projetoSlug=${encodeURIComponent(slug)}`;
  const conteudo = (
    <div className={styles.kitCorpo}>
      <nav className={visual.areasKit} aria-label="Consultar materiais">
        {[
          { id: 'escopo', titulo: 'Escopo' },
          { id: 'arquivos', titulo: 'Arquivos e ferramentas' },
          { id: 'cliente', titulo: 'Aplicar no cliente' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={area === item.id}
            onClick={() => setArea(item.id)}
          >
            {item.titulo}
          </button>
        ))}
      </nav>
      {area === 'escopo' ? (
        <>
          <section className={styles.resumoProjeto} aria-label="Resumo do projeto">
            <details>
              <summary>
                Cliente ideal
                <ChevronDown size={17} aria-hidden="true" />
              </summary>
              <p>{projeto.clienteIdeal}</p>
            </details>
            <details>
              <summary>
                Entrega final
                <ChevronDown size={17} aria-hidden="true" />
              </summary>
              <p>{projeto.entregavelFinal}</p>
            </details>
          </section>
          {roteiro.perfil && roteiro.escopo ? (
            <FichaCampoProjeto perfil={roteiro.perfil} escopo={roteiro.escopo} />
          ) : null}
          {roteiro.fundamentos.length > 0 ? (
            <section className={styles.fundamentos} aria-labelledby="fundamentos-projeto">
              <header>
                <h2 id="fundamentos-projeto">Cuidados do projeto</h2>
              </header>
              <ol>
                {roteiro.fundamentos.map((fundamento) => (
                  <li key={fundamento.titulo}>
                    <details>
                      <summary>
                        {fundamento.titulo}
                        <ChevronDown size={17} aria-hidden="true" />
                      </summary>
                      <p>{fundamento.descricao}</p>
                    </details>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </>
      ) : null}
      {area === 'arquivos' ? (
        <>
          {roteiro.artefatosEntrega ? (
            <ArtefatosEntregaProjeto artefatos={roteiro.artefatosEntrega} />
          ) : null}
          <div className={styles.kitFerramentas}>
            <Ferramentas itens={ferramentas} />
            <Prompts itens={prompts} />
          </div>
        </>
      ) : null}
      {area === 'cliente' ? (
        <>
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
        </>
      ) : null}
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
