'use client';

import { useCallback, useState } from 'react';
import {
  ArrowRight,
  AtSign,
  Building2,
  Globe2,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
} from 'lucide-react';
import {
  emailsDo,
  redesDo,
  rotuloStatusProspeccao,
  statusProspeccaoDo,
  telefonesDo,
  totalCanaisAcionaveis,
  type Lead,
  type StatusProspeccao,
} from './dossie';
import { ModalDossie } from './ModalDossie';
import styles from '../pagina.module.css';

export function ListaResultados({ leads }: { leads: Lead[] }) {
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [retornarFoco, setRetornarFoco] = useState<HTMLButtonElement | null>(null);
  const [filtro, setFiltro] = useState<'todos' | StatusProspeccao>('todos');
  const fecharModal = useCallback(() => setSelecionadoId(null), []);
  const filtrados =
    filtro === 'todos' ? leads : leads.filter((lead) => statusProspeccaoDo(lead) === filtro);

  const selecionado = selecionadoId
    ? (leads.find((lead) => lead.id === selecionadoId) ?? null)
    : null;

  if (!leads.length) {
    return (
      <div className={styles.semResultados}>
        <Building2 size={25} strokeWidth={1.5} aria-hidden="true" />
        <h3>Nenhuma empresa entrou nesta lista.</h3>
        <p>Amplie a região ou retire um filtro. Os créditos reservados já foram devolvidos.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.filtrosLeads} aria-label="Filtrar empresas por andamento">
        {(
          [
            ['todos', 'Todos'],
            ['novo', 'Não contatados'],
            ['tentando_contato', 'Em contato'],
            ['conversa_iniciada', 'Conversas'],
            ['sem_interesse', 'Sem interesse'],
            ['no_crm', 'No CRM'],
          ] as const
        ).map(([valor, rotulo]) => {
          const quantidade =
            valor === 'todos'
              ? leads.length
              : leads.filter((lead) => statusProspeccaoDo(lead) === valor).length;
          return (
            <button
              type="button"
              key={valor}
              aria-pressed={filtro === valor}
              onClick={() => setFiltro(valor)}
            >
              {rotulo} <span>{quantidade}</span>
            </button>
          );
        })}
      </div>
      <div className={styles.legendaLista} aria-hidden="true">
        <span>Empresa</span>
        <span>Canais acionáveis</span>
        <span>Região</span>
        <span>Andamento</span>
      </div>
      <div className={styles.listaResultados} role="list">
        {filtrados.map((lead, indice) => {
          const status = statusProspeccaoDo(lead);
          const totalCanais = totalCanaisAcionaveis(lead);
          return (
            <div role="listitem" key={lead.id}>
              <button
                type="button"
                className={styles.linhaLead}
                onClick={(evento) => {
                  setRetornarFoco(evento.currentTarget);
                  setSelecionadoId(lead.id);
                }}
              >
                <span className={styles.indiceLead}>{String(indice + 1).padStart(2, '0')}</span>
                <span className={styles.identidadeLead}>
                  <strong>{lead.nome}</strong>
                  <small>{lead.categoria ?? lead.endereco ?? 'Empresa local'}</small>
                </span>
                <span
                  className={styles.coberturaLead}
                  aria-label={`${totalCanais} ${totalCanais === 1 ? 'canal acionável encontrado' : 'canais acionáveis encontrados'}`}
                >
                  <span data-encontrado={telefonesDo(lead).length > 0} title="Telefone ou WhatsApp">
                    <Phone size={14} />
                  </span>
                  <span data-encontrado={emailsDo(lead).length > 0} title="E-mail">
                    <AtSign size={14} />
                  </span>
                  <span data-encontrado={Boolean(lead.site_url)} title="Site para pesquisa">
                    <Globe2 size={14} />
                  </span>
                  <span data-encontrado={redesDo(lead).length > 0} title="Redes sociais">
                    <Share2 size={14} />
                  </span>
                  <strong>{totalCanais}</strong>
                </span>
                <span className={styles.localLead}>
                  <MapPin size={14} aria-hidden="true" />
                  {[lead.cidade, lead.estado].filter(Boolean).join(', ') ||
                    lead.endereco ||
                    'A confirmar'}
                </span>
                <span className={styles.statusLead} data-status={status}>
                  <MessageCircle size={14} aria-hidden="true" />
                  {rotuloStatusProspeccao(status)}
                </span>
                <span
                  className={styles.estadoLead}
                  data-enviado={Boolean(lead.crm_oportunidade_id)}
                >
                  {lead.crm_oportunidade_id ? 'Abrir' : 'Prospectar'} <ArrowRight size={14} />
                </span>
              </button>
            </div>
          );
        })}
        {!filtrados.length && (
          <div className={styles.filtroVazio}>Nenhuma empresa está nesta etapa da prospecção.</div>
        )}
      </div>
      {selecionado && (
        <ModalDossie lead={selecionado} onClose={fecharModal} retornarFoco={retornarFoco} />
      )}
    </>
  );
}
