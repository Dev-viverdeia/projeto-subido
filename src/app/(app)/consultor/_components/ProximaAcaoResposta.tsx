import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import type { MensagemDoConsultor } from '@/lib/consultor/queries';
import { ConfirmarAcaoCrm } from './ConfirmarAcaoCrm';
import styles from './LeituraResposta.module.css';

const DESTINOS = {
  '/inicio': 'Ir ao início',
  '/formacoes': 'Ver formações',
  '/solucoes': 'Escolher projeto',
  '/vendas': 'Ver vendas',
  '/reunioes': 'Ver reuniões',
  '/propostas': 'Ver propostas',
  '/propostas/nova': 'Criar proposta',
  '/builder': 'Abrir estúdio',
  '/mentorias': 'Ver mentorias',
} as const;

export function ProximaAcaoResposta({
  mensagem,
  modoPreview,
  gerarProximoPasso,
}: {
  mensagem: MensagemDoConsultor;
  modoPreview: boolean;
  gerarProximoPasso: boolean;
}) {
  if (!mensagem.direcao) return null;
  const { proximo_passo: passo, contexto_acao: contexto } = mensagem.direcao;
  const detalhes = (
    <details className={styles.motivo}>
      <summary>
        Por que este passo? <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <p>{passo.detalhe}</p>
      <p>
        <strong>Resultado esperado</strong> {passo.evidencia}
      </p>
      {contexto ? (
        <Link href={`/vendas/${contexto.oportunidade_id}`} className={styles.linkDiscreto}>
          Abrir ficha <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </details>
  );
  if (contexto)
    return (
      <ConfirmarAcaoCrm
        mensagemId={mensagem.id}
        contexto={contexto}
        confirmada={mensagem.acaoConfirmada}
        modoPreview={modoPreview}
        gerarProximoPasso={gerarProximoPasso}
        detalhes={detalhes}
      />
    );
  return (
    <aside className={styles.proximoPasso} aria-label="Próximo passo sugerido">
      <div className={styles.acaoCabecalho}>
        <div>
          <span className={styles.rotulo}>Próximo passo</span>
          <strong>{passo.titulo}</strong>
        </div>
        <Link href={passo.destino} className={styles.acaoPrincipal}>
          {DESTINOS[passo.destino]} <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
      {detalhes}
    </aside>
  );
}
