import { RetornoOperacao } from '../../_components/RetornoOperacao';

export function RetornosReunioes({
  calendarResultado,
  pendenciaResultado,
}: {
  calendarResultado?: 'sincronizado' | 'falhou';
  pendenciaResultado?: 'reagendar' | 'cancelada' | 'erro';
}) {
  if (calendarResultado === 'sincronizado') {
    return (
      <RetornoOperacao
        tom="sucesso"
        titulo="Reunião criada"
        descricao="O convite foi enviado pelo Google Calendar."
      />
    );
  }

  if (calendarResultado === 'falhou') {
    return (
      <RetornoOperacao
        tom="erro"
        titulo="O convite não foi enviado"
        descricao="A sala foi criada. Confira a pendência na reunião abaixo."
      />
    );
  }

  if (pendenciaResultado === 'cancelada') {
    return (
      <RetornoOperacao
        tom="sucesso"
        titulo="Reunião atualizada"
        descricao="Ela foi marcada como não realizada e saiu da agenda."
      />
    );
  }

  if (pendenciaResultado === 'reagendar') {
    return (
      <RetornoOperacao
        tom="sucesso"
        titulo="Horário anterior encerrado"
        descricao="Escolha uma nova data para o mesmo cliente."
      />
    );
  }

  if (pendenciaResultado === 'erro') {
    return (
      <RetornoOperacao
        tom="erro"
        titulo="A reunião não foi atualizada"
        descricao="Recarregue a página e tente novamente."
      />
    );
  }

  return null;
}
