import {
  Award,
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ContactRound,
  DraftingCompass,
  FileSignature,
  GraduationCap,
  House,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Video,
} from 'lucide-react';
import { ROTULOS, type RotaApp } from '@/lib/routes';

export type ItemNav = {
  href: RotaApp;
  rotulo: string;
  /** Elemento já renderizado no servidor — ver o porquê abaixo. */
  icone: React.ReactNode;
  /** Concorre aos quatro atalhos do dock. O painel "Mais" sempre recebe a lista completa. */
  noDock: boolean;
  /** Organiza a navegação pela jornada real, em vez de uma lista plana de ferramentas. */
  grupo: 'aprendizado' | 'operacao' | 'gestao';
};

export const ROTULOS_GRUPO_NAV = {
  aprendizado: 'Aprender e construir',
  operacao: 'Operação',
  gestao: 'Gestão',
} satisfies Record<ItemNav['grupo'], string>;

/**
 * Os destinos da plataforma, na ordem dos quatro pilares.
 *
 * OS ÍCONES SÃO ELEMENTOS, NÃO COMPONENTES — e isso é o que mantém o JS baixo.
 * Este módulo não tem `'use client'`, então roda no servidor e o `lucide-react`
 * nunca entra no bundle do browser: os `<Boxes />` viram nós já serializados no
 * payload RSC. Se aqui estivesse `icone: Boxes` (a referência ao componente), o
 * NavLateral — que é cliente por causa do `usePathname` — teria que importar a
 * biblioteca inteira para poder chamá-la.
 *
 * `strokeWidth` 1.8 acompanha o peso da Geist; o default 2 pesa demais ao lado dela.
 */
const TAMANHO = 18;
const TRACO = 1.8;

export const ITENS_NAV: ItemNav[] = [
  {
    href: '/inicio',
    rotulo: ROTULOS['/inicio'],
    icone: <House size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
    grupo: 'aprendizado',
  },
  {
    href: '/consultor',
    rotulo: ROTULOS['/consultor'],
    icone: <Bot size={TAMANHO} strokeWidth={TRACO} />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/formacoes',
    rotulo: ROTULOS['/formacoes'],
    icone: <GraduationCap size={TAMANHO} strokeWidth={TRACO} />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/solucoes',
    rotulo: ROTULOS['/solucoes'],
    icone: <BriefcaseBusiness size={TAMANHO} strokeWidth={TRACO} />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/builder',
    rotulo: ROTULOS['/builder'],
    icone: <DraftingCompass size={TAMANHO} strokeWidth={TRACO} />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/mentorias',
    rotulo: ROTULOS['/mentorias'],
    icone: <Users size={TAMANHO} strokeWidth={TRACO} />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/certificados',
    rotulo: ROTULOS['/certificados'],
    icone: <Award size={TAMANHO} strokeWidth={TRACO} />,
    noDock: false,
    grupo: 'aprendizado',
  },
  {
    href: '/prospeccao',
    rotulo: ROTULOS['/prospeccao'],
    icone: <Search size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
    grupo: 'operacao',
  },
  {
    href: '/vendas',
    rotulo: ROTULOS['/vendas'],
    icone: <ContactRound size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
    grupo: 'operacao',
  },
  {
    href: '/metricas',
    rotulo: ROTULOS['/metricas'],
    icone: <ChartNoAxesCombined size={TAMANHO} strokeWidth={TRACO} />,
    noDock: false,
    grupo: 'operacao',
  },
  {
    href: '/reunioes',
    rotulo: ROTULOS['/reunioes'],
    icone: <Video size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
    grupo: 'operacao',
  },
  {
    href: '/propostas',
    rotulo: ROTULOS['/propostas'],
    icone: <FileSignature size={TAMANHO} strokeWidth={TRACO} />,
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
  icone: <ShieldCheck size={TAMANHO} strokeWidth={TRACO} />,
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
  icone: <UserRound size={TAMANHO} strokeWidth={TRACO} />,
  noDock: false,
  grupo: 'gestao',
};
