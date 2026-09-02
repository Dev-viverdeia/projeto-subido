import type { ReactNode } from 'react';
import { CabecalhoOperacional } from '../../_components/CabecalhoOperacional';

export function CabecalhoReunioes({
  comercialLiberado,
  children,
}: {
  comercialLiberado: boolean;
  children: ReactNode;
}) {
  return (
    <CabecalhoOperacional
      titulo="Reuniões"
      descricao={
        comercialLiberado
          ? 'Prepare, conduza e registre cada conversa.'
          : 'Prepare e conduza cada conversa.'
      }
      acao={children}
    />
  );
}
