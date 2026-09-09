import { notFound } from 'next/navigation';
import { CentralAjuda } from '@/components/suporte/CentralAjuda';
import { NovoAtendimento } from '@/components/suporte/NovoAtendimento';
import { ConversaAtendimento } from '@/components/suporte/ConversaAtendimento';
import { ChatAjuda } from '@/components/suporte/ChatAjuda';
import { ListaAtendimentos } from '@/components/suporte/ListaAtendimentos';
import { GUIAS_INICIAIS } from '@/lib/suporte/guias-iniciais';
import type { CasoSuporte } from '@/lib/suporte/contrato';
import { contextoFalha, CONTEXTOS_FALHA } from '@/lib/suporte/recuperacao';
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
  ultima_resposta_equipe_em: '2026-09-08T14:00:00Z',
  ultima_mensagem_resumo: 'Vamos conferir juntos. Apareceu algum aviso na sua conta?',
  aguardando_equipe_desde: '2026-09-08T13:00:00Z',
};
export default async function PreviewSuporte({ searchParams }: PageProps<'/preview/suporte'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { tela, estado, longo, contexto: valor } = await searchParams;
  const contexto = contextoFalha(valor);
  return (
    <main className={s.publico}>
      {tela === 'pedido' ? (
        <NovoAtendimento publico />
      ) : tela === 'pedido-cliente' ? (
        <NovoAtendimento
          usuario="exemplo"
          artigos={GUIAS_INICIAIS}
          assuntoInicial={contexto ? CONTEXTOS_FALHA[contexto].assunto : undefined}
          pagina={contexto ? CONTEXTOS_FALHA[contexto].pagina : null}
        />
      ) : tela === 'fila' ? (
        <div className={s.pagina}>
          <h1 className={s.titulo}>Painel de suporte</h1>
          <ListaAtendimentos
            casos={[{ ...caso, status: 'em_atendimento', email: 'cliente@example.test' }]}
            equipe
            total={1}
            pagina={0}
            status="pendentes"
          />
        </div>
      ) : tela === 'conversa' || tela === 'equipe' ? (
        <ConversaAtendimento
          caso={{
            ...caso,
            ...(estado === 'resolvido' ? { status: 'resolvido' } : {}),
            ...(longo
              ? {
                  assunto:
                    'Preciso de ajuda para conectar a agenda da minha equipe e recuperar o acesso à reunião com o cliente',
                }
              : {}),
          }}
          preview
          equipe={tela === 'equipe'}
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
        <CentralAjuda
          artigos={GUIAS_INICIAIS}
          autenticado={tela === 'cliente'}
          atendimentos={tela === 'cliente' ? [caso] : []}
        />
      )}
    </main>
  );
}
