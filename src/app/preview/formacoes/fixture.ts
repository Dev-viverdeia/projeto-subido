import type { FormacaoCompleta, FormacaoResumo } from '@/lib/conteudo/queries';

const aula = (id: string, titulo: string, ordem: number, duracaoSeg: number) => ({
  id,
  titulo,
  ordem,
  duracao_seg: duracaoSeg,
});

export const FORMACAO_DEMO: FormacaoCompleta = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'formacao-de-chatgpt',
  titulo: 'ChatGPT para o trabalho',
  resumo: 'Use IA com contexto, método e segurança nas tarefas que fazem parte da sua rotina.',
  capa_url: null,
  publicado_em: '2026-08-01T00:00:00.000Z',
  modulos: [
    {
      id: 'modulo-1',
      titulo: 'Fundamentos para trabalhar com IA',
      ordem: 1,
      aulas: [
        aula('aula-1', 'Como conversar com a IA para obter respostas úteis', 1, 720),
        aula('aula-2', 'Contexto, critérios e formato de saída', 2, 840),
        aula('aula-3', 'Segurança e revisão humana', 3, 660),
      ],
    },
    {
      id: 'modulo-2',
      titulo: 'Aplicação no trabalho real',
      ordem: 2,
      aulas: [
        aula('aula-4', 'Pesquisa e síntese para decisões', 1, 900),
        aula('aula-5', 'Criando um fluxo de trabalho reutilizável', 2, 1020),
      ],
    },
  ],
};

export const FORMACOES_DEMO: FormacaoResumo[] = [
  FORMACAO_DEMO,
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'formacao-de-gpt-agents',
    titulo: 'Agentes de IA',
    resumo: 'Crie agentes com ferramentas, memória e limites claros.',
    capa_url: null,
    publicado_em: '2026-08-02T00:00:00.000Z',
    criado_em: '2026-07-02T00:00:00.000Z',
    modulos: 4,
    aulas: 16,
    aulaIds: Array.from({ length: 16 }, (_, indice) => `agentes-${indice + 1}`),
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    slug: 'formacao-de-lovable',
    titulo: 'Lovable na prática',
    resumo: 'Transforme uma necessidade em um produto funcional e publicável.',
    capa_url: null,
    publicado_em: '2026-08-03T00:00:00.000Z',
    criado_em: '2026-07-03T00:00:00.000Z',
    modulos: 3,
    aulas: 12,
    aulaIds: Array.from({ length: 12 }, (_, indice) => `lovable-${indice + 1}`),
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    slug: 'formacao-de-claude-code',
    titulo: 'Claude Code para projetos',
    resumo: 'Construa ferramentas com IA apoiando cada etapa técnica.',
    capa_url: null,
    publicado_em: '2026-08-04T00:00:00.000Z',
    criado_em: '2026-07-04T00:00:00.000Z',
    modulos: 4,
    aulas: 18,
    aulaIds: Array.from({ length: 18 }, (_, indice) => `claude-${indice + 1}`),
  },
].map((formacao) =>
  'aulaIds' in formacao
    ? formacao
    : {
        ...formacao,
        criado_em: '2026-07-01T00:00:00.000Z',
        modulos: formacao.modulos.length,
        aulas: formacao.modulos.flatMap((modulo) => modulo.aulas).length,
        aulaIds: formacao.modulos.flatMap((modulo) => modulo.aulas.map((item) => item.id)),
      },
);
