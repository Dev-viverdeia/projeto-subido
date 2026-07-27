'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * Provider do React Query. Montado SÓ em `(app)/layout.tsx`.
 *
 * A landing nunca carrega isto — é o que mantém o bundle de `(marketing)` sem
 * React Query, e o que torna a checagem "nenhum chunk do DS na landing" verificável.
 *
 * `useState` E NÃO UMA CONSTANTE DE MÓDULO
 * Um `const client = new QueryClient()` no escopo do módulo vira singleton do
 * processo no servidor: o cache passa a ser compartilhado entre requests de
 * usuários diferentes, e um usuário recebe dados de outro. Criado dentro do
 * `useState`, cada árvore de render ganha o seu — no browser, um por aba; no
 * servidor, um por request.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /**
             * 60s. Com `0` (o default), toda montagem de componente refaz a
             * requisição — inclusive a que acontece logo após a hidratação, o que
             * transforma cada navegação numa rajada de fetches duplicados.
             */
            staleTime: 60_000,
            /* O RSC já entregou os dados do load. Refetch ao focar a janela só
               produz tráfego que ninguém pediu. */
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
