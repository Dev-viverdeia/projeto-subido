import { ViverDeIaLogo } from './ViverDeIaLogo';

export interface SubidoLogoProps {
  size?: number;
  className?: string;
  variant?: 'brand' | 'mono';
}

/**
 * Adaptador temporário para telas ainda não migradas nominalmente.
 * A saída visual já é sempre o lockup oficial da Viver de IA.
 */
export function SubidoLogo({ size = 18, className, variant = 'brand' }: SubidoLogoProps) {
  return (
    <ViverDeIaLogo
      className={className}
      size={size <= 18 ? 'compact' : 'default'}
      variant={variant === 'mono' ? 'white' : 'navy'}
      produto={false}
    />
  );
}
