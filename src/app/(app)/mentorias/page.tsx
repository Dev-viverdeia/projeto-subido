import type { Metadata } from 'next';
import { gerarAgendaExemplo } from '@/content/mentorias';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import entrada from '../_components/entrada.module.css';
import { lerVistaInicial } from '../_components/filtros/urlFiltros';
import { MentoriasVista } from './_components/MentoriasVista';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Mentorias' };

/**
 * Agenda de mentorias.
 *
 * A rota é dinâmica, então `new Date()` aqui é o instante real de cada visita; a
 * agenda de exemplo se posiciona em volta dele para todos os estados da matriz
 * ficarem visíveis.
 *
 * TODO(backend) — A AGENDA AINDA É DE DEMONSTRAÇÃO. O aviso visível que dizia
 * isso foi removido a pedido, e com ele a única indicação, para quem usa, de que
 * estas sessões são exemplo. Enquanto `gerarAgendaExemplo` for a fonte, esta tela
 * NÃO pode ir ao ar para assinante: ou a tabela real entra antes, ou o aviso
 * volta. Horário, vagas e lotação aqui são inventados, e a tela inteira se apoia
 * em atribuição.
 *
 * O cabeçalho fica FORA do `entrada.bloco`: oculto ele não tem o que animar, e um
 * wrapper de altura zero continua sendo item flex e comeria o `gap` da página.
 */
export default async function MentoriasPage({ searchParams }: PageProps<'/mentorias'>) {
  const agora = new Date();
  const vista = lerVistaInicial(await searchParams);
  const sessoes = gerarAgendaExemplo(agora);

  return (
    <div className={styles.pagina}>
      <CabecalhoPagina titulo="Mentorias" oculto />

      <div className={entrada.bloco}>
        <MentoriasVista sessoes={sessoes} agoraIso={agora.toISOString()} vistaInicial={vista} />
      </div>
    </div>
  );
}
