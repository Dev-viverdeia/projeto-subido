import { Button } from '@/design-system/via';
import { EsperaOperacao } from '../../_components/EsperaOperacao';

const ETAPAS_SALA = [
  {
    titulo: 'Criando a sala da Subido',
    descricao: 'Gerando o acesso público e ligando a reunião à ficha do cliente.',
  },
  {
    titulo: 'Salvando na ficha',
    descricao: 'Registrando a reunião no histórico deste cliente.',
  },
] as const;

const ETAPAS_CONVITE = [
  ...ETAPAS_SALA,
  {
    titulo: 'Enviando o convite',
    descricao: 'Criando o evento no Google Calendar com o link da sala.',
  },
] as const;

export function BotaoAgendar({
  comConviteGoogle,
  kickoff = false,
  pending,
  form,
}: {
  comConviteGoogle: boolean;
  kickoff?: boolean;
  pending: boolean;
  form: string;
}) {
  return (
    <>
      <EsperaOperacao
        key={pending ? 'agendando' : 'pronto'}
        aberto={pending}
        rotulo={kickoff ? 'Kickoff em preparação' : 'Agendamento em andamento'}
        titulo={
          kickoff
            ? 'Criando o kickoff e o convite'
            : comConviteGoogle
              ? 'Criando sua reunião e o convite'
              : 'Criando sua reunião'
        }
        descricao={
          kickoff
            ? 'Estamos preparando a sala e ligando o kickoff ao projeto do cliente.'
            : 'Estamos preparando a sala e ligando a conversa à ficha do cliente.'
        }
        etapas={comConviteGoogle ? ETAPAS_CONVITE : ETAPAS_SALA}
        intervalo={2_500}
        nota="Mantenha esta janela aberta até a confirmação."
        mensagemDemora="O Google está demorando para responder. A reunião não será duplicada."
        demoraApos={12_000}
      />
      <Button type="submit" form={form} variant="primary" loading={pending}>
        {pending
          ? kickoff
            ? 'Criando kickoff e convite…'
            : comConviteGoogle
              ? 'Criando reunião e convite…'
              : 'Criando sala…'
          : kickoff
            ? 'Agendar kickoff e enviar convite'
            : comConviteGoogle
              ? 'Criar reunião e enviar convite'
              : 'Criar reunião e link'}
      </Button>
    </>
  );
}
