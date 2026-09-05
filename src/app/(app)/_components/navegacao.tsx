import { IconeProduto } from '@/components/brand/IconeProduto';
import { ROTULOS, type RotaApp } from '@/lib/routes';

export type ItemNav = {
  href: RotaApp;
  rotulo: string;
  /** Elemento já renderizado no servidor — ver o porquê abaixo. */
  icone: React.ReactNode;
  /** Concorre aos quatro atalhos do dock. O painel "Mais" recebe só os destinos restantes. */
  noDock: boolean;
  /** Organiza a navegação pela jornada real, em vez de uma lista plana de ferramentas. */
  grupo: 'inicio' | 'aprendizado' | 'operacao' | 'gestao';
  /** Sinal calculado no servidor. O cliente só o usa para explicar o acesso. */
  bloqueado?: boolean;
  /** Destino calculado no servidor com o recurso e a origem corretos. */
  destinoBloqueado?: string;
  /** Nome humano do plano necessário para explicar o bloqueio. */
  planoNecessario?: string;
};

export const ROTULOS_GRUPO_NAV = {
  inicio: 'Início',
  aprendizado: 'Aprender e construir',
  operacao: 'Vender e entregar',
  gestao: 'Gestão',
} satisfies Record<ItemNav['grupo'], string>;

/**
 * Os destinos da plataforma, na ordem dos quatro pilares.
 *
 * Elementos SVG serializados no servidor: a navegação cliente recebe o desenho,
 * não importa o catálogo. A família é a mesma dos atalhos no Início.
 * 22px corrige os pictogramas de 18px ao lado da navegação de 15px.
 */

export const ITENS_NAV: ItemNav[] = [
  {
    href: '/inicio',
    rotulo: ROTULOS['/inicio'],
    icone: <IconeProduto nome="inicio" />,
    noDock: true,
    grupo: 'inicio',
  },
  {
    href: '/consultor',
    rotulo: ROTULOS['/consultor'],
    icone: <IconeProduto nome="sobral" />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/formacoes',
    rotulo: ROTULOS['/formacoes'],
    icone: <IconeProduto nome="formacoes" />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/solucoes',
    rotulo: ROTULOS['/solucoes'],
    icone: <IconeProduto nome="projetos" />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/builder',
    rotulo: ROTULOS['/builder'],
    icone: <IconeProduto nome="estudio" />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/mentorias',
    rotulo: ROTULOS['/mentorias'],
    icone: <IconeProduto nome="mentorias" />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/certificados',
    rotulo: ROTULOS['/certificados'],
    icone: <IconeProduto nome="certificados" />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/prospeccao',
    rotulo: ROTULOS['/prospeccao'],
    icone: <IconeProduto nome="prospeccao" />,
    noDock: true,
    grupo: 'operacao',
  },
  {
    href: '/vendas',
    rotulo: ROTULOS['/vendas'],
    icone: <IconeProduto nome="vendas" />,
    noDock: true,
    grupo: 'operacao',
  },
  {
    href: '/metricas',
    rotulo: ROTULOS['/metricas'],
    icone: <IconeProduto nome="metricas" />,
    noDock: false,
    grupo: 'operacao',
  },
  {
    href: '/reunioes',
    rotulo: ROTULOS['/reunioes'],
    icone: <IconeProduto nome="reunioes" />,
    noDock: true,
    grupo: 'operacao',
  },
  {
    href: '/propostas',
    rotulo: ROTULOS['/propostas'],
    icone: <IconeProduto nome="propostas" />,
    noDock: false,
    grupo: 'operacao',
  },
  {
    href: '/entregas',
    rotulo: ROTULOS['/entregas'],
    icone: <IconeProduto nome="entregas" />,
    noDock: false,
    grupo: 'operacao',
  },
];

/**
 * Item extra, só para quem tem papel de admin.
 *
 * Fica FORA de ITENS_NAV porque o layout monta a lista por sessão: um membro
 * comum nunca recebe este objeto no payload, então nem o rótulo nem o destino
 * vazam para quem não pode entrar. Esconder por CSS deixaria a rota descoberta no
 * HTML de todo mundo.
 *
 * Não entra nos quatro atalhos; quando autorizado, aparece no painel "Mais".
 */
export const ITEM_ADMIN: ItemNav = {
  href: '/admin',
  rotulo: ROTULOS['/admin'],
  icone: <IconeProduto nome="admin" />,
  noDock: false,
  grupo: 'gestao',
};

/**
 * A conta não compete com as áreas da jornada na sidebar. No mobile, porém, o
 * cabeçalho compacto não exibe o menu de perfil; por isso ela entra como destino
 * próprio no painel "Mais".
 */
export const ITEM_CONTA: ItemNav = {
  href: '/conta',
  rotulo: 'Minha conta',
  icone: <IconeProduto nome="conta" />,
  noDock: false,
  grupo: 'gestao',
};
