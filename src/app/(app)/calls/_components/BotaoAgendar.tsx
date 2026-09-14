import { Button } from '@/design-system/via';
import { EsperaOperacao } from '../../_components/EsperaOperacao';

// A ação retorna um resultado único. O tempo decorrido não comprova etapas concluídas.
const ETAPAS = [
  {
    titulo: 'Aguardando confirmação',
    descricao:
      'Se houver outra reunião neste horário, você poderá escolher o que fazer antes do convite.',
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
        titulo="Conferindo seu agendamento"
        descricao="Antes de criar a sala e enviar o convite, conferimos as reuniões deste horário."
        etapas={ETAPAS}
        nota="Mantenha esta janela aberta até a confirmação."
        mensagemDemora="O agendamento está demorando mais que o esperado. Aguarde a confirmação antes de tentar novamente."
        demoraApos={12_000}
      />
      <Button type="submit" form={form} variant="primary" loading={pending}>
        {pending
          ? 'Processando agendamento…'
          : kickoff
            ? 'Agendar kickoff e enviar convite'
            : comConviteGoogle
              ? 'Criar reunião e enviar convite'
              : 'Criar reunião e link'}
      </Button>
    </>
  );
}
