import { ChatAjuda } from '@/components/suporte/ChatAjuda';
import { artigosSuporte } from '@/lib/suporte/servidor';
export const metadata = { title: 'IA de ajuda' };
export default async function IASuportePage() {
  return <ChatAjuda artigos={await artigosSuporte()} autenticado />;
}
