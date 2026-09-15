'use client';

import { useEffect } from 'react';
import { CloudOff } from 'lucide-react';
import { Button } from '@/design-system/via';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { EstadoSistema } from './(app)/_components/EstadoSistema';
import styles from './estado-global.module.css';

export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global:boundary]', error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="pt-BR" data-theme="light">
      <body>
        <main className={styles.pagina}>
          <header className={styles.marca}>
            <SubidoLogo size={18} />
          </header>

          <EstadoSistema
            urgente
            icone={<CloudOff size={30} strokeWidth={1.6} />}
            etiqueta="Falha temporária"
            titulo="Não foi possível carregar a página."
            descricao="Tente novamente. Se o problema continuar, recarregue a página."
            acoes={
              <Button variant="primary" onClick={reset}>
                Tentar novamente
              </Button>
            }
          />
        </main>
      </body>
    </html>
  );
}
