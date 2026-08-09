import type { ReactNode } from 'react';
import { LayoutComProgresso } from '../_components/LayoutComProgresso';

export default function FormacoesLayout({ children }: { children: ReactNode }) {
  return <LayoutComProgresso>{children}</LayoutComProgresso>;
}
