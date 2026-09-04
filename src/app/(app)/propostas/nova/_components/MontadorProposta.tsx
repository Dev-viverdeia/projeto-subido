'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, ContactRound, Video } from 'lucide-react';
import { Button } from '@/design-system/via';
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

type Props = {
  opcoes: OpcoesNovaProposta;
  oportunidadeInicial: string;
  origemInicial: string;
  reuniaoInicial: string;
  contextoCall?: ContextoCallNovaProposta | null;
  erro: string | null;
};

const ERROS: Record<string, string> = {
  campos: 'Revise o cliente e o projeto para continuar.',
  indisponivel: 'Este cliente ou projeto não está mais disponível. Escolha outro para continuar.',
  salvar: 'Não foi possível salvar. Suas escolhas foram mantidas; tente novamente.',
  reuniao: 'Esta reunião não está disponível para o cliente escolhido. Revise antes de continuar.',
};

export function MontadorProposta(props: Props) {
  return (
    <form action={criarProposta} className={styles.formulario}>
      <CamposProposta {...props} />
    </form>
  );
}

function CamposProposta({
  opcoes,
  oportunidadeInicial,
  origemInicial,
  reuniaoInicial,
  contextoCall,
  erro,
}: Props) {
  const { pending } = useFormStatus();
  const [oportunidade, setOportunidade] = useState(oportunidadeInicial);
  const [origem, setOrigem] = useState(origemInicial);
  const [editarCliente, setEditarCliente] = useState(
    !opcoes.oportunidades.some((item) => item.id === oportunidadeInicial),
  );
  const lead = opcoes.oportunidades.find((item) => item.id === oportunidade);
  const contexto = oportunidade === oportunidadeInicial ? contextoCall : null;
  const reuniao = oportunidade === oportunidadeInicial ? reuniaoInicial : '';
  const sugestao = lead
    ? sugerirProjetoBase(
        [lead.titulo, ...(contexto?.oportunidadesProjeto ?? [])].join(' '),
        opcoes.projetos,
      )
    : null;
  const origemSelecionada = origem || sugestao || '';
  const podeCriar = Boolean(lead && origemSelecionada);

  return (
    <>
      <fieldset className={styles.campos} disabled={pending} aria-busy={pending}>
        <legend className="sr-only">Dados da proposta</legend>
        <input type="hidden" name="reuniao" value={reuniao} />

        {erro === 'descoberta' ? (
          <div className={styles.erro} role="alert">
            <strong>Conclua a descoberta antes de criar a proposta.</strong>
            {oportunidadeInicial && (
              <Link href={`/reunioes?nova=1&oportunidade=${oportunidadeInicial}`}>
                Agendar descoberta <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>
        ) : erro ? (
          <p className={styles.erro} role="alert">
            {ERROS[erro] ?? ERROS.campos}
          </p>
        ) : null}

        {!opcoes.oportunidades.length ? (
          <div className={styles.semOpcao}>
            <Video size={24} aria-hidden="true" />
            <h2>Comece pela descoberta</h2>
            <p>Conclua uma reunião com o cliente para preparar sua proposta.</p>
            <Link href="/reunioes">
              Ver reuniões <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            {lead && !editarCliente ? (
              <div className={styles.cliente}>
                <span className={styles.iconeCliente}>
                  <ContactRound size={22} aria-hidden="true" />
                </span>
                <div>
                  <span>Proposta para</span>
                  <h2>{lead.empresa}</h2>
                  {lead.contato && <p>{lead.contato}</p>}
                </div>
                <button
                  type="button"
                  className={styles.trocar}
                  onClick={() => setEditarCliente(true)}
                >
                  Trocar cliente
                </button>
                <input type="hidden" name="oportunidade" value={oportunidade} />
              </div>
            ) : (
              <label className={styles.campo}>
                <span>Cliente em negociação</span>
                <select
                  name="oportunidade"
                  value={lead ? oportunidade : ''}
                  required
                  onChange={(evento) => {
                    setOportunidade(evento.target.value);
                    setOrigem('');
                  }}
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
              </label>
            )}

            {contexto && lead && (
              <details className={styles.reuniao}>
                <summary>
                  <span className={styles.iconeReuniao}>
                    <Check size={17} aria-hidden="true" />
                  </span>
                  <span>
                    Dados da reunião incluídos<small>Ver resumo</small>
                  </span>
                  <ChevronDown size={18} className={styles.chevron} aria-hidden="true" />
                </summary>
                <div>
                  <strong>{contexto.titulo}</strong>
                  <p>{contexto.resumo}</p>
                </div>
              </details>
            )}

            <label className={styles.campo}>
              <span>Projeto-base</span>
              <select
                name="origem"
                value={origemSelecionada}
                onChange={(evento) => setOrigem(evento.target.value)}
                required
                disabled={!lead}
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
              <small>
                {sugestao && !origem
                  ? `Sugerido pelos dados ${contexto ? 'da reunião' : 'do cliente'}. Você pode trocar.`
                  : 'Escopo e entregáveis entram no rascunho para você revisar.'}
              </small>
            </label>
          </>
        )}
      </fieldset>

      {opcoes.oportunidades.length > 0 && (
        <footer className={styles.rodape}>
          <p>Nada será enviado ao cliente agora.</p>
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            disabled={!podeCriar || pending}
            iconRight={!pending ? <ArrowRight size={17} aria-hidden="true" /> : undefined}
          >
            {pending ? 'Preparando rascunho' : 'Criar rascunho'}
          </Button>
        </footer>
      )}
    </>
  );
}
