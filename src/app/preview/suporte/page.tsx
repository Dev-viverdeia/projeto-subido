import { notFound } from 'next/navigation';
import { CentralAjuda } from '@/components/suporte/CentralAjuda';
import { NovoAtendimento } from '@/components/suporte/NovoAtendimento';
import { ConversaAtendimento } from '@/components/suporte/ConversaAtendimento';
import { ChatAjuda } from '@/components/suporte/ChatAjuda';
import { GUIAS_INICIAIS } from '@/lib/suporte/guias-iniciais';
import type { CasoSuporte } from '@/lib/suporte/contrato';
import s from '@/components/suporte/suporte.module.css';
const caso: CasoSuporte = {
  id: '11111111-1111-4111-8111-111111111111',
  numero: 42,
  assunto: 'Ajuda para conectar minha agenda',
  categoria: 'reunioes',
  status: 'aguardando_voce',
  prioridade: 'normal',
  responsavel: null,
  criado_em: '2026-09-08T13:00:00Z',
  atualizado_em: '2026-09-08T14:00:00Z',
  avaliacao: null,
  pagina: null,
  lido_equipe_em: null,
  lido_usuario_em: null,
};
export default async function PreviewSuporte({ searchParams }: PageProps<'/preview/suporte'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { tela } = await searchParams;
  return (
    <main className={s.publico}>
      {tela === 'pedido' ? (
        <NovoAtendimento publico />
      ) : tela === 'conversa' ? (
        <ConversaAtendimento
          caso={caso}
          preview
          mensagens={[
            {
              id: '1',
              papel: 'usuario',
              interna: false,
              texto: 'Escolhi minha conta no Google, mas a agenda ainda não aparece conectada.',
              criado_em: caso.criado_em,
              arquivos: [],
            },
            {
              id: '2',
              papel: 'equipe',
              interna: false,
              texto:
                'Vamos conferir juntos. Ao voltar do Google, apareceu algum aviso na seção de agenda da sua conta?',
              criado_em: caso.atualizado_em,
              arquivos: [],
            },
          ]}
        />
      ) : tela === 'ia' ? (
        <ChatAjuda artigos={GUIAS_INICIAIS} />
      ) : (
        <CentralAjuda artigos={GUIAS_INICIAIS} />
      )}
    </main>
  );
}
