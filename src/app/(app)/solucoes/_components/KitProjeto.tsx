'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarCheck,
  ChevronDown,
  ClipboardCheck,
  Database,
  KeyRound,
  Layers3,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { DadosRoteiroProjeto, ItemSolucao } from '@/lib/conteudo/queries';
import type { ContextoRotaComercialProjeto } from '@/lib/projetos/rota-comercial-modelo';
import { ArtefatosEntregaProjeto, FichaCampoProjeto } from './EscopoProjeto';
import { Ferramentas } from './KitSolucao';
import { RotaComercialProjeto } from './RotaComercialProjeto';
import { resumirRequisito } from '@/lib/projetos/kit-visual';
import { MaterialProjeto } from './MaterialProjeto';
import styles from './ProjetoGuiadoNovo.module.css';
import visual from './LeituraProjeto.module.css';
import kit from './PreRequisitosMateriais.module.css';

export type AreaKitProjeto = 'preparar' | 'arquivos' | 'cliente';

export function KitProjeto({
  slug,
  titulo,
  projeto,
  ferramentas,
  prompts,
  rotaComercial,
  area,
  aoMudarArea,
  direto = false,
}: {
  slug: string;
  titulo: string;
  projeto: DadosRoteiroProjeto;
  ferramentas: ItemSolucao[];
  prompts: ItemSolucao[];
  rotaComercial: ContextoRotaComercialProjeto;
  area: AreaKitProjeto;
  aoMudarArea: (area: AreaKitProjeto) => void;
  direto?: boolean;
}) {
  const roteiro = projeto.roteiro;
  const destinoCrm = `/vendas?novo=projeto&projeto=${encodeURIComponent(titulo)}&projetoSlug=${encodeURIComponent(slug)}`;
  const conteudo = (
    <div className={styles.kitCorpo}>
      <nav className={visual.areasKit} aria-label="Consultar pré-requisitos e materiais">
        {(
          [
            { id: 'preparar', titulo: 'Antes de começar' },
            { id: 'arquivos', titulo: 'Arquivos e ferramentas' },
            { id: 'cliente', titulo: 'Aplicar no cliente' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={area === item.id}
            onClick={() => aoMudarArea(item.id)}
          >
            {item.titulo}
          </button>
        ))}
      </nav>
      {area === 'preparar' ? (
        <div className={kit.pilha}>
          <div className={kit.preparacao}>
            <section className={kit.requisitos} aria-labelledby="requisitos-projeto">
              <header>
                <div>
                  <h2 id="requisitos-projeto">O que ter em mãos</h2>
                  <p>Confira com o cliente antes de implementar.</p>
                </div>
              </header>
              {roteiro.escopo?.preRequisitos.length ? (
                <ul aria-label="Pré-requisitos do projeto">
                  {roteiro.escopo.preRequisitos.map((item) => {
                    const resumo = resumirRequisito(item);
                    const icone =
                      resumo?.tipo === 'pessoas' ? (
                        <Users size={22} />
                      ) : resumo?.tipo === 'dados' ? (
                        <Database size={22} />
                      ) : resumo?.tipo === 'teste' ? (
                        <CalendarCheck size={22} />
                      ) : resumo?.tipo === 'regra' ? (
                        <ShieldCheck size={22} />
                      ) : (
                        <KeyRound size={22} />
                      );
                    return (
                      <li key={item}>
                        {resumo ? (
                          <details className={kit.requisito}>
                            <summary>
                              <span className={kit.iconeRequisito} aria-hidden="true">
                                {icone}
                              </span>
                              <span>{resumo.titulo}</span>
                              <ChevronDown size={18} aria-hidden="true" />
                            </summary>
                            <p>{item}</p>
                          </details>
                        ) : (
                          <div className={kit.requisitoOriginal}>
                            <span className={kit.iconeRequisito} aria-hidden="true">
                              <ClipboardCheck size={22} />
                            </span>
                            <span>{item}</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Consulte os materiais indicados em cada passo da implementação.</p>
              )}
            </section>
            {roteiro.fundamentos.length > 0 ? (
              <section className={kit.cuidados} aria-labelledby="fundamentos-projeto">
                <header>
                  <h2 id="fundamentos-projeto">Cuidados do projeto</h2>
                </header>
                <ul>
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
                </ul>
              </section>
            ) : null}
          </div>
          {roteiro.perfil && roteiro.escopo ? (
            <details className={kit.consulta}>
              <summary>
                <ShieldCheck size={22} aria-hidden="true" />
                <span>Escopo e limites do projeto</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <div>
                <FichaCampoProjeto perfil={roteiro.perfil} escopo={roteiro.escopo} />
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
      {area === 'arquivos' ? (
        <div className={kit.pilha}>
          <div className={kit.biblioteca}>
            <div className={kit.pilha}>
              {roteiro.trilhaDidatica?.materiais.length ? (
                <section className={kit.modelos} aria-labelledby="modelos-projeto">
                  <header>
                    <h2 id="modelos-projeto">Modelos para usar</h2>
                  </header>
                  <div className={kit.listaModelos}>
                    {roteiro.trilhaDidatica.materiais.map((material) => (
                      <MaterialProjeto key={material.titulo} {...material} />
                    ))}
                  </div>
                </section>
              ) : null}
              {prompts.length ? (
                <section className={kit.modelos} aria-labelledby="prompts-projeto">
                  <h2 id="prompts-projeto">Prompts</h2>
                  <div className={kit.listaModelos}>
                    {prompts.map((prompt) => (
                      <MaterialProjeto
                        key={prompt.id}
                        titulo={prompt.titulo}
                        conteudo={prompt.conteudo}
                        tipo="prompt"
                      />
                    ))}
                  </div>
                </section>
              ) : null}
              {!roteiro.trilhaDidatica?.materiais.length && !prompts.length ? (
                <section className={kit.modelos}>
                  <h2>Modelos para usar</h2>
                  <p className={kit.vazio}>
                    Ainda não há modelos nesta área. Consulte os recursos de cada aula e passo.
                  </p>
                </section>
              ) : null}
            </div>
            <aside className={kit.ferramentas} aria-label="Ferramentas do projeto">
              <Ferramentas itens={ferramentas} comLinks />
            </aside>
          </div>
          {roteiro.artefatosEntrega ? (
            <details className={kit.consulta}>
              <summary>
                <ClipboardCheck size={22} aria-hidden="true" />
                <span>Documentos para entregar ao cliente</span>
                <ChevronDown size={18} aria-hidden="true" />
              </summary>
              <div>
                <ArtefatosEntregaProjeto artefatos={roteiro.artefatosEntrega} />
              </div>
            </details>
          ) : null}
        </div>
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
        aria-label="Pré-requisitos e materiais do projeto"
      >
        {conteudo}
      </section>
    );
  }

  return (
    <details id="kit-projeto" className={styles.kitProjeto}>
      <summary>
        <span>Pré-requisitos e materiais</span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      {conteudo}
    </details>
  );
}
