import type { ReactNode } from 'react';
import { ProgressoProvider } from '@/lib/progresso/provider';
import { obterProgressoConta } from '@/lib/progresso/queries';

/**
 * Carrega o progresso apenas nas áreas que o exibem ou alteram.
 *
 * CRM, Calls, Propostas e as demais ferramentas não devem esperar quatro
 * consultas que não usam. Os layouts de Início, Formações, Certificados e
 * Projetos optam por este wrapper de forma explícita.
 */
export async function LayoutComProgresso({ children }: { children: ReactNode }) {
  const progressoInicial = await obterProgressoConta();

  return <ProgressoProvider inicial={progressoInicial}>{children}</ProgressoProvider>;
}
