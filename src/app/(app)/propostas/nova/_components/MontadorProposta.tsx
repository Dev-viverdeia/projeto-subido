'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { unstable_rethrow } from 'next/navigation';
import { ArrowRight, Check, ChevronDown, ContactRound } from 'lucide-react';
import { Button } from '@/design-system/via';
import { AtalhoGuia } from '@/components/suporte/AtalhoGuia';
import { AjudaNaFalha } from '@/components/suporte/AjudaNaFalha';
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
  conexao:
    'Não foi possível confirmar a criação. Confira a Biblioteca comercial antes de tentar novamente.',
};

export function MontadorProposta(props: Props) {
  const [falha, setFalha] = useState<string | null>(null);
  async function criar(form: FormData) {
    setFalha(null);
    try {
      await criarProposta(form);
    } catch (erro) {
      unstable_rethrow(erro);
      setFalha('conexao');
    }
  }
  return (
    <>
      <form
        action={criar}
        onReset={(evento) => evento.preventDefault()}
        className={styles.formulario}
      >
        <CamposProposta {...props} erro={falha ?? props.erro} />
      </form>
      <AtalhoGuia slug="criar-proposta-sem-reuniao">Como criar uma proposta</AtalhoGuia>
    </>
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
  const campos = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    if (erro) campos.current?.querySelector<HTMLElement>('[data-ajuda-falha]')?.focus();
  }, [erro]);
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
      <fieldset ref={campos} className={styles.campos} disabled={pending} aria-busy={pending}>
        <legend className="sr-only">Dados da proposta</legend>
        <input type="hidden" name="reuniao" value={reuniao} />

        {erro ? (
          <AjudaNaFalha
            contexto="proposta"
            titulo={erro === 'conexao' ? 'Confira se o rascunho foi criado' : 'Revise a proposta'}
            descricao={ERROS[erro] ?? ERROS.campos}
            acao={
              erro === 'conexao' ? (
                <a href="/propostas" target="_blank" rel="noopener noreferrer">
                  Ver propostas
                </a>
              ) : undefined
            }
          />
        ) : null}

        {!opcoes.oportunidades.length ? (
          <div className={styles.semOpcao}>
            <ContactRound size={24} aria-hidden="true" />
            <h2>Para quem é a proposta?</h2>
            <p>Adicione o cliente em Vendas para começar.</p>
            <Link href="/vendas?nova=1">
              Adicionar cliente <ArrowRight size={16} aria-hidden="true" />
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
                <span>Cliente</span>
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
          <p>Reunião opcional. O rascunho não será enviado ao cliente.</p>
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
