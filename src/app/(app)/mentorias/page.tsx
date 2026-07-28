import type { Metadata } from 'next';
import { Alert } from '@/design-system/via';
import { gerarAgendaExemplo } from '@/content/mentorias';
import { CabecalhoPagina } from '../_components/CabecalhoPagina';
import entrada from '../_components/entrada.module.css';
import { AgendaMentorias } from './_components/AgendaMentorias';
import styles from './pagina.module.css';

export const metadata: Metadata = { title: 'Mentorias' };

/**
 * Agenda de mentorias — nesta fase, com dados de DEMONSTRAÇÃO declarados como
 * tal no Alert abaixo. A rota é dinâmica, então `new Date()` aqui é o instante
 * real de cada visita; a agenda de exemplo se posiciona em volta dele para
 * todos os estados da matriz ficarem visíveis.
 */
export default function MentoriasPage() {
  const agora = new Date();
  const sessoes = gerarAgendaExemplo(agora);

  return (
    <div className={styles.pagina}>
      <div className={entrada.bloco}>
        <CabecalhoPagina
          titulo="Mentorias"
          descricao="Encontros em grupo toda semana. Você chega com o problema real e sai com o próximo passo."
        />
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso1}`}>
        <Alert tone="info" title="Agenda de demonstração">
          As sessões abaixo são exemplos para você conhecer o fluxo. A agenda real entra quando o
          calendário for ligado ao banco — junto com a sala de vídeo dentro da plataforma.
        </Alert>
      </div>

      <div className={`${entrada.bloco} ${entrada.atraso2}`}>
        <AgendaMentorias sessoes={sessoes} agoraIso={agora.toISOString()} />
      </div>
    </div>
  );
}
