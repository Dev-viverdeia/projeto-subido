import {
  Award,
  Bot,
  BriefcaseBusiness,
  ContactRound,
  DraftingCompass,
  FileSignature,
  GraduationCap,
  House,
  ScanSearch,
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
  /** Concorre aos quatro atalhos do dock. O painel "Mais" sempre recebe a lista completa. */
  noDock: boolean;
  /** Organiza a navegação pela jornada real, em vez de uma lista plana de ferramentas. */
  grupo: 'operacao' | 'entrega' | 'evolucao' | 'gestao';
};

export const ROTULOS_GRUPO_NAV = {
  operacao: 'Operação',
  entrega: 'Construir e entregar',
  evolucao: 'Evolução profissional',
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
    grupo: 'operacao',
  },
  {
    href: '/crm',
    rotulo: ROTULOS['/crm'],
    icone: <ContactRound size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
    grupo: 'operacao',
  },
  {
    href: '/calls',
    rotulo: ROTULOS['/calls'],
    icone: <Video size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
    grupo: 'operacao',
  },
  {
    href: '/propostas',
    rotulo: ROTULOS['/propostas'],
    icone: <FileSignature size={TAMANHO} strokeWidth={TRACO} />,
    /* Fica no painel completo; o dock prioriza quatro ações recorrentes e "Mais". */
    noDock: false,
    grupo: 'operacao',
  },
  {
    href: '/diagnosticos',
    rotulo: ROTULOS['/diagnosticos'],
    icone: <ScanSearch size={TAMANHO} strokeWidth={TRACO} />,
    /* Diagnóstico é pré-venda e fica a um toque dentro do painel completo. */
    noDock: false,
    grupo: 'operacao',
  },
  {
    href: '/solucoes',
    rotulo: ROTULOS['/solucoes'],
    icone: <BriefcaseBusiness size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
    grupo: 'entrega',
  },
  {
    href: '/builder',
    rotulo: ROTULOS['/builder'],
    icone: <DraftingCompass size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
    grupo: 'entrega',
  },
  {
    href: '/consultor',
    rotulo: ROTULOS['/consultor'],
    icone: <Bot size={TAMANHO} strokeWidth={TRACO} />,
    /* O Sobral AI fica no painel completo para preservar os atalhos operacionais. */
    noDock: false,
    grupo: 'entrega',
  },
  {
    href: '/formacoes',
    rotulo: ROTULOS['/formacoes'],
    icone: <GraduationCap size={TAMANHO} strokeWidth={TRACO} />,
    /* Formação fica no painel completo e também aparece no Mapa da Jornada. */
    noDock: false,
    grupo: 'evolucao',
  },
  {
    href: '/mentorias',
    rotulo: ROTULOS['/mentorias'],
    icone: <Users size={TAMANHO} strokeWidth={TRACO} />,
    /* Mentorias fica no painel completo e nas chamadas contextuais da jornada. */
    noDock: false,
    grupo: 'evolucao',
  },
  {
    href: '/certificados',
    rotulo: ROTULOS['/certificados'],
    icone: <Award size={TAMANHO} strokeWidth={TRACO} />,
    /* Certificados fica no painel completo, junto das áreas de evolução. */
    noDock: false,
    grupo: 'evolucao',
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
