import {
  Award,
  Bot,
  BriefcaseBusiness,
  ContactRound,
  DraftingCompass,
  FileSignature,
  GraduationCap,
  House,
  ShieldCheck,
  Users,
  Video,
} from 'lucide-react';
import { ROTULOS, type RotaApp } from '@/lib/routes';

export type ItemNav = {
  href: RotaApp;
  rotulo: string;
  /** Elemento já renderizado no servidor — ver o porquê abaixo. */
  icone: React.ReactNode;
  /** Aparece no dock do mobile. Sete itens não cabem em 375px; cinco cabem. */
  noDock: boolean;
};

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
 * `strokeWidth` 1.8 acompanha o peso da Outfit; o default 2 pesa demais ao lado dela.
 */
const TAMANHO = 18;
const TRACO = 1.8;

export const ITENS_NAV: ItemNav[] = [
  {
    href: '/inicio',
    rotulo: ROTULOS['/inicio'],
    icone: <House size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
  },
  {
    href: '/crm',
    rotulo: ROTULOS['/crm'],
    icone: <ContactRound size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
  },
  {
    href: '/propostas',
    rotulo: ROTULOS['/propostas'],
    icone: <FileSignature size={TAMANHO} strokeWidth={TRACO} />,
    /* O dock continua com os cinco destinos operacionais já priorizados. */
    noDock: false,
  },
  {
    href: '/calls',
    rotulo: ROTULOS['/calls'],
    icone: <Video size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
  },
  {
    href: '/solucoes',
    rotulo: ROTULOS['/solucoes'],
    icone: <BriefcaseBusiness size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
  },
  {
    href: '/formacoes',
    rotulo: ROTULOS['/formacoes'],
    icone: <GraduationCap size={TAMANHO} strokeWidth={TRACO} />,
    /* No mobile, Calls passa a ocupar este destino operacional. A formação
       continua disponível no trilho lateral e pelo Mapa da Jornada. */
    noDock: false,
  },
  {
    href: '/builder',
    rotulo: ROTULOS['/builder'],
    icone: <DraftingCompass size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
  },
  {
    href: '/consultor',
    rotulo: ROTULOS['/consultor'],
    icone: <Bot size={TAMANHO} strokeWidth={TRACO} />,
    /* O dock do mobile cabe cinco itens e já tem cinco — o Sobral AI entra só
       no trilho lateral até alguém ceder o lugar. */
    noDock: false,
  },
  {
    href: '/mentorias',
    rotulo: ROTULOS['/mentorias'],
    icone: <Users size={TAMANHO} strokeWidth={TRACO} />,
    /* O CRM ocupa o quinto destino operacional do dock. Mentorias continua na
       navegação lateral e nas chamadas contextuais do Mapa da Jornada. */
    noDock: false,
  },
  {
    href: '/certificados',
    rotulo: ROTULOS['/certificados'],
    icone: <Award size={TAMANHO} strokeWidth={TRACO} />,
    /* O dock do mobile cabe cinco e já tem cinco — como o Consultor, entra só
       no trilho lateral. */
    noDock: false,
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
 * Não entra no dock: em 375px cabem cinco, e nenhum deles pode ser um item que a
 * maioria dos usuários não enxerga.
 */
export const ITEM_ADMIN: ItemNav = {
  href: '/admin',
  rotulo: ROTULOS['/admin'],
  icone: <ShieldCheck size={TAMANHO} strokeWidth={TRACO} />,
  noDock: false,
};
