'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { Alert, Button, Input } from '@/design-system/via';
import { criarLead, type EstadoNovoLead } from '@/lib/crm/actions';
import styles from './FormularioNovoLead.module.css';

const INICIAL: EstadoNovoLead = {};

function BotaoAdicionar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      Adicionar ao pipeline
    </Button>
  );
}

export function FormularioNovoLead({ abertoInicial = false }: { abertoInicial?: boolean }) {
  const gatilho = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(abertoInicial);
  const [estado, acao] = useActionState(criarLead, INICIAL);

  useEffect(() => {
    if (!aberto) return;
    painel.current?.querySelector<HTMLElement>('input')?.focus();
  }, [aberto]);

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
        <span>Novo lead</span>
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
                  <p>Comece pelo que você já sabe. O contexto cresce a cada interação.</p>
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

              <form action={acao} className={styles.formulario} noValidate>
                {estado.erro && (
                  <Alert tone="danger" size="compact">
                    {estado.erro}
                  </Alert>
                )}

                <Input
                  id="crm-empresa"
                  name="empresa"
                  label="Empresa"
                  placeholder="Ex.: Clínica Aurora"
                  autoComplete="organization"
                  defaultValue={estado.campos?.empresa ?? ''}
                  error={estado.porCampo?.empresa}
                  required
                />
                <Input
                  id="crm-contato"
                  name="contato"
                  label="Contato principal"
                  placeholder="Nome da pessoa"
                  autoComplete="name"
                  defaultValue={estado.campos?.contato ?? ''}
                  error={estado.porCampo?.contato}
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
                  error={estado.porCampo?.email}
                />
                <Input
                  id="crm-titulo"
                  name="titulo"
                  label="Oportunidade"
                  hint="Se deixar vazio, criamos um título com o nome da empresa."
                  placeholder="Ex.: Automação do atendimento"
                  defaultValue={estado.campos?.titulo ?? ''}
                  error={estado.porCampo?.titulo}
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
