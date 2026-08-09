'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ContactRound,
  DraftingCompass,
} from 'lucide-react';
import { criarProposta } from '@/lib/propostas/actions';
import type { OpcoesNovaProposta } from '@/lib/propostas/queries';
import styles from '../pagina.module.css';

export function MontadorProposta({
  opcoes,
  oportunidadeInicial,
  origemInicial,
  reuniaoInicial,
  diagnosticoInicial,
  erro,
}: {
  opcoes: OpcoesNovaProposta;
  oportunidadeInicial: string;
  origemInicial: string;
  reuniaoInicial: string;
  diagnosticoInicial: string;
  erro: boolean;
}) {
  const [passo, setPasso] = useState(oportunidadeInicial ? 2 : 1);
  const [oportunidade, setOportunidade] = useState(oportunidadeInicial);
  const [origem, setOrigem] = useState(origemInicial);

  const leadEscolhido = useMemo(
    () => opcoes.oportunidades.find((item) => item.id === oportunidade) ?? null,
    [opcoes.oportunidades, oportunidade],
  );

  return (
    <form action={criarProposta} className={styles.formulario}>
      <input type="hidden" name="reuniao" value={reuniaoInicial} />
      <input type="hidden" name="diagnostico" value={diagnosticoInicial} />

      <ol className={styles.progresso} aria-label="Etapas para montar a proposta">
        {['Contexto comercial', 'Estrutura de entrega', 'Revisar documento'].map(
          (rotulo, indice) => {
            const numero = indice + 1;
            const concluido = numero < passo;
            const ativo = numero === passo;

            return (
              <li
                key={rotulo}
                data-ativo={ativo || undefined}
                data-concluido={concluido || undefined}
              >
                <span>{concluido ? <Check size={13} strokeWidth={2.6} /> : numero}</span>
                <strong>{rotulo}</strong>
              </li>
            );
          },
        )}
      </ol>

      {erro && (
        <p className={styles.erro} role="alert">
          Não foi possível criar com essa combinação. Revise as escolhas e tente novamente.
        </p>
      )}

      <section className={styles.etapa} hidden={passo !== 1} aria-labelledby="proposta-contexto">
        <span className={styles.numero} aria-hidden="true">
          01
        </span>
        <div className={styles.etapaCorpo}>
          <div className={styles.etapaTitulo}>
            <span>
              <ContactRound size={19} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div>
              <p>Contexto comercial</p>
              <h2 id="proposta-contexto">Para quem é a proposta?</h2>
            </div>
          </div>

          {opcoes.oportunidades.length ? (
            <label className={styles.campo}>
              <span>Lead do CRM</span>
              <select
                name="oportunidade"
                value={oportunidade}
                onChange={(evento) => setOportunidade(evento.target.value)}
                required
              >
                <option value="" disabled>
                  Escolha uma oportunidade
                </option>
                {opcoes.oportunidades.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.empresa} · {item.titulo}
                  </option>
                ))}
              </select>
              <small>Empresa, contato, fatos e valor negociado entram no rascunho.</small>
              {(reuniaoInicial || diagnosticoInicial) && (
                <div className={styles.contextosConectados}>
                  {reuniaoInicial && <span>Call conectada ao documento</span>}
                  {diagnosticoInicial && <span>Diagnóstico conectado ao documento</span>}
                </div>
              )}
            </label>
          ) : (
            <div className={styles.semOpcao}>
              <p>Você ainda não tem oportunidades abertas no CRM.</p>
              <Link href="/crm">Adicionar um lead</Link>
            </div>
          )}
        </div>
      </section>

      <section className={styles.etapa} hidden={passo !== 2} aria-labelledby="proposta-projeto">
        <span className={styles.numero} aria-hidden="true">
          02
        </span>
        <div className={styles.etapaCorpo}>
          {leadEscolhido && (
            <div className={styles.contextoEscolhido}>
              <span>Contexto selecionado</span>
              <strong>{leadEscolhido.empresa}</strong>
              <small>{leadEscolhido.titulo}</small>
            </div>
          )}

          <div className={styles.etapaTitulo}>
            <span>
              <BriefcaseBusiness size={19} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div>
              <p>Estrutura de entrega</p>
              <h2 id="proposta-projeto">Qual Projeto será apresentado?</h2>
            </div>
          </div>

          <label className={styles.campo}>
            <span>Projeto-base</span>
            <select
              name="origem"
              value={origem}
              onChange={(evento) => setOrigem(evento.target.value)}
              required
            >
              <option value="" disabled>
                Escolha o ponto de partida
              </option>
              {opcoes.projetos.length > 0 && (
                <optgroup label="Projetos da plataforma">
                  {opcoes.projetos.map((projeto) => (
                    <option value={`projeto:${projeto.slug}`} key={projeto.id}>
                      {projeto.titulo}
                    </option>
                  ))}
                </optgroup>
              )}
              {opcoes.projetosEstudio.length > 0 && (
                <optgroup label="Seus projetos no Estúdio">
                  {opcoes.projetosEstudio.map((projeto) => (
                    <option value={`estudio:${projeto.id}`} key={projeto.id}>
                      {projeto.titulo}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="sem-base">Começar sem um projeto-base</option>
            </select>
            <small>Escopo, entregáveis e cronograma serão preenchidos para você revisar.</small>
          </label>

          <div className={styles.origens}>
            <span>
              <BriefcaseBusiness size={15} aria-hidden="true" /> Projeto passo a passo
            </span>
            <span>
              <DraftingCompass size={15} aria-hidden="true" /> Projeto do Estúdio
            </span>
          </div>
        </div>
      </section>

      <footer className={styles.rodape}>
        <div>
          <span>Decisão {passo} de 2</span>
          <strong>
            {passo === 1
              ? 'Escolha o contexto que alimentará a proposta'
              : 'O próximo passo é revisar cada palavra'}
          </strong>
        </div>
        <div className={styles.rodapeAcoes}>
          {passo === 2 && (
            <button type="button" className={styles.voltarEtapa} onClick={() => setPasso(1)}>
              <ArrowLeft size={15} aria-hidden="true" /> Voltar
            </button>
          )}
          {passo === 1 ? (
            <button
              type="button"
              className={styles.continuar}
              disabled={!oportunidade}
              onClick={() => setPasso(2)}
            >
              Continuar <ArrowRight size={17} aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" className={styles.continuar} disabled={!origem}>
              Montar proposta <ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      </footer>
    </form>
  );
}
