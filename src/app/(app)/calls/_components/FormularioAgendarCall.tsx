'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CalendarCheck2, CalendarPlus, ClipboardCheck, Layers3 } from 'lucide-react';
import { Button, Input } from '@/design-system/via';
import {
  CAMPOS_RASCUNHO,
  chaveRascunhoAgenda,
  type RascunhoAgenda,
} from '@/lib/calls/rascunho-agenda';
import { TIPOS_CALL } from '@/lib/calls/tipos';
import type { TipoCall } from '@/lib/calls/tipos';
import { ROTULO_ETAPA } from '@/lib/crm/etapas';
import type { OportunidadeSeletor } from '@/lib/crm/queries';
import type { EstadoGoogleCalendar } from '@/lib/google-calendar/queries';
import { ModalOperacao } from '../../_components/ModalOperacao';
import { BotaoAgendar } from './BotaoAgendar';
import { CamposParticipanteStarter } from './CamposParticipanteStarter';
import { CamposConviteGoogle } from './CamposConviteGoogle';
import { SetupGoogleCalendar } from './SetupGoogleCalendar';
import { ErroAgendamento } from './ErroAgendamento';
import { useAgendamento } from './useAgendamento';
import styles from './FormularioAgendarCall.module.css';

type CampoAgendamento =
  | 'oportunidade'
  | 'empresa'
  | 'contato'
  | 'tipo'
  | 'titulo'
  | 'agendadaPara'
  | 'duracao'
  | 'convidadoEmail';
const escutarMontagem = () => () => undefined;
const obterMontagemCliente = () => true;
const obterMontagemServidor = () => false;
const FORMULARIO_ID = 'form-agendar-reuniao';

