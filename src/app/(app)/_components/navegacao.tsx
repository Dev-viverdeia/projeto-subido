import { Blocks, Boxes, GraduationCap, House, Users } from 'lucide-react';
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
  },
  {
    href: '/solucoes',
    rotulo: ROTULOS['/solucoes'],
    icone: <Boxes size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
  },
  {
    href: '/formacoes',
    rotulo: ROTULOS['/formacoes'],
    icone: <GraduationCap size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
  },
  {
    href: '/builder',
    rotulo: ROTULOS['/builder'],
    icone: <Blocks size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
  },
  {
    href: '/mentorias',
    rotulo: ROTULOS['/mentorias'],
    icone: <Users size={TAMANHO} strokeWidth={TRACO} />,
    noDock: true,
  },
];
