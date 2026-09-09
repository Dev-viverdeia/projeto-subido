'use client';
import Link from 'next/link';
import { Button } from '@/design-system/via';
import s from '@/components/suporte/suporte.module.css';
export default function ErroAjuda({ reset }: { reset: () => void }) {
  return (
    <div className={s.pagina}>
      <h1 className={s.titulo}>A ajuda não carregou</h1>
      <p className={s.subtitulo}>
        Tente novamente. Se o problema for entrar na conta, você também pode abrir um pedido de
        acesso.
      </p>
      <div className={s.acoes}>
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href="/ajuda/acesso" className={s.atalho}>
          Problema de acesso
        </Link>
      </div>
    </div>
  );
}
