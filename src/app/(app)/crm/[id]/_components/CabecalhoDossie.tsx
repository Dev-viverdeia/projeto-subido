import Link from 'next/link';
import { CalendarPlus, ContactRound, Globe2, Layers3, MapPin, Video } from 'lucide-react';
import { callPodeAbrir } from '@/lib/calls/tipos';
import { etapaAberta, rotuloEtapaVisivel } from '@/lib/crm/etapas';
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
  const projetoDaJornada = projetoSlug ?? lead.empresa.projetoSugeridoSlug ?? null;
  const oportunidadeAberta = etapaAberta(lead.oportunidade.etapa);
  const proximaReuniao = lead.calls
    .filter((call) => callPodeAbrir(call.status))
    .sort(
      (primeira, segunda) =>
        new Date(primeira.agendadaPara).getTime() - new Date(segunda.agendadaPara).getTime(),
    )[0];
  const hrefReuniao = proximaReuniao
    ? `/sala/${proximaReuniao.codigoPublico}`
    : `/reunioes?nova=1&oportunidade=${lead.oportunidade.id}`;
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
            {lead.totalCalls} {lead.totalCalls === 1 ? 'reunião' : 'reuniões'}
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

        {oportunidadeAberta ? (
          <nav className={styles.acoes} aria-label="Ações da ficha do cliente">
            <Link href={hrefReuniao} className={styles.acaoPrimaria}>
              {proximaReuniao ? (
                <Video size={16} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <CalendarPlus size={16} strokeWidth={1.8} aria-hidden="true" />
              )}
              {proximaReuniao ? 'Abrir próxima reunião' : 'Agendar reunião'}
            </Link>
            <AtalhoProposta lead={lead} destaque={false} projetoSlug={projetoDaJornada} />
            {temDossie && (
              <FormularioEnriquecimento
                oportunidadeId={lead.oportunidade.id}
                saldoCreditos={lead.saldoCreditos ?? 30}
                temDossie
                rotulo="Atualizar dados"
                tom="secundario"
                desabilitado={enriquecimentoEmAndamento}
              />
            )}
          </nav>
        ) : (
          <p className={styles.encerradaNota}>
            {lead.oportunidade.etapa === 'ganho'
              ? 'Venda concluída. Abra um novo ciclo abaixo quando houver outro projeto.'
              : 'Venda encerrada. O histórico e o motivo da perda continuam nesta ficha.'}
          </p>
        )}
      </div>
    </section>
  );
}
