import { describe, expect, it } from 'vitest';
import type { RoteiroProjeto } from '@/lib/projetos/roteiro';
import { montarKitOperacionalTarefa } from './kit-operacional';

const ROTEIRO: RoteiroProjeto = {
  fundamentos: [],
  fases: [
    {
      id: 'entender',
      titulo: 'Entender',
      objetivo: 'Entender o processo real antes de propor qualquer automação.',
      passos: [
        {
          id: 'mapear-demanda',
          titulo: 'Mapear a demanda',
          acao: 'Leia conversas reais e separe os pedidos que mais se repetem.',
          concluidoQuando: 'Os pedidos recorrentes estão agrupados e revisados.',
          entregavel: 'Mapa de demanda.',
          duracao: '45 min',
          insumos: ['Conversas dos últimos 30 dias'],
          execucao: ['Separe os pedidos recorrentes', 'Valide as categorias com o cliente'],
          atencao: 'Não invente categorias sem evidência nas conversas.',
          modelo: {
            titulo: 'Mapa inicial',
            conteudo: 'Categoria:\nExemplo real:\nResposta atual:\nResponsável:',
          },
        },
      ],
    },
    {
      id: 'preparar',
      titulo: 'Preparar',
      objetivo: 'Preparar a operação e os acessos necessários para construir com segurança.',
      passos: [
        {
          id: 'sem-guia',
          titulo: 'Confirmar o acesso',
          acao: 'Confirme o acesso com o responsável antes de iniciar a configuração.',
          concluidoQuando: 'O acesso foi testado pelo profissional responsável.',
          entregavel: 'Acesso confirmado.',
          insumos: [],
          execucao: [],
        },
      ],
    },
    {
      id: 'construir',
      titulo: 'Construir',
      objetivo: 'Construir uma primeira versão controlada e pronta para testes internos.',
      passos: [
        {
          id: 'primeira-versao',
          titulo: 'Construir a primeira versão',
          acao: 'Configure o fluxo principal usando somente o escopo aprovado pelo cliente.',
          concluidoQuando: 'O fluxo principal funciona em ambiente controlado.',
          entregavel: 'Primeira versão funcional.',
          insumos: [],
          execucao: [],
        },
      ],
    },
    {
      id: 'validar',
      titulo: 'Validar',
      objetivo: 'Validar o funcionamento em cenários reais antes de liberar para a operação.',
      passos: [
        {
          id: 'testar',
          titulo: 'Testar os cenários',
          acao: 'Rode os cenários aprovados e registre o resultado observado em cada teste.',
          concluidoQuando: 'Os cenários críticos passaram ou têm ajuste registrado.',
          entregavel: 'Relatório de testes.',
          insumos: [],
          execucao: [],
        },
      ],
    },
    {
      id: 'entregar',
      titulo: 'Entregar',
      objetivo: 'Entregar a solução, treinar a equipe e formalizar a continuidade da operação.',
      passos: [
        {
          id: 'treinar',
          titulo: 'Treinar a equipe',
          acao: 'Conduza o treinamento com a equipe responsável pela operação do dia a dia.',
          concluidoQuando: 'A equipe consegue operar e sabe quando pedir suporte.',
          entregavel: 'Treinamento concluído.',
          insumos: [],
          execucao: [],
        },
      ],
    },
  ],
};

describe('montarKitOperacionalTarefa', () => {
  it('encontra o passo quando a tarefa usa o identificador persistido fase:passo', () => {
    const kit = montarKitOperacionalTarefa({
      projetoSlug: 'sdr-atendimento-qualificacao',
      roteiro: ROTEIRO,
      faseId: 'entender',
      passoId: 'entender:mapear-demanda',
    });

    expect(kit).toMatchObject({
      projetoSlug: 'sdr-atendimento-qualificacao',
      duracao: '45 min',
      insumos: ['Conversas dos últimos 30 dias'],
      checklist: ['Separe os pedidos recorrentes', 'Valide as categorias com o cliente'],
      cuidado: 'Não invente categorias sem evidência nas conversas.',
      modelo: { titulo: 'Mapa inicial' },
    });
  });

  it('aceita o identificador editorial sem prefixo para projetos antigos', () => {
    const kit = montarKitOperacionalTarefa({
      projetoSlug: 'sdr-atendimento-qualificacao',
      roteiro: ROTEIRO,
      faseId: 'entender',
      passoId: 'mapear-demanda',
    });

    expect(kit?.checklist).toHaveLength(2);
  });

  it('não cria uma caixa vazia quando o passo ainda não tem material operacional', () => {
    expect(
      montarKitOperacionalTarefa({
        projetoSlug: 'sdr-atendimento-qualificacao',
        roteiro: ROTEIRO,
        faseId: 'preparar',
        passoId: 'sem-guia',
      }),
    ).toBeNull();
  });
});
