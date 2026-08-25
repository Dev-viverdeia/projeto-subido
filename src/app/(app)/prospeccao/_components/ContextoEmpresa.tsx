import { Building2, ExternalLink, Globe2, MapPin, Star } from 'lucide-react';
import { perfilEmpresaDo, type Lead } from './dossie';
import styles from './ModalProspeccao.module.css';

export function ContextoEmpresa({ lead }: { lead: Lead }) {
  const perfil = perfilEmpresaDo(lead);

  return (
    <section className={styles.research} aria-labelledby="pesquisa-titulo">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>Pesquisa da empresa</p>
          <h3 id="pesquisa-titulo">Pesquise antes de abordar</h3>
          <span>Esses links ajudam a preparar a mensagem, mas não contam como contato.</span>
        </div>
        <Building2 size={20} aria-hidden="true" />
      </div>
      <div className={styles.researchGrid}>
        {lead.site_url && (
          <a href={lead.site_url} target="_blank" rel="noreferrer">
            <Globe2 size={18} aria-hidden="true" />
            <span>
              <small>Site oficial</small>
              <strong>{lead.dominio ?? 'Abrir site'}</strong>
            </span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
        {lead.maps_url && (
          <a href={lead.maps_url} target="_blank" rel="noreferrer">
            <MapPin size={18} aria-hidden="true" />
            <span>
              <small>Google Maps</small>
              <strong>Ver perfil e avaliações</strong>
            </span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </div>

      <dl className={styles.companyFacts}>
        <div>
          <dt>Sobre</dt>
          <dd>
            {lead.descricao ?? 'Não encontramos uma descrição pública confiável para este negócio.'}
          </dd>
        </div>
        <div>
          <dt>Endereço</dt>
          <dd>{lead.endereco ?? 'Não encontrado'}</dd>
        </div>
        {lead.avaliacao !== null && (
          <div>
            <dt>Avaliação</dt>
            <dd>
              <Star size={14} fill="currentColor" aria-hidden="true" />
              {lead.avaliacao} · {lead.total_avaliacoes ?? 0} avaliações
            </dd>
          </div>
        )}
        {perfil.setor && (
          <div>
            <dt>Setor</dt>
            <dd>{perfil.setor}</dd>
          </div>
        )}
        {perfil.porte && (
          <div>
            <dt>Porte</dt>
            <dd>{perfil.porte}</dd>
          </div>
        )}
        {perfil.anoFundacao && (
          <div>
            <dt>Desde</dt>
            <dd>{perfil.anoFundacao}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
