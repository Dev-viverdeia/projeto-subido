'use client';

import { useCallback, useState } from 'react';
import {
  ArrowRight,
  AtSign,
  Building2,
  Check,
  Globe2,
  MapPin,
  Phone,
  Share2,
  UserRoundSearch,
} from 'lucide-react';
import { qualificacaoDo, type Lead } from './dossie';
import { ModalDossie } from './ModalDossie';
import styles from '../pagina.module.css';

export function ListaResultados({ leads }: { leads: Lead[] }) {
  const [selecionado, setSelecionado] = useState<Lead | null>(null);
  const [retornarFoco, setRetornarFoco] = useState<HTMLButtonElement | null>(null);
  const fecharModal = useCallback(() => setSelecionado(null), []);

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
      <div className={styles.legendaLista} aria-hidden="true">
        <span>Empresa</span>
        <span>Contatos encontrados</span>
        <span>Região</span>
        <span>Completude</span>
      </div>
      <div className={styles.listaResultados} role="list">
        {leads.map((lead, indice) => {
          const qualificacao = qualificacaoDo(lead);
          const totalItens = Object.values(qualificacao.itens).filter(Boolean).length;
          return (
            <div role="listitem" key={lead.id}>
              <button
                type="button"
                className={styles.linhaLead}
                onClick={(evento) => {
                  setRetornarFoco(evento.currentTarget);
                  setSelecionado(lead);
                }}
              >
                <span className={styles.indiceLead}>{String(indice + 1).padStart(2, '0')}</span>
                <span className={styles.identidadeLead}>
                  <strong>{lead.nome}</strong>
                  <small>{lead.categoria ?? lead.endereco ?? 'Empresa local'}</small>
                </span>
                <span
                  className={styles.coberturaLead}
                  aria-label={`${totalItens} de 5 dados essenciais encontrados`}
                >
                  <span data-encontrado={qualificacao.itens.telefone} title="Telefone">
                    <Phone size={14} />
                  </span>
                  <span data-encontrado={qualificacao.itens.email} title="E-mail">
                    <AtSign size={14} />
                  </span>
                  <span data-encontrado={qualificacao.itens.site} title="Site">
                    <Globe2 size={14} />
                  </span>
                  <span data-encontrado={qualificacao.itens.redes_sociais} title="Redes sociais">
                    <Share2 size={14} />
                  </span>
                  <span data-encontrado={qualificacao.itens.decisores} title="Possível decisor">
                    <UserRoundSearch size={14} />
                  </span>
                </span>
                <span className={styles.localLead}>
                  <MapPin size={14} aria-hidden="true" />
                  {[lead.cidade, lead.estado].filter(Boolean).join(', ') ||
                    lead.endereco ||
                    'A confirmar'}
                </span>
                <span className={styles.completudeLead}>
                  <span>
                    <i style={{ width: `${qualificacao.completude}%` }} />
                  </span>
                  <strong>{qualificacao.completude}%</strong>
                </span>
                <span
                  className={styles.estadoLead}
                  data-enviado={Boolean(lead.crm_oportunidade_id)}
                >
                  {lead.crm_oportunidade_id ? (
                    <>
                      <Check size={14} /> No CRM
                    </>
                  ) : (
                    <>
                      Ver dossiê <ArrowRight size={14} />
                    </>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      {selecionado && (
        <ModalDossie lead={selecionado} onClose={fecharModal} retornarFoco={retornarFoco} />
      )}
    </>
  );
}
