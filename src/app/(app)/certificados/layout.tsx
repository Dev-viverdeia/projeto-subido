import type { ReactNode } from 'react';
import { LayoutComProgresso } from '../_components/LayoutComProgresso';

export default function CertificadosLayout({ children }: { children: ReactNode }) {
  return <LayoutComProgresso>{children}</LayoutComProgresso>;
}
