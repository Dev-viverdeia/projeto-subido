'use client';

import { type FormEvent, useActionState, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardCheck,
  KeyRound,
  PencilLine,
  Save,
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
import {
  ETAPAS_BRIEFING,
  ROTULO_ORIGEM_BRIEFING,
  type EtapaBriefingId,
} from './briefing-kickoff-config';
import styles from './BriefingKickoff.module.css';

const INICIAL: EstadoBriefingKickoff = {};

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
  const [etapa, setEtapa] = useState<EtapaBriefingId>('resultado');
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [estado, acao, pendente] = useActionState(
    async (estadoAnterior: EstadoBriefingKickoff, formData: FormData) => {
      const resultado = await salvarBriefingKickoff(estadoAnterior, formData);
      if (resultado.confirmado) setEditando(false);
      return resultado;
    },
    INICIAL,
  );
  const etapaIndex = ETAPAS_BRIEFING.findIndex((item) => item.id === etapa);
  const etapaAtual = ETAPAS_BRIEFING[etapaIndex] ?? ETAPAS_BRIEFING[0];

  function abrirEtapa(proximaEtapa: EtapaBriefingId) {
    setErroLocal(null);
    setEtapa(proximaEtapa);
  }

  function validarEtapa(etapaParaValidar: (typeof ETAPAS_BRIEFING)[number]): boolean {
    const formulario = formRef.current;
    if (!formulario) return false;

    for (const nome of etapaParaValidar.campos) {
      const campo = formulario.elements.namedItem(nome);
      if (!(campo instanceof HTMLInputElement || campo instanceof HTMLTextAreaElement)) {
        setErroLocal('Não foi possível revisar esta parte. Atualize a página e tente novamente.');
        return false;
      }
      if (!campo.value.trim()) {
        setErroLocal('Complete os campos desta parte para continuar.');
        requestAnimationFrame(() => campo.focus());
        return false;
      }
    }

    setErroLocal(null);
    return true;
  }

  function avancar() {
    if (!validarEtapa(etapaAtual)) return;
    const proxima = ETAPAS_BRIEFING[etapaIndex + 1];
    if (proxima) abrirEtapa(proxima.id);
  }

  function validarConfirmacao(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value !== 'confirmar') return;

    const incompleta = ETAPAS_BRIEFING.find((item) => !validarEtapa(item));
    if (!incompleta) return;

    event.preventDefault();
    setEtapa(incompleta.id);
  }

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
            <p>Acordo confirmado</p>
            <h2 id="briefing-titulo">O combinado do projeto</h2>
          </div>
          <span className={styles.estadoConfirmado}>
            <Check size={13} aria-hidden="true" /> Pronto
          </span>
        </header>

        <div className={styles.resumoConfirmado}>
          <div className={styles.objetivoResumo}>
            <span>Objetivo</span>
            <strong>{briefing.objetivo}</strong>
            <small>Como saberemos que deu certo: {briefing.criterioSucesso}</small>
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
          <span>{ROTULO_ORIGEM_BRIEFING[origem]}</span>
          <button type="button" onClick={() => setEditando(true)}>
            <PencilLine size={14} aria-hidden="true" /> Revisar acordo
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
            <p>Acordo do projeto</p>
            <h2 id="briefing-titulo">Confirme como a entrega vai acontecer</h2>
            <span>
              Use o que foi alinhado no kickoff para deixar resultado, responsáveis e limites claros
              antes da primeira tarefa.
            </span>
          </div>
        </div>
        <div
          className={styles.progresso}
          aria-label={`Parte ${etapaIndex + 1} de ${ETAPAS_BRIEFING.length}`}
        >
          <strong>{String(etapaIndex + 1).padStart(2, '0')}</strong>
          <span>de {ETAPAS_BRIEFING.length} partes</span>
          <div aria-hidden="true">
            <i style={{ transform: `scaleX(${(etapaIndex + 1) / ETAPAS_BRIEFING.length})` }} />
          </div>
        </div>
      </header>

      <nav className={styles.etapas} role="tablist" aria-label="Partes do acordo do projeto">
        {ETAPAS_BRIEFING.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={etapa === item.id}
            aria-controls={`briefing-${item.id}`}
            data-ativo={etapa === item.id || undefined}
            onClick={() => abrirEtapa(item.id)}
          >
            <span>{item.numero}</span>
            <strong>{item.rotulo}</strong>
          </button>
        ))}
      </nav>

      <form
        ref={formRef}
        action={acao}
        className={styles.formulario}
        noValidate
        onSubmit={validarConfirmacao}
      >
        <input type="hidden" name="projeto" value={projetoId} />
        <input type="hidden" name="fonteCallId" value={briefing.fonteCallId ?? ''} />

        <fieldset
          id="briefing-resultado"
          role="tabpanel"
          data-visivel={etapa === 'resultado' || undefined}
          aria-label="Resultado esperado"
        >
          <legend>
            <span>01</span>
            <div>
              <strong>O resultado que o cliente comprou</strong>
              <small>Registre a mudança esperada e a evidência que mostrará o sucesso.</small>
            </div>
          </legend>
          <div className={styles.duasColunas}>
            <label>
              Objetivo combinado
              <textarea
                name="objetivo"
                rows={4}
                defaultValue={briefing.objetivo}
                aria-required="true"
              />
            </label>
            <label>
              Como saberemos que deu certo
              <textarea
                name="criterioSucesso"
                rows={4}
                defaultValue={briefing.criterioSucesso}
                placeholder="Ex.: 90% dos contatos recebem a primeira resposta em até 1 minuto."
                aria-required="true"
              />
            </label>
          </div>
        </fieldset>

        <fieldset
          id="briefing-responsaveis"
          role="tabpanel"
          data-visivel={etapa === 'responsaveis' || undefined}
          aria-label="Responsáveis pelo projeto"
        >
          <legend>
            <span>02</span>
            <div>
              <strong>Quem responde por cada lado</strong>
              <small>
                Uma pessoa do cliente e uma pessoa da implementação, sem responsabilidade difusa.
              </small>
            </div>
          </legend>
          <div className={styles.duasColunas}>
            <label>
              Responsável do cliente
              <input
                name="responsavelCliente"
                defaultValue={briefing.responsavelCliente}
                placeholder="Nome e função"
                aria-required="true"
              />
            </label>
            <label>
              Responsável pela implementação
              <input
                name="responsavelTecnico"
                defaultValue={briefing.responsavelTecnico}
                placeholder="Quem conduz a entrega"
                aria-required="true"
              />
            </label>
          </div>
        </fieldset>

        <fieldset
          id="briefing-condicoes"
          role="tabpanel"
          data-visivel={etapa === 'condicoes' || undefined}
          aria-label="Acessos e limites do projeto"
        >
          <legend>
            <span>03</span>
            <div>
              <strong>O que precisa estar disponível</strong>
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
                aria-required="true"
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
                aria-required="true"
              />
            </label>
          </div>
          <div className={styles.avisoSeguranca}>
            <KeyRound size={15} aria-hidden="true" />
            <span>Senhas, tokens e chaves nunca devem ser salvos neste campo.</span>
          </div>
        </fieldset>

        <fieldset
          id="briefing-inicio"
          role="tabpanel"
          data-visivel={etapa === 'inicio' || undefined}
          aria-label="Primeiro plano do projeto"
        >
          <legend>
            <span>04</span>
            <div>
              <strong>O que acontece depois do kickoff</strong>
              <small>Transforme o acordo nas primeiras ações do cliente e da implementação.</small>
            </div>
          </legend>
          <label>
            Primeiros passos
            <textarea
              name="proximosPassos"
              rows={5}
              defaultValue={listaParaTexto(briefing.proximosPassos)}
              placeholder={
                'Cliente libera os acessos até sexta-feira\nImplementador entrega o mapa inicial na terça-feira'
              }
              aria-required="true"
            />
          </label>
          <label>
            Observações internas <span>Opcional</span>
            <textarea name="observacoes" rows={3} defaultValue={briefing.observacoes} />
          </label>
        </fieldset>

        <footer className={styles.acoes}>
          <div>
            <span>{ROTULO_ORIGEM_BRIEFING[origem]}</span>
            <small>
              Parte {etapaIndex + 1} de {ETAPAS_BRIEFING.length}. Você pode salvar e continuar
              depois.
            </small>
          </div>
          <div>
            {confirmado && etapaIndex === 0 && (
              <button type="button" className={styles.cancelar} onClick={() => setEditando(false)}>
                Cancelar
              </button>
            )}
            {etapaIndex > 0 && (
              <button type="button" onClick={() => abrirEtapa(ETAPAS_BRIEFING[etapaIndex - 1]!.id)}>
                <ArrowLeft size={15} aria-hidden="true" /> Voltar
              </button>
            )}
            <button type="submit" name="operacao" value="salvar" disabled={pendente}>
              <Save size={15} aria-hidden="true" /> Salvar rascunho
            </button>
            {etapaIndex < ETAPAS_BRIEFING.length - 1 ? (
              <button type="button" className={styles.confirmar} onClick={avancar}>
                Próxima parte <ArrowRight size={15} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                name="operacao"
                value="confirmar"
                className={styles.confirmar}
                disabled={pendente}
              >
                <UserRoundCheck size={15} aria-hidden="true" />
                {pendente ? 'Confirmando…' : 'Confirmar acordo'}
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </footer>

        {(erroLocal || estado.erro) && (
          <p className={styles.retorno} role="alert">
            {erroLocal || estado.erro}
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
