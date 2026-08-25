'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CalendarCheck2, CalendarPlus, Check, Layers3, Mail, X } from 'lucide-react';
import { Alert, Button, Input } from '@/design-system/via';
import { agendarReuniao, type EstadoAgendamento } from '@/lib/calls/actions';
import { TIPOS_CALL } from '@/lib/calls/tipos';
import type { TipoCall } from '@/lib/calls/tipos';
import { ROTULO_ETAPA } from '@/lib/crm/etapas';
import type { OportunidadeSeletor } from '@/lib/crm/queries';
import type { EstadoGoogleCalendar } from '@/lib/google-calendar/queries';
import { BotaoAgendar } from './BotaoAgendar';
import { CamposParticipanteStarter } from './CamposParticipanteStarter';
import { SetupGoogleCalendar } from './SetupGoogleCalendar';
import styles from './FormularioAgendarCall.module.css';

const INICIAL: EstadoAgendamento = {};
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

export function FormularioAgendarCall({
  oportunidades,
  abertoInicial = false,
  oportunidadeInicial,
  tipoInicial,
  calendar,
  comercialLiberado = true,
}: {
  oportunidades: OportunidadeSeletor[];
  abertoInicial?: boolean;
  oportunidadeInicial?: string;
  tipoInicial?: TipoCall;
  calendar: EstadoGoogleCalendar;
  comercialLiberado?: boolean;
}) {
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const montado = useSyncExternalStore(
    escutarMontagem,
    obterMontagemCliente,
    obterMontagemServidor,
  );
  const [aberto, setAberto] = useState(abertoInicial);
  const offsetMinutos = montado ? new Date().getTimezoneOffset() : 0;
  const [errosOcultos, setErrosOcultos] = useState<Set<CampoAgendamento>>(new Set());
  const [estado, acao] = useActionState(agendarReuniao, INICIAL);
  const disponiveis = oportunidades.filter((item) => item.etapa !== 'perdido');
  const oportunidadePadrao = disponiveis.some((item) => item.id === oportunidadeInicial)
    ? oportunidadeInicial
    : '';
  const oportunidadeVinculada = disponiveis.find((item) => item.id === oportunidadeInicial);
  const [oportunidadeSelecionadaId, setOportunidadeSelecionadaId] = useState(
    oportunidadeInicial ?? '',
  );
  const oportunidadeSelecionada =
    oportunidadeVinculada ??
    disponiveis.find((item) => item.id === oportunidadeSelecionadaId) ??
    null;
  const [convidadoEmail, setConvidadoEmail] = useState(oportunidadeVinculada?.contatoEmail ?? '');
  const precisaConfigurarCalendar = !calendar.conectado;
  const retornoCalendar = `/reunioes?nova=1${oportunidadeSelecionada?.id ? `&oportunidade=${oportunidadeSelecionada.id}` : ''}`;
  const conectarCalendarHref = `/api/integracoes/google-calendar/conectar?retorno=${encodeURIComponent(retornoCalendar)}`;

  useEffect(() => {
    if (!aberto) return;
    painel.current
      ?.querySelector<HTMLElement>('[data-autofocus], select, input:not([type="hidden"])')
      ?.focus();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto || !estado.porCampo) return;
    const quadro = window.requestAnimationFrame(() => {
      painel.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
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
    setAberto(false);
    requestAnimationFrame(() => gatilho.current?.focus());
  }

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        className={`via-btn via-btn--primary via-btn--md ${styles.gatilho}`}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-controls="agendar-call-dialogo"
        onClick={() => setAberto(true)}
      >
        {precisaConfigurarCalendar ? (
          <CalendarCheck2 size={17} strokeWidth={2} aria-hidden="true" />
        ) : (
          <CalendarPlus size={17} strokeWidth={2} aria-hidden="true" />
        )}
        <span>{precisaConfigurarCalendar ? 'Conectar agenda' : 'Agendar reunião'}</span>
      </button>

      {montado &&
        aberto &&
        createPortal(
          <div
            className={styles.scrim}
            onMouseDown={(evento) => {
              if (evento.target === evento.currentTarget) fechar();
            }}
          >
            <div
              id="agendar-call-dialogo"
              ref={painel}
              className={styles.dialogo}
              role="dialog"
              aria-modal="true"
              aria-labelledby="agendar-call-titulo"
              onKeyDown={(evento) => {
                if (evento.key === 'Escape') fechar();
                if (evento.key !== 'Tab') return;
                const focaveis = painel.current?.querySelectorAll<HTMLElement>(
                  'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]',
                );
                if (!focaveis?.length) return;
                const primeiro = focaveis[0];
                const ultimo = focaveis[focaveis.length - 1];
                if (evento.shiftKey && document.activeElement === primeiro) {
                  evento.preventDefault();
                  ultimo?.focus();
                } else if (!evento.shiftKey && document.activeElement === ultimo) {
                  evento.preventDefault();
                  primeiro?.focus();
                }
              }}
            >
              <div className={styles.painel}>
                <header className={styles.topo}>
                  <div>
                    <p className={styles.sobretitulo}>
                      {precisaConfigurarCalendar
                        ? 'Configuração inicial'
                        : comercialLiberado
                          ? 'Vendas + Live Coach'
                          : 'Reunião + Live Coach'}
                    </p>
                    <h2 id="agendar-call-titulo">
                      {precisaConfigurarCalendar ? 'Conecte sua agenda' : 'Agendar reunião'}
                    </h2>
                    <p>
                      {precisaConfigurarCalendar
                        ? 'Você faz isso uma vez. Depois, cada reunião já nasce com sala, convite e histórico na ficha do cliente.'
                        : oportunidadeVinculada
                          ? 'Defina o horário. A sala ficará ligada à ficha deste cliente.'
                          : comercialLiberado
                            ? 'Escolha o cliente e defina o horário. O link ficará salvo na ficha.'
                            : 'Informe quem vai participar e defina o horário. O histórico fica salvo automaticamente.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.fechar}
                    onClick={fechar}
                    aria-label="Fechar"
                  >
                    <X size={19} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </header>

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
                      Adicionar primeiro cliente
                    </Link>
                  </div>
                ) : (
                  <form
                    action={acao}
                    className={styles.formulario}
                    noValidate
                    onSubmit={() => setErrosOcultos(new Set())}
                  >
                    <input type="hidden" name="offsetMinutos" value={offsetMinutos} readOnly />

                    {estado.erro && (
                      <div role="alert">
                        <Alert tone="danger" size="compact">
                          {estado.erro}
                        </Alert>
                      </div>
                    )}

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
                          <span>Venda vinculada</span>
                          <Link href={`/vendas/${oportunidadeVinculada.id}`}>Abrir ficha</Link>
                        </div>
                        <strong>{oportunidadeVinculada.empresa}</strong>
                        <p>{oportunidadeVinculada.titulo}</p>
                        <small>
                          {oportunidadeVinculada.contato
                            ? `${oportunidadeVinculada.contato} · `
                            : ''}
                          {ROTULO_ETAPA[oportunidadeVinculada.etapa]}
                        </small>
                      </div>
                    ) : (
                      <label className={styles.campo}>
                        <span>Cliente em negociação</span>
                        <select
                          id="calls-oportunidade"
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
                          defaultValue={estado.campos?.tipo ?? tipoInicial ?? 'descoberta'}
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
                        label="Título"
                        hint="Opcional. Se vazio, usamos o nome da venda."
                        placeholder="Ex.: Descoberta de atendimento"
                        defaultValue={estado.campos?.titulo ?? ''}
                        error={erroVisivel('titulo')}
                        onChange={() => ocultarErro('titulo')}
                      />
                    </div>

                    <section className={styles.calendar} aria-labelledby="convite-google-titulo">
                      <div className={styles.calendarTopo}>
                        <span className={styles.calendarIcone} aria-hidden="true">
                          <CalendarCheck2 size={19} strokeWidth={1.7} />
                        </span>
                        <div>
                          <h3 id="convite-google-titulo">Convite pelo Google Calendar</h3>
                          <p>
                            O evento chega por e-mail e leva o cliente direto para a sala da Subido.
                          </p>
                        </div>
                        <small>{calendar.email}</small>
                      </div>

                      <div className={styles.calendarCorpo}>
                        <input type="hidden" name="enviarConviteGoogle" value="on" />
                        <div className={styles.conviteAtivo}>
                          <span aria-hidden="true">
                            <Check size={14} strokeWidth={2.2} />
                          </span>
                          <span>
                            <strong>Convite automático ativado</strong>
                            <small>
                              Sem Google Meet: o acesso será pela sala pública da Subido.
                            </small>
                          </span>
                        </div>
                        <Input
                          id="calls-convidado-email"
                          name="convidadoEmail"
                          type="email"
                          label="E-mail do cliente"
                          placeholder="cliente@empresa.com.br"
                          iconLeft={<Mail size={16} strokeWidth={1.7} aria-hidden="true" />}
                          value={convidadoEmail}
                          error={erroVisivel('convidadoEmail')}
                          onChange={(evento) => {
                            setConvidadoEmail(evento.target.value);
                            ocultarErro('convidadoEmail');
                          }}
                          required
                        />
                      </div>
                    </section>

                    <label className={styles.coach}>
                      <input type="checkbox" name="liveCoach" defaultChecked />
                      <span className={styles.coachIcone}>
                        <Layers3 size={17} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <span>
                        <strong>Ativar Live Coach</strong>
                        <small>Preparar recomendações em tempo real durante a conversa.</small>
                      </span>
                    </label>

                    <div className={styles.acoes}>
                      <Button type="button" variant="secondary" onClick={fechar}>
                        Cancelar
                      </Button>
                      <BotaoAgendar comConviteGoogle />
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
