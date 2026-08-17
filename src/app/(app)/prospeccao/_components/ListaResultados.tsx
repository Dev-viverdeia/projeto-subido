'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Check,
  ExternalLink,
  Globe2,
  MapPin,
  Phone,
  Star,
  X,
} from 'lucide-react';
import { Button } from '@/design-system/via';
import { enviarLeadAoCrm } from '@/lib/prospeccao/actions';
import type { Tables } from '@/lib/supabase/types.generated';
import styles from '../pagina.module.css';

type Lead = Pick<
  Tables<'prospeccao_leads'>,
  | 'id'
  | 'nome'
  | 'categoria'
  | 'endereco'
  | 'cidade'
  | 'estado'
  | 'site_url'
  | 'telefone'
  | 'avaliacao'
  | 'total_avaliacoes'
  | 'descricao'
  | 'fontes'
  | 'crm_oportunidade_id'
  | 'enviado_crm_em'
>;

function fontesDo(lead: Lead): string[] {
  return Array.isArray(lead.fontes)
    ? lead.fontes.filter((fonte): fonte is string => typeof fonte === 'string')
    : [];
}

export function ListaResultados({ leads }: { leads: Lead[] }) {
  const [selecionado, setSelecionado] = useState<Lead | null>(null);
  const fecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selecionado) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    fecharRef.current?.focus();
    const fechar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setSelecionado(null);
    };
    window.addEventListener('keydown', fechar);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', fechar);
    };
  }, [selecionado]);

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
      <div className={styles.listaResultados} role="list">
        {leads.map((lead, indice) => (
          <div role="listitem" key={lead.id}>
            <button type="button" className={styles.linhaLead} onClick={() => setSelecionado(lead)}>
              <span className={styles.indiceLead}>{String(indice + 1).padStart(2, '0')}</span>
              <span className={styles.identidadeLead}>
                <strong>{lead.nome}</strong>
                <small>{lead.categoria ?? lead.endereco ?? 'Empresa local'}</small>
              </span>
              <span className={styles.localLead}>
                <MapPin size={14} aria-hidden="true" />
                {[lead.cidade, lead.estado].filter(Boolean).join(', ') ||
                  lead.endereco ||
                  'Local a confirmar'}
              </span>
              <span className={styles.sinaisLead}>
                {lead.avaliacao !== null && (
                  <span>
                    <Star size={13} fill="currentColor" aria-hidden="true" /> {lead.avaliacao}
                  </span>
                )}
                {lead.site_url && <span>Site</span>}
                {lead.telefone && <span>Telefone</span>}
              </span>
              <span className={styles.estadoLead} data-enviado={Boolean(lead.crm_oportunidade_id)}>
                {lead.crm_oportunidade_id ? (
                  <>
                    <Check size={14} aria-hidden="true" /> No CRM
                  </>
                ) : (
                  <>
                    Abrir <ArrowRight size={14} aria-hidden="true" />
                  </>
                )}
              </span>
            </button>
          </div>
        ))}
      </div>

      {selecionado && (
        <div
          className={styles.fundoDetalhe}
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setSelecionado(null);
          }}
        >
          <aside
            className={styles.detalheLead}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-detalhe-titulo"
          >
            <header className={styles.detalheTopo}>
              <div>
                <p>Empresa encontrada</p>
                <h2 id="lead-detalhe-titulo">{selecionado.nome}</h2>
                <span>{selecionado.categoria ?? 'Categoria a confirmar'}</span>
              </div>
              <button
                ref={fecharRef}
                type="button"
                onClick={() => setSelecionado(null)}
                aria-label="Fechar detalhes"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.detalheConteudo}>
              <dl className={styles.fatosLead}>
                <div>
                  <dt>Localização</dt>
                  <dd>{selecionado.endereco ?? 'Ainda não confirmada'}</dd>
                </div>
                <div>
                  <dt>Telefone</dt>
                  <dd>{selecionado.telefone ?? 'Não encontrado'}</dd>
                </div>
                <div>
                  <dt>Avaliação pública</dt>
                  <dd>
                    {selecionado.avaliacao !== null
                      ? `${selecionado.avaliacao} · ${selecionado.total_avaliacoes ?? 0} avaliações`
                      : 'Sem avaliação disponível'}
                  </dd>
                </div>
              </dl>

              {selecionado.descricao && (
                <section className={styles.contextoLead}>
                  <p>Contexto público</p>
                  <span>{selecionado.descricao}</span>
                </section>
              )}

              <section className={styles.fontesLead}>
                <p>Fontes consultadas</p>
                <div>
                  {fontesDo(selecionado).map((fonte) => (
                    <span key={fonte}>{fonte}</span>
                  ))}
                </div>
              </section>

              <div className={styles.linksLead}>
                {selecionado.site_url && (
                  <a href={selecionado.site_url} target="_blank" rel="noreferrer">
                    <Globe2 size={16} aria-hidden="true" /> Abrir site{' '}
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                )}
                {selecionado.telefone && (
                  <a href={`tel:${selecionado.telefone}`}>
                    <Phone size={16} aria-hidden="true" /> Ligar
                  </a>
                )}
              </div>
            </div>

            <footer className={styles.detalheRodape}>
              {selecionado.crm_oportunidade_id ? (
                <Link
                  href={`/crm/${selecionado.crm_oportunidade_id}`}
                  className="via-btn via-btn--primary via-btn--md"
                >
                  <span className="via-btn__label">Abrir no CRM</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <form action={enviarLeadAoCrm}>
                  <input type="hidden" name="lead" value={selecionado.id} />
                  <Button type="submit" variant="primary" iconRight={<ArrowRight size={16} />}>
                    Enviar para o CRM
                  </Button>
                </form>
              )}
              <p>No CRM, você completa o contato e enriquece o lead com IA.</p>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
