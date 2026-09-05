import 'server-only';

export type DadosEventoCall = {
  reuniaoId: string;
  codigoPublico: string;
  titulo: string;
  empresa: string;
  contato: string | null;
  convidadoEmail: string;
  agendadaPara: string;
  duracaoMinutos: number;
};

export function idEventoGoogle(reuniaoId: string) {
  return `subido${reuniaoId.replaceAll('-', '').toLowerCase()}`;
}

function descricaoEvento(dados: DadosEventoCall, salaUrl: string) {
  const linhas = [
    `Reunião com ${dados.empresa}.`,
    dados.contato ? `Contato: ${dados.contato}.` : null,
    '',
    'Acesse a sala da Subido:',
    salaUrl,
    '',
    'A sala reúne a conversa, a transcrição e os próximos passos desta venda.',
  ];
  return linhas.filter((linha): linha is string => linha !== null).join('\n');
}

export function montarEventoGoogle(dados: DadosEventoCall, salaUrl: string) {
  const inicio = new Date(dados.agendadaPara);
  const fim = new Date(inicio.getTime() + dados.duracaoMinutos * 60_000);
  return {
    id: idEventoGoogle(dados.reuniaoId),
    summary: dados.titulo,
    description: descricaoEvento(dados, salaUrl),
    location: salaUrl,
    start: { dateTime: inicio.toISOString() },
    end: { dateTime: fim.toISOString() },
    attendees: [{ email: dados.convidadoEmail }],
    source: { title: 'Abrir sala na Subido', url: salaUrl },
    extendedProperties: { private: { subido_reuniao_id: dados.reuniaoId } },
    reminders: { useDefault: true },
  };
}
