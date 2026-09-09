import { z } from 'zod';
import { notFound } from 'next/navigation';
import { acessoPublico, casoSeguro, criarSistemaSuporte } from '@/lib/suporte/servidor';
import { NovoAtendimento } from '@/components/suporte/NovoAtendimento';
import { ConversaAtendimento } from '@/components/suporte/ConversaAtendimento';
import {
  paginaHistorico,
  MENSAGENS_POR_PAGINA,
  type MensagemSuporte,
} from '@/lib/suporte/contrato';
export const metadata = {
  title: 'Atendimento',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default async function AtendimentoPublicoPage({
  params,
  searchParams,
}: PageProps<'/ajuda/atendimento/[id]'>) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const acesso = await acessoPublico(id);
  if (!acesso) return <NovoAtendimento publico renovarId={id} />;
  const pagina = paginaHistorico((await searchParams).historico);
  const { data, error, count } = await criarSistemaSuporte()
    .from('suporte_mensagens')
    .select('*,suporte_arquivos(id,nome,bytes,mime)', { count: 'exact' })
    .eq('atendimento', id)
    .eq('interna', false)
    .order('criado_em', { ascending: false })
    .order('id', { ascending: false })
    .range(pagina * MENSAGENS_POR_PAGINA, (pagina + 1) * MENSAGENS_POR_PAGINA - 1);
  if (error) throw new Error('mensagens_indisponiveis');
  const mensagens = (data ?? []).reverse().map((m): MensagemSuporte => ({
    id: m.id,
    texto: m.texto,
    papel: m.papel as MensagemSuporte['papel'],
    interna: false,
    criado_em: m.criado_em,
    arquivos: m.suporte_arquivos,
    nome_autor: m.nome_autor,
    canal: m.canal as MensagemSuporte['canal'],
  }));
  return (
    <ConversaAtendimento
      caso={casoSeguro(acesso.caso)}
      mensagens={mensagens}
      pagina={pagina}
      totalMensagens={count ?? 0}
      publico
    />
  );
}
