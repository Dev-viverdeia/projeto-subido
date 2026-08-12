'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { Alert, Button, Input } from '@/design-system/via';
import { criarLead, type EstadoNovoLead } from '@/lib/crm/actions';
import styles from './FormularioNovoLead.module.css';

const INICIAL: EstadoNovoLead = {};
type CampoNovoLead = 'empresa' | 'contato' | 'email' | 'titulo';

function BotaoAdicionar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      {pending ? 'Criando oportunidade…' : 'Cadastrar e continuar'}
    </Button>
  );
}

export function FormularioNovoLead({
  abertoInicial = false,
  rotulo = 'Novo lead',
  tituloInicial = '',
  projetoSlug = '',
}: {
  abertoInicial?: boolean;
  rotulo?: string;
  tituloInicial?: string;
  projetoSlug?: string;
}) {
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(abertoInicial);
  const [errosOcultos, setErrosOcultos] = useState<Set<CampoNovoLead>>(new Set());
  const [estado, acao] = useActionState(criarLead, INICIAL);

  useEffect(() => {
    if (!aberto) return;
    painel.current?.querySelector<HTMLElement>('input:not([type="hidden"])')?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto || !estado.porCampo) return;
    const quadro = window.requestAnimationFrame(() => {
      painel.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
    return () => window.cancelAnimationFrame(quadro);
  }, [aberto, estado]);

  function ocultarErro(campo: CampoNovoLead) {
    if (!estado.porCampo?.[campo]) return;
    setErrosOcultos((atuais) => new Set(atuais).add(campo));
  }

  function erroVisivel(campo: CampoNovoLead) {
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
        aria-controls="novo-lead-dialogo"
        onClick={() => setAberto(true)}
      >
        <Plus size={17} strokeWidth={2} aria-hidden="true" />
        <span>{rotulo}</span>
      </button>

      {aberto && (
        <div
          className={styles.scrim}
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) fechar();
          }}
        >
          <div
            id="novo-lead-dialogo"
            ref={painel}
            className={styles.dialogo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="novo-lead-titulo"
            onKeyDown={(evento) => {
              if (evento.key === 'Escape') fechar();
              if (evento.key !== 'Tab') return;

              const focaveis = painel.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
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
                  <p className={styles.sobretitulo}>Nova oportunidade</p>
                  <h2 id="novo-lead-titulo">Adicionar lead</h2>
                  <p>
                    Cadastre o básico. Depois você completa o contexto e prepara a primeira call.
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

              <form
                action={acao}
                className={styles.formulario}
                noValidate
                onSubmit={() => setErrosOcultos(new Set())}
              >
                <input type="hidden" name="projeto" value={projetoSlug} />
                {estado.erro && (
                  <div role="alert">
                    <Alert tone="danger" size="compact">
                      {estado.erro}
                    </Alert>
                  </div>
                )}

                <Input
                  id="crm-empresa"
                  name="empresa"
                  label="Empresa"
                  placeholder="Ex.: Clínica Aurora"
                  autoComplete="organization"
                  defaultValue={estado.campos?.empresa ?? ''}
                  error={erroVisivel('empresa')}
                  onChange={() => ocultarErro('empresa')}
                  required
                />
                <Input
                  id="crm-contato"
                  name="contato"
                  label="Contato principal"
                  placeholder="Nome da pessoa"
                  autoComplete="name"
                  defaultValue={estado.campos?.contato ?? ''}
                  error={erroVisivel('contato')}
                  onChange={() => ocultarErro('contato')}
                  required
                />
                <Input
                  id="crm-email"
                  name="email"
                  type="email"
                  label="E-mail"
                  hint="Opcional por enquanto. Você pode enriquecer depois."
                  autoComplete="email"
                  defaultValue={estado.campos?.email ?? ''}
                  error={erroVisivel('email')}
                  onChange={() => ocultarErro('email')}
                />
                <Input
                  id="crm-titulo"
                  name="titulo"
                  label="Oportunidade"
                  hint="Se deixar vazio, criamos um título com o nome da empresa."
                  placeholder="Ex.: Automação do atendimento"
                  defaultValue={estado.campos?.titulo ?? tituloInicial}
                  error={erroVisivel('titulo')}
                  onChange={() => ocultarErro('titulo')}
                />

                <div className={styles.acoes}>
                  <Button type="button" variant="secondary" onClick={fechar}>
                    Cancelar
                  </Button>
                  <BotaoAdicionar />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
