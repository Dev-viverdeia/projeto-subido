'use client';

import { useActionState, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardCheck,
  KeyRound,
  PencilLine,
  Save,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';
import {
  salvarBriefingKickoff,
  type EstadoBriefingKickoff,
} from '@/lib/projetos-execucao/briefing-actions';
import type {
  BriefingKickoff as DadosBriefing,
  OrigemBriefingKickoff,
} from '@/lib/projetos-execucao/briefing';
import styles from './BriefingKickoff.module.css';

const INICIAL: EstadoBriefingKickoff = {};

const ROTULO_ORIGEM: Record<OrigemBriefingKickoff, string> = {
  proposta: 'Iniciado pela proposta',
  kickoff: 'Extraído do kickoff',
  salvo: 'Revisado por você',
};

function listaParaTexto(itens: string[]): string {
  return itens.join('\n');
}

export function BriefingKickoff({
  projetoId,
  briefing,
  origem,
}: {
  projetoId: string;
  briefing: DadosBriefing;
  origem: OrigemBriefingKickoff;
}) {
  const confirmado = Boolean(briefing.confirmadoEm);
  const [editando, setEditando] = useState(!confirmado);
  const [estado, acao, pendente] = useActionState(
    async (estadoAnterior: EstadoBriefingKickoff, formData: FormData) => {
      const resultado = await salvarBriefingKickoff(estadoAnterior, formData);
      if (resultado.confirmado) setEditando(false);
      return resultado;
    },
    INICIAL,
  );
  const preenchidas = useMemo(
    () =>
      [
        briefing.objetivo,
        briefing.criterioSucesso,
        briefing.responsavelCliente && briefing.responsavelTecnico,
        briefing.acessos.length,
        briefing.limites.length,
        briefing.proximosPassos.length,
      ].filter(Boolean).length,
    [briefing],
  );

  if (confirmado && !editando) {
    return (
      <section
        id="briefing-kickoff"
        className={styles.briefing}
        data-confirmado
        aria-labelledby="briefing-titulo"
      >
        <header className={styles.cabecalhoResumo}>
          <span className={styles.iconePrincipal}>
            <BadgeCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <p>Acordo operacional</p>
            <h2 id="briefing-titulo">O projeto começa com o combinado claro.</h2>
          </div>
          <span className={styles.estadoConfirmado}>
            <Check size={13} aria-hidden="true" /> Confirmado
          </span>
        </header>

        <div className={styles.resumoConfirmado}>
          <div className={styles.objetivoResumo}>
            <span>Objetivo</span>
            <strong>{briefing.objetivo}</strong>
            <small>Sucesso: {briefing.criterioSucesso}</small>
          </div>
          <dl>
            <div>
              <dt>Cliente</dt>
              <dd>{briefing.responsavelCliente}</dd>
            </div>
            <div>
              <dt>Implementação</dt>
              <dd>{briefing.responsavelTecnico}</dd>
            </div>
            <div>
              <dt>Preparação</dt>
              <dd>
                {briefing.acessos.length} acessos · {briefing.limites.length} limites
              </dd>
            </div>
          </dl>
        </div>

        <div className={styles.rodapeResumo}>
          <span>{ROTULO_ORIGEM[origem]}</span>
          <button type="button" onClick={() => setEditando(true)}>
            <PencilLine size={14} aria-hidden="true" /> Editar acordo
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="briefing-kickoff" className={styles.briefing} aria-labelledby="briefing-titulo">
      <header className={styles.cabecalho}>
        <div className={styles.tituloGrupo}>
          <span className={styles.iconePrincipal}>
            <ClipboardCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <p>Acordo operacional</p>
            <h2 id="briefing-titulo">Confirme o que precisa estar claro antes de construir.</h2>
            <span>
              A proposta inicia o contexto. O kickoff completa os fatos e você aprova o combinado.
            </span>
          </div>
        </div>
        <div className={styles.progresso} aria-label={`${preenchidas} de 6 decisões preenchidas`}>
          <strong>{preenchidas}/6</strong>
          <span>decisões prontas</span>
          <div aria-hidden="true">
            <i style={{ transform: `scaleX(${preenchidas / 6})` }} />
          </div>
        </div>
      </header>

      <form action={acao} className={styles.formulario}>
        <input type="hidden" name="projeto" value={projetoId} />
        <input type="hidden" name="fonteCallId" value={briefing.fonteCallId ?? ''} />

        <fieldset className={styles.blocoPrincipal}>
          <legend>
            <span>01</span>
            <div>
              <strong>Direção do projeto</strong>
              <small>O que muda e como todos reconhecerão que funcionou.</small>
            </div>
          </legend>
          <label>
            Objetivo combinado
            <textarea name="objetivo" rows={3} defaultValue={briefing.objetivo} required />
          </label>
          <label>
            Critério de sucesso
            <textarea
              name="criterioSucesso"
              rows={3}
              defaultValue={briefing.criterioSucesso}
              placeholder="Ex.: 90% dos contatos recebem a primeira resposta em até 1 minuto."
              required
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>
            <span>02</span>
            <div>
              <strong>Quem decide e quem executa</strong>
              <small>Uma pessoa de cada lado, sem responsabilidade difusa.</small>
            </div>
          </legend>
          <div className={styles.duasColunas}>
            <label>
              Responsável do cliente
              <input
                name="responsavelCliente"
                defaultValue={briefing.responsavelCliente}
                placeholder="Nome e função"
                required
              />
            </label>
            <label>
              Responsável pela implementação
              <input
                name="responsavelTecnico"
                defaultValue={briefing.responsavelTecnico}
                placeholder="Quem conduz a entrega"
                required
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <span>03</span>
            <div>
              <strong>Condições para executar</strong>
              <small>Um item por linha. Registre permissões e limites, nunca credenciais.</small>
            </div>
          </legend>
          <div className={styles.duasColunas}>
            <label>
              Acessos e permissões necessários
              <textarea
                name="acessos"
                rows={5}
                defaultValue={listaParaTexto(briefing.acessos)}
                placeholder={
                  'WhatsApp Business · liberar por Camila\nAgenda da recepção · acesso de leitura'
                }
                required
              />
            </label>
            <label>
              Limites e fora de escopo
              <textarea
                name="limites"
                rows={5}
                defaultValue={listaParaTexto(briefing.limites)}
                placeholder={
                  'A IA não responde dúvidas clínicas\nCasos urgentes seguem para a recepção'
                }
                required
              />
            </label>
          </div>
          <div className={styles.avisoSeguranca}>
            <KeyRound size={15} aria-hidden="true" />
            <span>Senhas, tokens e chaves nunca devem ser salvos neste campo.</span>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <span>04</span>
            <div>
              <strong>Saída do kickoff</strong>
              <small>Os primeiros movimentos que colocam a entrega em andamento.</small>
            </div>
          </legend>
          <label>
            Próximos passos
            <textarea
              name="proximosPassos"
              rows={4}
              defaultValue={listaParaTexto(briefing.proximosPassos)}
              placeholder={
                'Cliente libera os acessos até sexta-feira\nImplementador entrega o mapa inicial na terça-feira'
              }
              required
            />
          </label>
          <label>
            Observações internas <span>Opcional</span>
            <textarea name="observacoes" rows={3} defaultValue={briefing.observacoes} />
          </label>
        </fieldset>

        <footer className={styles.acoes}>
          <div>
            <span>
              <Sparkles size={13} aria-hidden="true" /> {ROTULO_ORIGEM[origem]}
            </span>
            <small>A confirmação libera o portal; qualquer edição pede nova confirmação.</small>
          </div>
          <div>
            {confirmado && (
              <button type="button" className={styles.cancelar} onClick={() => setEditando(false)}>
                Cancelar
              </button>
            )}
            <button type="submit" name="operacao" value="salvar" disabled={pendente}>
              <Save size={15} aria-hidden="true" /> Salvar rascunho
            </button>
            <button
              type="submit"
              name="operacao"
              value="confirmar"
              className={styles.confirmar}
              disabled={pendente}
            >
              <UserRoundCheck size={15} aria-hidden="true" />
              {pendente ? 'Salvando…' : 'Confirmar briefing'}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </footer>

        {estado.erro && (
          <p className={styles.retorno} role="alert">
            {estado.erro}
          </p>
        )}
        {estado.sucesso && (
          <p className={styles.retorno} role="status">
            {estado.sucesso}
          </p>
        )}
      </form>
    </section>
  );
}
