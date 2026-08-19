import { ContactRound, Globe2, Layers3, MapPin, Video } from 'lucide-react';
import { rotuloEtapaVisivel } from '@/lib/crm/etapas';
import type { DossieLead } from '@/lib/crm/queries';
import { AtalhoProposta } from './AtalhoProposta';
import { FormularioEnriquecimento } from './FormularioEnriquecimento';
import styles from './CabecalhoDossie.module.css';

export function CabecalhoDossie({
  lead,
  enriquecimentoEmAndamento,
  temDossie,
  modoEntrada = false,
}: {
  lead: DossieLead;
  enriquecimentoEmAndamento: boolean;
  temDossie: boolean;
  modoEntrada?: boolean;
}) {
  const local = [lead.empresa.cidade, lead.empresa.estado].filter(Boolean).join(' · ');
  const faseComercial = rotuloEtapaVisivel(lead.oportunidade.etapa);
  const cicloEntregue = lead.projetoRecente?.status === 'concluido';
  const estadoPesquisa = enriquecimentoEmAndamento
    ? 'Pesquisando agora'
    : temDossie
      ? 'Pesquisa pronta'
      : 'Pesquisa pendente';

  return (
    <section className={styles.hero} aria-labelledby="dossie-titulo">
      <div className={styles.heroTopo}>
        <div className={styles.identidade}>
          <p className={styles.sobretitulo}>
            {modoEntrada ? 'Nova oportunidade' : 'Oportunidade no CRM'}
          </p>
          <h1 id="dossie-titulo">{lead.empresa.nome}</h1>
          <p>{lead.oportunidade.titulo}</p>
        </div>

        {!modoEntrada && (
          <div className={styles.heroLateral}>
            <div className={styles.estadoAtual}>
              <span>Etapa da venda</span>
              <strong>{faseComercial}</strong>
              {!cicloEntregue && (
                <small>
                  <Layers3 size={13} strokeWidth={1.8} aria-hidden="true" /> {estadoPesquisa}
                </small>
              )}
            </div>
            <div className={styles.heroAcoes}>
              {!cicloEntregue && !enriquecimentoEmAndamento && (
                <FormularioEnriquecimento
                  oportunidadeId={lead.oportunidade.id}
                  dominioInicial={lead.empresa.dominio}
                  linkedinInicial={lead.contato?.linkedinUrl ?? null}
                  temDossie={temDossie}
                />
              )}
              <AtalhoProposta lead={lead} destaque={temDossie || cicloEntregue} />
            </div>
          </div>
        )}
      </div>

      <div className={styles.heroMeta} aria-label="Dados principais da oportunidade">
        <span>
          <ContactRound size={14} aria-hidden="true" />
          {lead.contato?.nome ?? 'Contato a definir'}
        </span>
        <span>
          <Video size={14} aria-hidden="true" />
          {lead.totalCalls} {lead.totalCalls === 1 ? 'call' : 'calls'}
        </span>
        {local && (
          <span>
            <MapPin size={14} aria-hidden="true" /> {local}
          </span>
        )}
        {lead.empresa.dominio && (
          <a href={`https://${lead.empresa.dominio}`} target="_blank" rel="noreferrer">
            <Globe2 size={14} aria-hidden="true" /> {lead.empresa.dominio}
          </a>
        )}
      </div>
    </section>
  );
}
