'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/design-system/via';
import { EsperaOperacao } from '../../_components/EsperaOperacao';

const ETAPAS_SALA = [
  {
    titulo: 'Criando a sala da Subido',
    descricao: 'Gerando o acesso público e ligando a call à ficha do cliente.',
  },
  {
    titulo: 'Salvando no CRM',
    descricao: 'Registrando a reunião no histórico desta oportunidade.',
  },
] as const;

const ETAPAS_CONVITE = [
  ...ETAPAS_SALA,
  {
    titulo: 'Enviando o convite',
    descricao: 'Criando o evento no Google Calendar com o link da sala.',
  },
] as const;

export function BotaoAgendar({ comConviteGoogle }: { comConviteGoogle: boolean }) {
  const { pending } = useFormStatus();
  return (
    <>
      <EsperaOperacao
        key={pending ? 'agendando' : 'pronto'}
        aberto={pending}
        rotulo="Agendamento em andamento"
        titulo={comConviteGoogle ? 'Criando sua call e o convite' : 'Criando sua call'}
        descricao="Estamos preparando a sala para que a conversa já nasça ligada ao CRM."
        etapas={comConviteGoogle ? ETAPAS_CONVITE : ETAPAS_SALA}
        intervalo={2_500}
        nota="Mantenha esta janela aberta até a confirmação."
        mensagemDemora="O Google está demorando para responder. A call não será duplicada."
        demoraApos={12_000}
      />
      <Button type="submit" variant="primary" loading={pending}>
        {pending
          ? comConviteGoogle
            ? 'Criando call e convite…'
            : 'Criando sala…'
          : comConviteGoogle
            ? 'Criar call e enviar convite'
            : 'Criar call e link'}
      </Button>
    </>
  );
}
