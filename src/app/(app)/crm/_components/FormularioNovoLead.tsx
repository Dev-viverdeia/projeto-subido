'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Alert, Button, Input } from '@/design-system/via';
import { criarLead, type EstadoNovoLead } from '@/lib/crm/actions';
import { ModalOperacao } from '../../_components/ModalOperacao';
import styles from './FormularioNovoLead.module.css';

const INICIAL: EstadoNovoLead = {};
type CampoNovoLead = 'empresa' | 'contato' | 'email' | 'titulo';
const FORMULARIO_ID = 'form-nova-oportunidade';

export function FormularioNovoLead({
  abertoInicial = false,
  rotulo = 'Adicionar empresa',
  tituloInicial = '',
  projetoSlug = '',
}: {
  abertoInicial?: boolean;
  rotulo?: string;
  tituloInicial?: string;
  projetoSlug?: string;
}) {
  const gatilho = useRef<HTMLButtonElement>(null);
  const formulario = useRef<HTMLFormElement>(null);
  const [aberto, setAberto] = useState(abertoInicial);
  const [errosOcultos, setErrosOcultos] = useState<Set<CampoNovoLead>>(new Set());
  const [estado, acao, pendente] = useActionState(criarLead, INICIAL);

  useEffect(() => {
    if (!aberto || !estado.porCampo) return;
    const quadro = window.requestAnimationFrame(() => {
      formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
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
    if (pendente) return;
    setAberto(false);
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
        <Plus size={17} strokeWidth={2} aria-hidden="true" />
        <span>{rotulo}</span>
      </button>

      <ModalOperacao
        open={aberto}
        onClose={fechar}
        label="Vendas"
        title="Adicionar oportunidade"
        description="Informe empresa e contato. O projeto pode ser definido depois."
        size="md"
        blocked={pendente}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={fechar} disabled={pendente}>
              Cancelar
            </Button>
            <Button type="submit" form={FORMULARIO_ID} variant="primary" loading={pendente}>
              {pendente ? 'Criando oportunidade…' : 'Criar oportunidade'}
            </Button>
          </>
        }
      >
        <form
          ref={formulario}
          id={FORMULARIO_ID}
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
            data-autofocus
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
            label="E-mail (opcional)"
            placeholder="contato@empresa.com.br"
            autoComplete="email"
            defaultValue={estado.campos?.email ?? ''}
            error={erroVisivel('email')}
            onChange={() => ocultarErro('email')}
          />
          <Input
            id="crm-titulo"
            name="titulo"
            label="Projeto de IA (opcional)"
            placeholder="Ex.: Atendimento e qualificação com IA"
            defaultValue={estado.campos?.titulo ?? tituloInicial}
            error={erroVisivel('titulo')}
            onChange={() => ocultarErro('titulo')}
          />
        </form>
      </ModalOperacao>
    </>
  );
}
