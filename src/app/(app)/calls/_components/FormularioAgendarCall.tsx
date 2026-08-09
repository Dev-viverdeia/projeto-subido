'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { CalendarPlus, Layers3, X } from 'lucide-react';
import { Alert, Button, Input } from '@/design-system/via';
import { agendarReuniao, type EstadoAgendamento } from '@/lib/calls/actions';
import { TIPOS_CALL } from '@/lib/calls/tipos';
import type { OportunidadeSeletor } from '@/lib/crm/queries';
import styles from './FormularioAgendarCall.module.css';

const INICIAL: EstadoAgendamento = {};
type CampoAgendamento = 'oportunidade' | 'tipo' | 'titulo' | 'agendadaPara' | 'duracao';

function BotaoAgendar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      {pending ? 'Criando sala…' : 'Criar call e link'}
    </Button>
  );
}

export function FormularioAgendarCall({
  oportunidades,
  abertoInicial = false,
  oportunidadeInicial,
}: {
  oportunidades: OportunidadeSeletor[];
  abertoInicial?: boolean;
  oportunidadeInicial?: string;
}) {
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(abertoInicial);
  const [offsetMinutos, setOffsetMinutos] = useState(0);
  const [errosOcultos, setErrosOcultos] = useState<Set<CampoAgendamento>>(new Set());
  const [estado, acao] = useActionState(agendarReuniao, INICIAL);
  const disponiveis = oportunidades.filter((item) => item.etapa !== 'perdido');
  const oportunidadePadrao = disponiveis.some((item) => item.id === oportunidadeInicial)
    ? oportunidadeInicial
    : '';

  useEffect(() => {
    if (!aberto) return;
    painel.current?.querySelector<HTMLElement>('select, input:not([type="hidden"])')?.focus();
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
        onClick={() => {
          setOffsetMinutos(new Date().getTimezoneOffset());
          setAberto(true);
        }}
      >
        <CalendarPlus size={17} strokeWidth={2} aria-hidden="true" />
        <span>Agendar call</span>
      </button>

      {aberto && (
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
                  <p className={styles.sobretitulo}>CRM + sala inteligente</p>
                  <h2 id="agendar-call-titulo">Agendar call</h2>
                  <p>Escolha a oportunidade. O link e o primeiro fato são criados juntos.</p>
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

              {disponiveis.length === 0 ? (
                <div className={styles.semLead}>
                  <p>Uma call precisa estar ligada a uma oportunidade real.</p>
                  <Link href="/crm" className="via-btn via-btn--primary via-btn--md">
                    Adicionar primeiro lead
                  </Link>
                </div>
              ) : (
                <form
                  action={acao}
                  className={styles.formulario}
                  noValidate
                  onSubmit={() => setErrosOcultos(new Set())}
                >
                  <input type="hidden" name="offsetMinutos" value={offsetMinutos} />

                  {estado.erro && (
                    <div role="alert">
                      <Alert tone="danger" size="compact">
                        {estado.erro}
                      </Alert>
                    </div>
                  )}

                  <label className={styles.campo}>
                    <span>Oportunidade</span>
                    <select
                      id="calls-oportunidade"
                      name="oportunidade"
                      defaultValue={estado.campos?.oportunidade ?? oportunidadePadrao}
                      aria-invalid={Boolean(erroVisivel('oportunidade'))}
                      aria-describedby={
                        erroVisivel('oportunidade') ? 'calls-oportunidade-msg' : undefined
                      }
                      onChange={() => ocultarErro('oportunidade')}
                      required
                    >
                      <option value="" disabled>
                        Escolha no CRM
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

                  <div className={styles.duasColunas}>
                    <label className={styles.campo}>
                      <span>Tipo de call</span>
                      <select name="tipo" defaultValue={estado.campos?.tipo ?? 'descoberta'}>
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
                    hint="Opcional. Se ficar vazio, usamos o nome da oportunidade."
                    placeholder="Ex.: Descoberta de atendimento"
                    defaultValue={estado.campos?.titulo ?? ''}
                    error={erroVisivel('titulo')}
                    onChange={() => ocultarErro('titulo')}
                  />

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
                    <BotaoAgendar />
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
