import { ContactRound, Database, Globe2, Layers3, MapPin, Video } from 'lucide-react';
import { FASES_CRM, ROTULO_ETAPA, faseDaEtapa } from '@/lib/crm/etapas';
import type { DossieLead } from '@/lib/crm/queries';
import styles from '../pagina.module.css';
import { AtalhoDiagnostico } from './AtalhoDiagnostico';
import { AtalhoProposta } from './AtalhoProposta';
import { FormularioEnriquecimento } from './FormularioEnriquecimento';

export function CabecalhoDossie({
  lead,
  enriquecimentoEmAndamento,
  temDossie,
}: {
  lead: DossieLead;
  enriquecimentoEmAndamento: boolean;
  temDossie: boolean;
}) {
  const local = [lead.empresa.cidade, lead.empresa.estado].filter(Boolean).join(' · ');
  const faseComercial =
    FASES_CRM.find((fase) => fase.id === faseDaEtapa(lead.oportunidade.etapa))?.rotulo ??
    ROTULO_ETAPA[lead.oportunidade.etapa];

  return (
    <section className={styles.hero} aria-labelledby="dossie-titulo">
      <div className={styles.heroTopo}>
        <div className={styles.identidade}>
          <p className={styles.sobretitulo}>Dossiê comercial</p>
          <h1 id="dossie-titulo">{lead.empresa.nome}</h1>
          <p>{lead.oportunidade.titulo}</p>
        </div>

        <div className={styles.heroAcoes}>
          <AtalhoDiagnostico oportunidadeId={lead.oportunidade.id} />
          <AtalhoProposta lead={lead} />
          {!enriquecimentoEmAndamento && (
            <FormularioEnriquecimento
              oportunidadeId={lead.oportunidade.id}
              dominioInicial={lead.empresa.dominio}
              linkedinInicial={lead.contato?.linkedinUrl ?? null}
              temDossie={temDossie}
            />
          )}
        </div>
      </div>

      <div className={styles.heroMeta} aria-label="Contexto principal do lead">
        <span className={styles.etapa}>
          <small>Etapa</small>
          <strong>{faseComercial}</strong>
        </span>
        <span>
          <ContactRound size={14} aria-hidden="true" />
          {lead.contato?.nome ?? 'Contato não informado'}
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
      </div>

      <div className={styles.sinais} aria-label="Sinais que alimentam o dossiê">
        <div className={styles.fonteSinal}>
          <Database size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>CRM</span>
          <strong>{lead.eventos.length} fatos</strong>
        </div>
        <div className={styles.fonteSinal}>
          <Globe2 size={17} strokeWidth={1.7} aria-hidden="true" />
          <span>Site público</span>
          <strong>{lead.empresa.dominio ?? 'a informar'}</strong>
        </div>
        <div className={`${styles.fonteSinal} ${styles.leituraSinal}`}>
          <Layers3 size={17} strokeWidth={1.8} aria-hidden="true" />
          <span>Leitura IA</span>
          <strong>
            {enriquecimentoEmAndamento
              ? 'analisando'
              : temDossie
                ? 'dossiê pronto'
                : 'não iniciada'}
          </strong>
        </div>
      </div>
    </section>
  );
}
