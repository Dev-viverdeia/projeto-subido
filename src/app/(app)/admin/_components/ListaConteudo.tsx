import Link from 'next/link';
import { FilePlus2 } from 'lucide-react';
import { Button, EmptyState, Pill } from '@/design-system/via';
import styles from './ListaConteudo.module.css';

export type LinhaConteudo = {
  id: string;
  titulo: string;
  slug: string;
  status: 'rascunho' | 'publicado' | 'arquivado';
  atualizado_em: string;
};

/* `default` é navy sólido, `attn` é o accent. Nada de semáforo verde/vermelho — a
   paleta não tem essas cores e status de publicação não é alerta. */
const APARENCIA = {
  publicado: { variant: 'success', rotulo: 'publicado' },
  rascunho: { variant: 'attn', rotulo: 'rascunho' },
  arquivado: { variant: 'default', rotulo: 'arquivado' },
} as const;

/**
 * Listagem de conteúdo administrado. Server Component — nenhum JS.
 *
 * Soluções e formações compartilham este componente: as duas listas mostram as
 * mesmas quatro colunas e levam ao mesmo tipo de editor.
 */
export function ListaConteudo({
  itens,
  baseHref,
  rotuloSingular,
}: {
  itens: LinhaConteudo[];
  baseHref: string;
  rotuloSingular: string;
}) {
  if (itens.length === 0) {
    return (
      <EmptyState
        icon={<FilePlus2 size={20} strokeWidth={1.8} />}
        title={`Nenhuma ${rotuloSingular} cadastrada`}
        description="O que você criar aqui aparece para os assinantes assim que o status virar publicado."
        action={
          <Link href={`${baseHref}/nova`}>
            <Button variant="primary">Criar {rotuloSingular}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <ul className={styles.lista}>
      {itens.map((item) => {
        const aparencia = APARENCIA[item.status];
        return (
          <li key={item.id}>
            <Link href={`${baseHref}/${item.id}`} className={styles.linha}>
              <span className={styles.principal}>
                <span className={styles.titulo}>{item.titulo}</span>
                <span className={styles.slug}>/{item.slug}</span>
              </span>
              <Pill variant={aparencia.variant} size="sm">
                {aparencia.rotulo}
              </Pill>
              {/* `pt-BR` fixo e não a locale do browser: o servidor renderiza esta
                  string, e deixar a locale variar produziria divergência de
                  hidratação entre o que o servidor escreveu e o que o cliente
                  espera. */}
              <time className={styles.data} dateTime={item.atualizado_em}>
                {new Date(item.atualizado_em).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })}
              </time>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
