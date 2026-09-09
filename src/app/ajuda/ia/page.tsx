import { ChatAjuda } from '@/components/suporte/ChatAjuda';
import { artigosSuporte, usuarioSuporte } from '@/lib/suporte/servidor';
export const metadata = { title: 'IA de ajuda', robots: { index: false, follow: false } };
export default async function IAAjudaPage() {
  const [artigos, user] = await Promise.all([artigosSuporte(), usuarioSuporte()]);
  return <ChatAjuda artigos={artigos} autenticado={!!user} />;
}
