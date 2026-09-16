import Link from 'next/link';
import type { ReactNode } from 'react';
import { EditarEmpresa } from './EditarEmpresa';
import { EditarVenda } from './EditarVenda';
import { valorPrevistoCampo } from '@/lib/crm/venda-schema';
import { CalendarPlus, ContactRound, Globe2, Layers3, MapPin, Video } from 'lucide-react';
import { etapaAberta, rotuloEtapaVisivel } from '@/lib/crm/etapas';
import { proximaReuniaoDoLead } from '@/lib/crm/ciclo-cliente';
import { tituloDoProjetoNoCard } from '@/lib/crm/acao-pipeline';
import type { DossieLead } from '@/lib/crm/queries';
import { AtalhoProposta } from './AtalhoProposta';
import { AcoesOportunidade } from '../../_components/AcoesOportunidade';
import { estaNoFluxo, ROTULO_SITUACAO } from '@/lib/crm/situacao';
import { FormularioEnriquecimento } from './FormularioEnriquecimento';
import styles from './CabecalhoDossie.module.css';
import { urlContatoPublica } from '@/lib/crm/contatos-ficha';

export function CabecalhoDossie({
  lead,
  enriquecimentoEmAndamento,
  temDossie,
  projetoSlug = null,
  edicaoEmpresa,
  edicaoVenda,
}: {
  lead: DossieLead;
  enriquecimentoEmAndamento: boolean;
  temDossie: boolean;
  projetoSlug?: string | null;
  edicaoEmpresa?: ReactNode;
  edicaoVenda?: ReactNode;
}) {
  const local = [lead.empresa.cidade, lead.empresa.estado].filter(Boolean).join(' · ');
  const site = urlContatoPublica(lead.empresa.dominio);
  const noFluxo = estaNoFluxo(lead.oportunidade);
  const faseComercial = noFluxo
    ? lead.oportunidade.etapa === 'ganho'
      ? 'Ganho'
      : rotuloEtapaVisivel(lead.oportunidade.etapa)
    : ROTULO_SITUACAO[lead.oportunidade.situacao!];
  const projetoDaJornada = projetoSlug ?? lead.empresa.projetoSugeridoSlug ?? null;
  const oportunidadeAberta = noFluxo && etapaAberta(lead.oportunidade.etapa);
  const proximaReuniao = proximaReuniaoDoLead(lead);
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
          <div className={styles.identidadeTopo}>
            <p className={styles.sobretitulo}>Ficha do cliente</p>
            {edicaoEmpresa ??
              (lead.edicaoEmpresa && (
                <EditarEmpresa
                  inicial={{
                    oportunidade: lead.oportunidade.id,
                    empresaId: lead.edicaoEmpresa.id,
                    revisao: lead.edicaoEmpresa.revisao,
                    nome: lead.empresa.nome,
                    site: lead.empresa.dominio ?? '',
                  }}
                />
              ))}
          </div>
          <h1 id="dossie-titulo">{lead.empresa.nome}</h1>
          <p className={styles.nomeProjeto}>
            {tituloDoProjetoNoCard(lead.oportunidade.titulo, lead.empresa.nome)}
          </p>
          <div className={styles.venda}>
            <p className={styles.valorVenda}>
              <span>Valor previsto</span>
              <strong>
                {lead.oportunidade.valorCentavos === null
                  ? 'A definir'
                  : `R$ ${valorPrevistoCampo(lead.oportunidade.valorCentavos)}`}
              </strong>
            </p>
            {edicaoVenda ??
              (lead.edicaoVenda && (
                <EditarVenda
                  inicial={{
                    oportunidade: lead.oportunidade.id,
                    revisao: lead.edicaoVenda.revisao,
                    titulo: lead.oportunidade.titulo,
                    valor: valorPrevistoCampo(lead.oportunidade.valorCentavos),
                  }}
                />
              ))}
          </div>
        </div>

        <div className={styles.heroLateral}>
          <AcoesOportunidade oportunidade={lead.oportunidade} />
          <div className={styles.estadoAtual}>
            <span>Etapa da venda</span>
            <strong>{faseComercial}</strong>
            {!cicloEntregue && noFluxo && (
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
          {site && (
            <a href={site} target="_blank" rel="noreferrer">
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
        ) : noFluxo && lead.oportunidade.etapa === 'ganho' ? (
          <nav className={styles.acoes} aria-label="Ações da ficha do cliente">
            <AtalhoProposta lead={lead} projetoSlug={projetoDaJornada} />
          </nav>
        ) : (
          <p className={styles.encerradaNota}>
            {!noFluxo
              ? 'Fora do fluxo. O histórico está preservado; use Mais ações para restaurar.'
              : 'Venda encerrada. O histórico e o motivo da perda continuam nesta ficha.'}
          </p>
        )}
      </div>
    </section>
  );
}
