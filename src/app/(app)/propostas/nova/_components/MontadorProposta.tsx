'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CircleAlert,
  ContactRound,
  DraftingCompass,
  Video,
} from 'lucide-react';
import { criarProposta } from '@/lib/propostas/actions';
import type { OpcoesNovaProposta } from '@/lib/propostas/queries';
import { sugerirProjetoBase } from '@/lib/propostas/sugestao';
import styles from '../pagina.module.css';

export type ContextoCallNovaProposta = {
  titulo: string;
  resumo: string;
  decisoes: number;
  compromissos: number;
  pontosAValidar: number;
  oportunidadesProjeto: string[];
};

export function MontadorProposta({
  opcoes,
  oportunidadeInicial,
  origemInicial,
  reuniaoInicial,
  contextoCall,
  erro,
}: {
  opcoes: OpcoesNovaProposta;
  oportunidadeInicial: string;
  origemInicial: string;
  reuniaoInicial: string;
  contextoCall?: ContextoCallNovaProposta | null;
  erro: string | null;
}) {
  const [passo, setPasso] = useState(oportunidadeInicial ? 2 : 1);
  const [oportunidade, setOportunidade] = useState(oportunidadeInicial);
  const [origem, setOrigem] = useState(origemInicial);

  const leadEscolhido = useMemo(
    () => opcoes.oportunidades.find((item) => item.id === oportunidade) ?? null,
    [opcoes.oportunidades, oportunidade],
  );
  const contextoCallAtivo = oportunidade === oportunidadeInicial ? contextoCall : null;
  const origemSugerida = useMemo(
    () =>
      leadEscolhido
        ? sugerirProjetoBase(
            [leadEscolhido.titulo, ...(contextoCallAtivo?.oportunidadesProjeto ?? [])].join(' '),
            opcoes.projetos,
          )
        : null,
    [contextoCallAtivo?.oportunidadesProjeto, leadEscolhido, opcoes.projetos],
  );
  const origemSelecionada = origem || origemSugerida || '';
  const projetoSugerido = origemSugerida
    ? opcoes.projetos.find((projeto) => `projeto:${projeto.slug}` === origemSugerida)
    : null;

  return (
    <form action={criarProposta} className={styles.formulario}>
      <input type="hidden" name="reuniao" value={reuniaoInicial} />

      <ol className={styles.progresso} aria-label="Etapas para montar a proposta">
        {['Cliente', 'Projeto'].map((rotulo, indice) => {
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
        })}
      </ol>

      {erro === 'descoberta' ? (
        <div className={styles.erroGuia} role="alert">
          <span className={styles.erroIcone} aria-hidden="true">
            <Video size={19} strokeWidth={1.8} />
          </span>
          <div>
            <strong>Conclua a descoberta antes de criar a proposta.</strong>
            <p>
              A conversa confirma o problema, o impacto e quem decide. Assim o rascunho nasce com
              fatos do cliente, não com suposições.
            </p>
          </div>
          {oportunidadeInicial && (
            <Link
              href={`/reunioes?nova=1&oportunidade=${oportunidadeInicial}`}
              className={styles.erroAcao}
            >
              Agendar descoberta <ArrowRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      ) : erro ? (
        <p className={styles.erro} role="alert">
          Não foi possível criar com essa combinação. Revise as escolhas e tente novamente.
        </p>
      ) : null}

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
              <p>Cliente</p>
              <h2 id="proposta-contexto">Para quem é a proposta?</h2>
            </div>
          </div>

          {opcoes.oportunidades.length ? (
            <label className={styles.campo}>
              <span>Cliente em negociação</span>
              <select
                name="oportunidade"
                value={oportunidade}
                onChange={(evento) => {
                  setOportunidade(evento.target.value);
                  setOrigem('');
                }}
                required
              >
                <option value="" disabled>
                  Escolha um cliente
                </option>
                {opcoes.oportunidades.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.empresa} · {item.titulo}
                  </option>
                ))}
              </select>
              <small>Empresa, contato, anotações e valor negociado entram no rascunho.</small>
              {reuniaoInicial && (
                <div className={styles.contextosConectados}>
                  <span>Reunião conectada ao documento</span>
                </div>
              )}
            </label>
          ) : (
            <div className={styles.semOpcao}>
              <p>Você ainda não tem uma descoberta concluída para transformar em proposta.</p>
              <Link href="/reunioes">Ver reuniões</Link>
            </div>
          )}
        </div>
      </section>

      <section className={styles.etapa} hidden={passo !== 2} aria-labelledby="proposta-projeto">
        <span className={styles.numero} aria-hidden="true">
          02
        </span>
        <div className={styles.etapaCorpo}>
          {leadEscolhido && contextoCallAtivo ? (
            <article className={styles.contextoCall} aria-label="Dados aproveitados da reunião">
              <header>
                <span className={styles.iconeContexto}>
                  <Video size={18} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div>
                  <p>Dados da reunião</p>
                  <strong>{leadEscolhido.empresa}</strong>
                  <small>{contextoCallAtivo.titulo}</small>
                </div>
                <span className={styles.confirmado}>
                  <Check size={13} strokeWidth={2.4} aria-hidden="true" /> Análise concluída
                </span>
              </header>
              <p className={styles.resumoCall}>{contextoCallAtivo.resumo}</p>
              <dl>
                <div>
                  <dt>{contextoCallAtivo.decisoes}</dt>
                  <dd>decisões</dd>
                </div>
                <div>
                  <dt>{contextoCallAtivo.compromissos}</dt>
                  <dd>combinados</dd>
                </div>
                <div>
                  <dt>{contextoCallAtivo.pontosAValidar}</dt>
                  <dd>pontos a validar</dd>
                </div>
              </dl>
              <footer>
                <CircleAlert size={15} strokeWidth={1.8} aria-hidden="true" />O rascunho usa somente
                fatos confirmados e separa o que ainda precisa de validação.
              </footer>
            </article>
          ) : leadEscolhido ? (
            <div className={styles.contextoEscolhido}>
              <span>Cliente selecionado</span>
              <strong>{leadEscolhido.empresa}</strong>
              <small>{leadEscolhido.titulo}</small>
            </div>
          ) : null}

          <div className={styles.etapaTitulo}>
            <span>
              <BriefcaseBusiness size={19} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div>
              <p>Projeto</p>
              <h2 id="proposta-projeto">Qual projeto você vai apresentar?</h2>
            </div>
          </div>

          <label className={styles.campo}>
            <span>Projeto-base</span>
            <select
              name="origem"
              value={origemSelecionada}
              onChange={(evento) => setOrigem(evento.target.value)}
              required
            >
              <option value="" disabled>
                Escolha um projeto
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
            {projetoSugerido && !origem ? (
              <small className={styles.recomendacao}>
                <Check size={13} strokeWidth={2.2} aria-hidden="true" /> Recomendado pelos dados
                {contextoCallAtivo ? ' da reunião' : ' do cliente'}. Você pode trocar antes de
                criar.
              </small>
            ) : (
              <small>Escopo, entregáveis e cronograma serão preenchidos para você revisar.</small>
            )}
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
            {passo === 1 ? 'Escolha o cliente em negociação' : 'Depois de criar, revise o rascunho'}
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
              Escolher projeto <ArrowRight size={17} aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" className={styles.continuar} disabled={!origemSelecionada}>
              Criar rascunho <ArrowRight size={17} aria-hidden="true" />
            </button>
          )}
        </div>
      </footer>
    </form>
  );
}
