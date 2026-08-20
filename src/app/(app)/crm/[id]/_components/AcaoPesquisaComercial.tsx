import type { DossieEnriquecido } from '@/lib/crm/enriquecimento';
import { etapaAberta } from '@/lib/crm/etapas';
import type { DossieLead } from '@/lib/crm/queries';
import { BotaoProximaAcao } from './BotaoProximaAcao';
import styles from './PesquisaComercial.module.css';

export function AcaoPesquisaComercial({
  lead,
  dossie,
  enriquecimentoId,
}: {
  lead: DossieLead;
  dossie: DossieEnriquecido;
  enriquecimentoId: string;
}) {
  const oportunidadeAberta = etapaAberta(lead.oportunidade.etapa);
  const salva = lead.oportunidade.proximaAcao === dossie.proximaAcao.acao;

  return (
    <aside
      className={styles.proximaAcao}
      aria-labelledby="acao-recomendada-titulo"
      data-encerrada={!oportunidadeAberta || undefined}
    >
      {oportunidadeAberta ? (
        <>
          <p>Próximo passo sugerido</p>
          <h3 id="acao-recomendada-titulo">{dossie.proximaAcao.acao}</h3>
          <span>{dossie.proximaAcao.porque}</span>
          <BotaoProximaAcao
            oportunidadeId={lead.oportunidade.id}
            enriquecimentoId={enriquecimentoId}
            salva={salva}
          />
        </>
      ) : (
        <>
          <p>Pesquisa arquivada</p>
          <h3 id="acao-recomendada-titulo">Esta leitura fica salva para consulta.</h3>
          <span>As fontes e informações usadas na venda continuam disponíveis abaixo.</span>
        </>
      )}
    </aside>
  );
}