export function FormularioAgendarCall({
  oportunidades,
  abertoInicial = false,
  oportunidadeInicial,
  tipoInicial,
  calendar,
  comercialLiberado = true,
  rascunhoDono,
  rascunho,
}: {
  oportunidades: OportunidadeSeletor[];
  abertoInicial?: boolean;
  oportunidadeInicial?: string;
  tipoInicial?: TipoCall;
  calendar: EstadoGoogleCalendar;
  comercialLiberado?: boolean;
  rascunhoDono?: string;
  rascunho?: RascunhoAgenda;
}) {
  const gatilho = useRef<HTMLButtonElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );
  const [aberto, setAberto] = useState(abertoInicial);
  const offsetMinutos = montado ? new Date().getTimezoneOffset() : 0;
  const [errosOcultos, setErrosOcultos] = useState<Set<CampoAgendamento>>(new Set());
  const [estado, acao, pendente] = useAgendamento(rascunho);
  const disponiveis = oportunidades.filter((item) => item.etapa !== 'perdido');
  const oportunidadePadrao = disponiveis.some((item) => item.id === oportunidadeInicial)
    ? oportunidadeInicial
    : '';
  const oportunidadeVinculada = disponiveis.find((item) => item.id === oportunidadeInicial);
  const [oportunidadeSelecionadaId, setOportunidadeSelecionadaId] = useState(
    oportunidadeInicial ?? rascunho?.oportunidade ?? '',
  );
  const oportunidadeSelecionada =
    oportunidadeVinculada ??
    disponiveis.find((item) => item.id === oportunidadeSelecionadaId) ??
    null;
  const [convidadoEmail, setConvidadoEmail] = useState(
    rascunho?.convidadoEmail ?? oportunidadeVinculada?.contatoEmail ?? '',
  );
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoCall>(
    tipoInicial ?? (rascunho?.tipo as TipoCall) ?? 'descoberta',
  );
  const precisaConfigurarCalendar = !calendar.conectado;
  const ehKickoff = tipoSelecionado === 'kickoff';
  const podeAgendar = !precisaConfigurarCalendar && (!comercialLiberado || disponiveis.length > 0);
  const parametrosCalendar = new URLSearchParams({ nova: '1', tipo: tipoSelecionado });
  if (oportunidadeSelecionada?.id)
    parametrosCalendar.set('oportunidade', oportunidadeSelecionada.id);
  const retornoCalendar = `/reunioes?${parametrosCalendar.toString()}`;
  const conectarCalendarHref = `/api/integracoes/google-calendar/conectar?retorno=${encodeURIComponent(retornoCalendar)}`;

  useEffect(() => {
    if (!aberto || (!estado.porCampo && !estado.erro)) return;
    const quadro = window.requestAnimationFrame(() => {
      formulario.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"], [data-ajuda-falha]')
        ?.focus();
    });
    return () => window.cancelAnimationFrame(quadro);
  }, [aberto, estado]);

  function ocultarErro(campo: CampoAgendamento) {
    if (!estado.porCampo?.[campo]) return;
    setErrosOcultos((atuais) => new Set(atuais).add(campo));
  }

  function erroVisivel(campo: CampoAgendamento) {
    return errosOcultos.has(campo) ? undefined : estado.porCampo?.[campo];
  }

  function fechar() {
    if (pendente) return;
    if (rascunhoDono) {
      try {
        sessionStorage.removeItem(chaveRascunhoAgenda(rascunhoDono));
      } catch {
        /* Sem rascunho local. */
      }
    }
    setAberto(false);
  }

  function guardarRascunho() {
    if (!rascunhoDono || !formulario.current) return;
    const dados = new FormData(formulario.current);
    const campos = Object.fromEntries(
      CAMPOS_RASCUNHO.map((campo) => {
        const valor = dados.get(campo);
        return [campo, typeof valor === 'string' ? valor : ''];
      }),
    );
    try {
      sessionStorage.setItem(
        chaveRascunhoAgenda(rascunhoDono),
        JSON.stringify({ salvoEm: Date.now(), campos }),
      );
    } catch {
      /* Não impede a reconexão em navegadores sem storage. */
    }
  }

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        className={`via-btn via-btn--primary via-btn--md ${styles.gatilho}`}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={() => setAberto(true)}
      >
        {precisaConfigurarCalendar ? (
          <CalendarCheck2 size={17} strokeWidth={2} aria-hidden="true" />
        ) : (
          <CalendarPlus size={17} strokeWidth={2} aria-hidden="true" />
        )}
        <span>{precisaConfigurarCalendar ? 'Conectar agenda' : 'Agendar reunião'}</span>
      </button>

      <ModalOperacao
        open={aberto}
        onClose={fechar}
        label="Reuniões"
        title={
          precisaConfigurarCalendar
            ? 'Conectar Google Calendar'
            : ehKickoff
              ? 'Agendar kickoff'
              : 'Agendar reunião'
        }
        description={
          precisaConfigurarCalendar
            ? 'Conecte sua agenda uma vez para criar convites com a sala da Subido.'
            : ehKickoff && oportunidadeVinculada
              ? 'Defina o horário. O convite abre a sala e liga o kickoff ao projeto deste cliente.'
              : oportunidadeVinculada
                ? 'Defina o horário. A reunião ficará ligada à ficha deste cliente.'
                : comercialLiberado
                  ? 'Escolha o cliente e o horário. O convite será enviado pela sua agenda.'
                  : 'Informe quem participa e defina o horário da conversa.'
        }
        size="lg"
        blocked={pendente}
        footer={
          podeAgendar ? (
            <>
              <Button type="button" variant="secondary" onClick={fechar} disabled={pendente}>
                Cancelar
              </Button>
              <BotaoAgendar
                comConviteGoogle
                kickoff={ehKickoff}
                pending={pendente}
                form={FORMULARIO_ID}
              />
            </>
          ) : undefined
        }
      >
        {precisaConfigurarCalendar ? (
          <SetupGoogleCalendar
            calendar={calendar}
            conectarHref={conectarCalendarHref}
            aoFechar={fechar}
          />
        ) : comercialLiberado && disponiveis.length === 0 ? (
          <div className={styles.semLead}>
            <p>Uma reunião precisa estar ligada a uma venda real.</p>
            <Link href="/vendas" className="via-btn via-btn--primary via-btn--md">
              Adicionar oportunidade
            </Link>
          </div>
        ) : (
          <form
            ref={formulario}
            id={FORMULARIO_ID}
            action={acao}
            onReset={(evento) => evento.preventDefault()}
            className={styles.formulario}
            noValidate
            onSubmit={() => {
              setErrosOcultos(new Set());
              const data =
                formulario.current?.querySelector<HTMLInputElement>('[name="agendadaPara"]')?.value;
              const offset =
                formulario.current?.querySelector<HTMLInputElement>('[name="offsetMinutos"]');
              if (data && offset) offset.value = String(new Date(data).getTimezoneOffset());
            }}
          >
            <input type="hidden" name="offsetMinutos" value={offsetMinutos} readOnly />

            <ErroAgendamento
              estado={estado}
              conectarHref={conectarCalendarHref}
              guardarRascunho={guardarRascunho}
            />

            {!comercialLiberado ? (
              <CamposParticipanteStarter
                campos={estado.campos}
                erroEmpresa={erroVisivel('empresa')}
                erroContato={erroVisivel('contato')}
                aoEditarEmpresa={() => ocultarErro('empresa')}
                aoEditarContato={() => ocultarErro('contato')}
              />
            ) : oportunidadeVinculada ? (
              <div className={styles.contextoLead}>
                <input type="hidden" name="oportunidade" value={oportunidadeVinculada.id} />
                <div className={styles.contextoLeadTopo}>
                  <span>{ehKickoff ? 'Projeto vinculado' : 'Venda vinculada'}</span>
                  <Link href={`/vendas/${oportunidadeVinculada.id}`}>Abrir ficha</Link>
                </div>
                <strong>{oportunidadeVinculada.empresa}</strong>
                <p>{oportunidadeVinculada.titulo}</p>
                <small>
                  {oportunidadeVinculada.contato ? `${oportunidadeVinculada.contato} · ` : ''}
                  {ROTULO_ETAPA[oportunidadeVinculada.etapa]}
                </small>
              </div>
            ) : (
              <label className={styles.campo}>
                <span>Cliente em negociação</span>
                <select
                  id="calls-oportunidade"
                  data-autofocus
                  name="oportunidade"
                  defaultValue={estado.campos?.oportunidade ?? oportunidadePadrao}
                  aria-invalid={Boolean(erroVisivel('oportunidade'))}
                  aria-describedby={
                    erroVisivel('oportunidade') ? 'calls-oportunidade-msg' : undefined
                  }
                  onChange={(evento) => {
                    ocultarErro('oportunidade');
                    const id = evento.currentTarget.value;
                    setOportunidadeSelecionadaId(id);
                    const selecionada = disponiveis.find((item) => item.id === id);
                    setConvidadoEmail(selecionada?.contatoEmail ?? '');
                  }}
                  required
                >
                  <option value="" disabled>
                    Escolha em Vendas
                  </option>
                  {disponiveis.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.empresa} · {item.titulo}
                    </option>
                  ))}
                </select>
                {erroVisivel('oportunidade') && (
                  <small id="calls-oportunidade-msg" className={styles.erro}>
                    {erroVisivel('oportunidade')}
                  </small>
                )}
              </label>
            )}

            <div className={styles.duasColunas}>
              <label className={styles.campo}>
                <span>Tipo de reunião</span>
                <select
                  name="tipo"
                  data-autofocus={Boolean(oportunidadeVinculada)}
                  defaultValue={estado.campos?.tipo ?? tipoInicial ?? 'descoberta'}
                  onChange={(evento) => setTipoSelecionado(evento.currentTarget.value as TipoCall)}
                >
                  {TIPOS_CALL.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.rotulo}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                id="calls-duracao"
                name="duracao"
                type="number"
                min={15}
                max={240}
                step={15}
                label="Duração (minutos)"
                defaultValue={estado.campos?.duracao ?? '45'}
                error={erroVisivel('duracao')}
                onChange={() => ocultarErro('duracao')}
                required
              />
            </div>

            <div className={styles.detalhesColunas}>
              <Input
                id="calls-data"
                name="agendadaPara"
                type="datetime-local"
                label="Data e horário"
                defaultValue={estado.campos?.agendadaPara ?? ''}
                error={erroVisivel('agendadaPara')}
                onChange={() => ocultarErro('agendadaPara')}
                required
              />

              <Input
                id="calls-titulo"
                name="titulo"
                label="Título (opcional)"
                placeholder={
                  ehKickoff
                    ? 'Ex.: Kickoff do projeto de atendimento'
                    : 'Ex.: Descoberta de atendimento'
                }
                defaultValue={estado.campos?.titulo ?? ''}
                error={erroVisivel('titulo')}
                onChange={() => ocultarErro('titulo')}
              />
            </div>

            {ehKickoff && (
              <section className={styles.kickoffResumo} aria-label="Resultado esperado do kickoff">
                <span aria-hidden="true">
                  <ClipboardCheck size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <strong>O que precisa sair do kickoff</strong>
                  <p>Resultado, responsáveis, acessos e limites confirmados com o cliente.</p>
                </div>
              </section>
            )}

            <CamposConviteGoogle
              emailAgenda={calendar.email}
              email={convidadoEmail}
              erro={erroVisivel('convidadoEmail')}
              aoEditar={(email) => {
                setConvidadoEmail(email);
                ocultarErro('convidadoEmail');
              }}
            />

            <label className={styles.coach}>
              <input
                type="checkbox"
                name="liveCoach"
                defaultChecked={
                  estado.campos?.liveCoach !== undefined ? estado.campos.liveCoach === 'on' : true
                }
              />
              <span className={styles.coachIcone}>
                <Layers3 size={17} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span>
                <strong>Live Coach</strong>
                <small>Sugestões em tempo real durante a conversa.</small>
              </span>
            </label>
          </form>
        )}
      </ModalOperacao>
    </>
  );
}
