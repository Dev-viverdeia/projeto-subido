import { NovoAtendimento } from '@/components/suporte/NovoAtendimento';
export const metadata = { title: 'Ajuda com acesso', robots: { index: false, follow: false } };
export default async function AjudaAcessoPage({ searchParams }: PageProps<'/ajuda/acesso'>) {
  const p = await searchParams;
  return <NovoAtendimento publico linkInvalido={p.erro === 'link'} />;
}
