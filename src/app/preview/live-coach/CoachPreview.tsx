'use client';
import { useState, type ComponentProps } from 'react';
import { CabineLiveCoach } from '@/app/sala/[codigo]/CabineLiveCoach';

export function CoachPreview(props: ComponentProps<typeof CabineLiveCoach>) {
  const [oculta, setOculta] = useState(false);
  return (
    <CabineLiveCoach
      {...props}
      sugestao={oculta ? null : props.sugestao}
      historico={props.sugestao ? [props.sugestao] : []}
      onOcultar={() => setOculta(true)}
    />
  );
}
