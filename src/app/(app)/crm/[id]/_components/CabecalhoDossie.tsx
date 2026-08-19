import Link from 'next/link';
import { CalendarPlus, ContactRound, Globe2, Layers3, MapPin, Video } from 'lucide-react';
import { rotuloEtapaVisivel } from '@/lib/crm/etapas';
import type { DossieLead } from '@/lib/crm/queries';
import { AtalhoProposta } from './AtalhoProposta';
import { FormularioEnriquecimento } from './FormularioEnriquecimento';
import styles from './CabecalhoDossie.module.css';

export function CabecalhoDossie({
  lead,
  enriquecimentoEmAndamento,
  temDossie,
  projetoSlug = null,
}: {
  lead: DossieLead;
  enriquecimentoEmAndamento: boolean;
  temDossie: boolean;
  projetoSlug?: string | null;
}) {
  const local = [lead.empresa.cidade, lead.empresa.estado].filter(Boolean).join(' · ');
  const faseComercial = rotuloEtapaVisivel(lead.oportunidade.etapa);
  const cicloEntregue = lead.projetoRecente?.status === 'concluido';
  const estadoPesquisa = enriquecimentoEmAndamento
    ? 'Enriquecendo agora'
    : temDossie
      ? 'Ficha enriquecida'
      : 'Enriquecimento disponível';
  const chavePesquisa = enriquecimentoEmAndamento
    ? 'processando'
    : temDossie
      ? 'pronta'
      : 'pendente';

  return (
    <section className={styles.hero} aria-labelledby="dossie-titulo">
      <div className={styles.heroTopo}>
        <div className={styles.identidade}>
          <p className={styles.sobretitulo}>Ficha do cliente</p>
          <h1 id="dossie-titulo">{lead.empresa.nome}</h1>
          <p>{lead.oportunidade.titulo}</p>
        </div>

        <div className={styles.heroLateral}>
          <div className={styles.estadoAtual}>
            <span>Etapa da venda</span>
            <strong>{faseComercial}</strong>
            {!cicloEntregue && (
              <small data-estado={chavePesquisa}>
                <Layers3 size={13} strokeWidth={1.8} aria-hidden="true" /> {estadoPesquisa}
              </small>
            )}
          </div>
        </div>
      </div>

      <div className={styles.heroRodape}>
        <div className={styles.heroMeta} aria-label="Dados principais da ficha do cliente">
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

        <nav className={styles.acoes} aria-label="Ações da ficha do cliente">
          <Link
            href={`/calls?nova=1&oportunidade=${lead.oportunidade.id}`}
            className={styles.acaoPrimaria}
          >
            <CalendarPlus size={16} strokeWidth={1.8} aria-hidden="true" />
            Agendar call
          </Link>
          <AtalhoProposta lead={lead} destaque={false} projetoSlug={projetoSlug} />
          <FormularioEnriquecimento
            oportunidadeId={lead.oportunidade.id}
            saldoCreditos={lead.saldoCreditos ?? 30}
            temDossie={temDossie}
            rotulo={temDossie ? 'Atualizar enriquecimento' : 'Enriquecer oportunidade'}
            tom="secundario"
            desabilitado={enriquecimentoEmAndamento}
          />
        </nav>
      </div>
    </section>
  );
}
