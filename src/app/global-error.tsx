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
            <span>Recuperação segura</span>
          </header>

          <EstadoSistema
            urgente
            icone={<CloudOff size={30} strokeWidth={1.6} />}
            etiqueta="Falha temporária"
            titulo="A plataforma perdeu o fio por um instante."
            descricao="O que já foi salvo continua protegido. Tente reconstruir a tela agora; se a conexão não voltar, recarregue a página."
            acoes={
              <Button variant="primary" onClick={reset}>
                Reconstruir tela
              </Button>
            }
            passos={[
              { rotulo: 'Primeiro', valor: 'Refaça a tentativa sem sair da tela.' },
              { rotulo: 'Depois', valor: 'Recarregue o navegador para reiniciar a sessão.' },
            ]}
          />
        </main>
      </body>
    </html>
  );
}
