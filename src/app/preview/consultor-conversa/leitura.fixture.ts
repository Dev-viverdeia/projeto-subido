import type { MensagemDoConsultor } from '@/lib/consultor/queries';
import { sinaisClienteQualidade } from '@/lib/consultor/cliente-qualidade';

export const TEXTO_LONGO = [
  'Comece pelo atendimento no WhatsApp. Antes de propor uma automação para a Clínica Aurora, confirme onde as conversas param e quem assume o próximo contato. A primeira entrega deve resolver um problema pequeno, com resultado que você e o cliente consigam acompanhar.',
  'Na reunião, peça para a equipe mostrar uma conversa recente que não virou agendamento. Percorram juntos a primeira mensagem, o tempo até a resposta e a passagem para a recepção. Assim, você identifica o gargalo real sem presumir que toda demora precisa de uma nova ferramenta.',
  'Com esse exemplo em mãos, delimite o projeto: quais perguntas a IA pode responder, que informações precisa consultar e quando uma pessoa deve continuar o atendimento. Combine também quem aprova a base de conhecimento e quais canais ficam fora desta primeira entrega. Uma demonstração com dados fictícios ajuda a validar esse combinado sem expor informações dos pacientes.',
  'Depois, transforme a conversa em uma proposta curta. Registre o problema, a entrega, as responsabilidades e como será feita a validação. Não prometa aumento de vendas ou redução de custos antes de medir a situação atual. Compare o tempo de resposta e os agendamentos no período acordado e só amplie o escopo se os resultados e a operação sustentarem essa decisão.',
].join('\n\n');

export function exemploLeitura(
  mensagem: MensagemDoConsultor,
  variante: string,
): MensagemDoConsultor {
  return {
    ...mensagem,
    conteudo:
      variante === 'curta' || variante === 'ficha'
        ? 'Revise o escopo e confirme a data da decisão com o cliente.'
        : TEXTO_LONGO,
    acaoConfirmada: null,
    direcao:
      variante === 'sem-acao'
        ? null
        : mensagem.direcao
          ? {
              ...mensagem.direcao,
              ficha_consultada:
                variante === 'ficha' ? sinaisClienteQualidade().cliente?.ficha : null,
              contexto_acao: variante === 'geral' ? null : mensagem.direcao.contexto_acao,
            }
          : null,
    cartoes:
      variante === 'sem-cartoes'
        ? []
        : [
            {
              tipo: 'projeto',
              chave: 'sdr-atendimento-qualificacao',
              titulo: 'Nina · Atendimento no WhatsApp',
              rotulo: 'Projeto',
              href: '/solucoes/sdr-atendimento-qualificacao',
              motivo:
                'Use o passo a passo da Nina para revisar a passagem do atendimento para uma pessoa. O projeto ajuda a definir os limites da IA antes de assumir um compromisso com o cliente.',
            },
            {
              tipo: 'formacao',
              chave: 'agentes',
              titulo: 'Fundamentos de agentes de IA',
              rotulo: 'Formação',
              href: '/formacoes',
              motivo:
                'Revise como estruturar uma base de conhecimento e quando transferir uma conversa.',
            },
            {
              tipo: 'ferramenta',
              chave: 'estudio',
              titulo: 'Estruture o projeto no estúdio',
              rotulo: 'Ferramenta',
              href: '/builder',
              motivo: 'Organize o escopo a partir do problema que você validou com o cliente.',
            },
          ],
  };
}
