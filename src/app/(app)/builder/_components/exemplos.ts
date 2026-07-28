/**
 * Os três exemplos que preenchem o campo.
 *
 * NÃO SÃO FRASES DE EFEITO — são briefings completos, e é isso que eles ensinam.
 * Cada um traz volume, quem opera hoje e o que já existe no cliente: exatamente
 * as três coisas que a entrevista do passo seguinte pergunta quando faltam. Um
 * chip que preenchesse "quero automatizar meu WhatsApp" gastaria uma rodada de
 * perguntas para chegar onde este texto já começa.
 *
 * O domínio é o da Comunidade Subido — tráfego pago e operação de agência. Um
 * exemplo genérico de SaaS não teria a ver com o cliente de quem usa o Builder.
 */
export type ExemploBuilder = {
  /** O que aparece no chip. Curto, é rótulo — não é o texto que entra no campo. */
  rotulo: string;
  texto: string;
};

export const EXEMPLOS: readonly ExemploBuilder[] = [
  {
    rotulo: 'Atendimento que não dorme',
    texto:
      'Meu cliente tem uma clínica com 4 recepcionistas. Chegam umas 380 mensagens por mês no WhatsApp fora do horário comercial e ele perde agendamento porque ninguém responde. Queria que respondesse e marcasse a consulta sozinho. A agenda hoje está no Google Calendar, espelhada do prontuário, e só a recepção escreve nela.',
  },
  {
    rotulo: 'Relatório que se escreve sozinho',
    texto:
      'Meu cliente é uma agência de tráfego com 6 contas ativas. Toda segunda um analista gasta a manhã inteira montando o relatório à mão: exporta Meta Ads e Google Ads, cruza com o CRM numa planilha e escreve os comentários. Queria receber pronto, no mesmo formato, com o comentário já rascunhado.',
  },
  {
    rotulo: 'Triagem de currículos',
    texto:
      'Meu cliente é uma agência de RH com 3 recrutadores. Chegam uns 200 currículos por semana no e-mail, em PDF e sem padrão. Eles leem tudo para separar quem tem o perfil da vaga antes de chamar. Queriam receber só a lista já separada, com o motivo de cada corte escrito.',
  },
];
