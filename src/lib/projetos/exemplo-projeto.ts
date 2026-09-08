/** Conteúdo editorial: não representa dados de clientes nem execução concluída. */
export type ExemploProjeto = { titulo: string; entrega: string } & (
  | {
      tipo: 'fluxo';
      etapas: { titulo: string; detalhe: string }[];
      desvio: { quando: string; acao: string };
    }
  | { tipo: 'ficha'; campos: { rotulo: string; valor: string; pendente?: boolean }[] }
  | {
      tipo: 'conversa';
      rotulos?: { entrada: string; resposta: string };
      cenarios: { nome: string; entrada: string; resposta: string; decisao: string }[];
    }
  | {
      tipo: 'analise';
      casos: {
        nome: string;
        empresa: string;
        criterios: {
          rotulo: string;
          dado: string;
          estado: 'confirmado' | 'nao_atende' | 'desconhecido';
        }[];
        decisao: string;
        motivo: string;
      }[];
    }
);
