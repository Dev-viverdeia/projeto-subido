import type { EstadoStack } from '@/lib/builder/queries';

/**
 * Onde construir — as três saídas que o produto reconhece.
 *
 * A ORDEM É A RECOMENDAÇÃO, e ela não é aleatória: a primeira é o caminho que as
 * formações da plataforma ensinam, então quem seguiu o Lovable já sabe operá-la.
 * As outras duas existem porque o público não é homogêneo — quem não quer
 * configurar banco e quem quer o controle do terminal são pessoas diferentes, e
 * empurrar as duas para o mesmo caminho é como um wizard perde gente.
 *
 * O `prompt` é o texto que a pessoa cola na ferramenta. Ele MENCIONA os arquivos
 * do kit pelo nome — e é aqui que mora a dívida honesta desta fase: o ZIP com
 * esses arquivos ainda não existe. Enquanto não existir, o prompt fala do que a
 * pessoa tem em tela (o documento) e não de arquivos que ela não recebeu.
 */
export type Stack = Exclude<EstadoStack, null>;

export type OpcaoStack = {
  id: Stack;
  eyebrow: string;
  titulo: string;
  descricao: string;
  /** Os passos que a pessoa segue depois de escolher. */
  passos: string[];
};

export const STACKS: OpcaoStack[] = [
  {
    id: 'lovable_supabase',
    eyebrow: 'Recomendado',
    titulo: 'Lovable + Supabase',
    descricao: 'Visual, sem código, com banco robusto. É o caminho das formações.',
    passos: [
      'Crie um projeto novo no lovable.dev e conecte o Supabase (menu Integrations).',
      'Cole o prompt abaixo na conversa do Lovable.',
      'Siga as tarefas do quadro, uma de cada vez, copiando o prompt de cada uma.',
    ],
  },
  {
    id: 'lovable_cloud',
    eyebrow: 'Alternativa simples',
    titulo: 'Lovable + Lovable Cloud',
    descricao: 'Tudo dentro do Lovable — ele cuida do banco. Zero configuração.',
    passos: [
      'Crie um projeto novo no lovable.dev e ative o Lovable Cloud.',
      'Cole o prompt abaixo na conversa.',
      'Siga as tarefas do quadro, uma de cada vez.',
    ],
  },
  {
    id: 'claude_code_supabase',
    eyebrow: 'Para quem é técnico',
    titulo: 'Claude Code + Supabase',
    descricao: 'Controle total pelo terminal, com a IA escrevendo o código.',
    passos: [
      'Crie o projeto do Supabase e guarde a URL e a chave.',
      'Abra o Claude Code na pasta do projeto e cole o prompt abaixo.',
      'Siga as tarefas do quadro, uma de cada vez.',
    ],
  },
];

export function acharStack(id: EstadoStack): OpcaoStack | null {
  return STACKS.find((s) => s.id === id) ?? null;
}

/**
 * O prompt de partida.
 *
 * Ele descreve o que a pessoa TEM: título, resumo e arquitetura do documento
 * gerado. Não menciona `SKILL.md`, `README.md` nem `db/schemas.sql` — esses
 * arquivos são do kit em ZIP, que ainda não foi construído. Prompt que manda a
 * IA ler um arquivo inexistente falha na primeira mensagem e a culpa cai na
 * ferramenta.
 */
export function promptDePartida(titulo: string, arquitetura: string): string {
  return [
    `Vamos construir: "${titulo}".`,
    '',
    'Arquitetura definida:',
    arquitetura,
    '',
    'Comece pela primeira tarefa e me avise ao concluir cada uma.',
  ].join('\n');
}
