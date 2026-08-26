import type { Metadata } from 'next';
import { Cabecalho } from '@/components/auth/Cabecalho';
import { FormularioEntrar } from '@/components/auth/FormularioEntrar';
import { destinoSeguro, PARAM_PROXIMO } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'Entrar',
  /* Tela de sessão não entra em índice de busca. */
  robots: { index: false, follow: false },
};

/**
 * `searchParams` é lido no servidor e passado como prop, em vez de `useSearchParams`
 * no cliente: o hook exigiria um limite de Suspense em volta do formulário e faria a
 * página renderizar duas vezes por causa de dois parâmetros triviais.
 *
 * `destinoSeguro` roda AQUI também, e não só na Server Action. O valor chega ao
 * campo oculto do formulário, e campo oculto é editável por qualquer um com o
 * DevTools aberto — validar dos dois lados custa uma chamada de função.
 */
export default async function EntrarPage({ searchParams }: PageProps<'/entrar'>) {
  const params = await searchParams;
  const bruto = params[PARAM_PROXIMO];

  return (
    <>
      <Cabecalho titulo="Entrar">Continue de onde você parou.</Cabecalho>
      <FormularioEntrar
        proximo={destinoSeguro(typeof bruto === 'string' ? bruto : null)}
        linkInvalido={params.erro === 'link'}
        googleErro={params.erro === 'google'}
      />
    </>
  );
}
