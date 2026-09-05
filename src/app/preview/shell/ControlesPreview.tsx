'use client';

import { useState } from 'react';
import { Button, Input, Select } from '@/design-system/via';
import { ModalOperacao } from '@/app/(app)/_components/ModalOperacao';
import styles from './controles.module.css';

const OPCOES = [
  { value: 'preparar', label: 'Preparar' },
  { value: 'descobrir', label: 'Descobrir' },
  { value: 'propor', label: 'Propor' },
];

/** Estados reais dos controles, sem ações de banco ou envio. Só existe no preview local. */
function Campos({ prefixo }: { prefixo: string }) {
  return (
    <div className={styles.campos}>
      <Input id={`${prefixo}-empresa`} label="Empresa" placeholder="Nome da empresa" />
      <Input
        id={`${prefixo}-email`}
        label="E-mail"
        defaultValue="contato@"
        error="Confira o e-mail do contato."
      />
      <Input id={`${prefixo}-codigo`} label="Código" defaultValue="CLI-0042" disabled />
      <fieldset disabled className={styles.grupo}>
        <legend>Dados da conta</legend>
        <Input id={`${prefixo}-responsavel`} label="Responsável" defaultValue="Mateus" />
      </fieldset>
      <Select label="Etapa" placeholder="Escolher etapa" options={OPCOES} />
      <Select label="Etapa pendente" error="Escolha uma etapa." options={OPCOES} />
      <Select label="Etapa indisponível" defaultValue="preparar" disabled options={OPCOES} />
    </div>
  );
}

export function ControlesPreview() {
  const [aberto, setAberto] = useState(false);
  return (
    <section className={styles.pagina}>
      <h1>Controles da plataforma</h1>
      <div className={styles.painel}>
        <Campos prefixo="pagina" />
        <Button onClick={() => setAberto(true)}>Editar dados</Button>
      </div>
      <ModalOperacao
        open={aberto}
        onClose={() => setAberto(false)}
        title="Editar dados"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setAberto(false)}>Salvar alterações</Button>
          </>
        }
      >
        <Campos prefixo="modal" />
      </ModalOperacao>
    </section>
  );
}
