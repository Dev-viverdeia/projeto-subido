import { AtSign, ChevronDown, ExternalLink, Globe2, Mail, Phone, UserRound } from 'lucide-react';
import type { DossieEnriquecido } from '@/lib/crm/enriquecimento';
import type { DossieLead } from '@/lib/crm/queries';
import { montarContatosFicha, type CanalFicha } from '@/lib/crm/contatos-ficha';
import { CopiarCanal } from './CopiarCanal';
import styles from './InteligenciaDeContato.module.css';

const ROTULOS: Record<CanalFicha['tipo'], string> = {
  telefone: 'Telefone',
  email: 'E-mail',
  site: 'Site da empresa',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  x: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
};

function LinhaCanal({ canal }: { canal: CanalFicha }) {
  const Icone = canal.tipo === 'telefone' ? Phone : canal.tipo === 'email' ? Mail : AtSign;
  return (
    <li className={styles.canal}>
      <span className={styles.icone}>
        <Icone size={20} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <div className={styles.valor}>
        <span>
          {ROTULOS[canal.tipo]}
          {canal.pessoa && ` · ${canal.pessoa}`}
        </span>
        <strong>{canal.valor}</strong>
        <small>{canal.fontes.map((fonte) => fonte.nome).join(' · ')}</small>
      </div>
      <div className={styles.acoes}>
        <CopiarCanal
          valor={canal.tipo === 'telefone' || canal.tipo === 'email' ? canal.valor : canal.href}
        />
        {canal.whatsapp && (
          <a href={canal.whatsapp} target="_blank" rel="noreferrer" tabIndex={0}>
            WhatsApp
          </a>
        )}
        <a
          href={canal.href}
          tabIndex={0}
          target={canal.href.startsWith('http') ? '_blank' : undefined}
          rel="noreferrer"
        >
          {canal.tipo === 'telefone'
            ? 'Ligar'
            : canal.tipo === 'email'
              ? 'Escrever'
              : 'Abrir perfil'}
          {canal.href.startsWith('http') && <ExternalLink size={15} aria-hidden="true" />}
        </a>
      </div>
    </li>
  );
}

export function InteligenciaDeContato({
  lead,
  dossie = null,
}: {
  lead: DossieLead;
  dossie?: DossieEnriquecido | null;
}) {
  const contatos = lead.contatos ?? montarContatosFicha(lead, dossie);
  const site = contatos.canais.find((canal) => canal.tipo === 'site');
  const diretos = contatos.canais.filter((canal) => canal.tipo !== 'site');
  const principais = [
    diretos.find((canal) => canal.tipo === 'telefone'),
    diretos.find((canal) => canal.tipo === 'email'),
  ].filter((canal): canal is CanalFicha => Boolean(canal));
  if (!principais.length && diretos[0]) principais.push(diretos[0]);
  const extras = diretos.filter((canal) => !principais.includes(canal));
  const comFonte = diretos.filter((canal) => canal.fontes.some((fonte) => fonte.url));

  return (
    <section className={styles.contatos} aria-labelledby="contatos-ficha-titulo">
      <header className={styles.topo}>
        <h2 id="contatos-ficha-titulo">Contatos</h2>
        {site && (
          <a href={site.href} target="_blank" rel="noreferrer" tabIndex={0}>
            <Globe2 size={18} aria-hidden="true" /> Site da empresa{' '}
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        )}
      </header>
      {principais.length ? (
        <ul className={styles.lista} aria-label="Contatos principais">
          {principais.map((canal) => (
            <LinhaCanal key={canal.href} canal={canal} />
          ))}
        </ul>
      ) : (
        <div className={styles.vazio}>
          <Phone size={22} aria-hidden="true" />
          <div>
            <strong>Nenhum contato disponível</strong>
            <p>
              {site
                ? 'Consulte o site da empresa para encontrar um canal.'
                : 'Enriqueça os dados da ficha para buscar um canal de contato.'}
            </p>
          </div>
        </div>
      )}
      {extras.length > 0 && (
        <details className={styles.detalhes}>
          <summary>
            Outros canais <span>{extras.length}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <ul className={styles.lista} aria-label="Outros canais">
            {extras.map((canal) => (
              <LinhaCanal key={canal.href} canal={canal} />
            ))}
          </ul>
        </details>
      )}
      {contatos.pessoas.length > 0 && (
        <details className={styles.detalhes}>
          <summary>
            Pessoas envolvidas <span>{contatos.pessoas.length}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <ul className={styles.pessoas}>
            {contatos.pessoas.map((pessoa) => (
              <li key={pessoa.nome}>
                <UserRound size={20} aria-hidden="true" />
                <div>
                  <strong>{pessoa.nome}</strong>
                  {pessoa.cargo && <span>{pessoa.cargo}</span>}
                  <small>{pessoa.origem}</small>
                </div>
                {pessoa.linkedin && (
                  <a
                    href={pessoa.linkedin}
                    tabIndex={0}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir LinkedIn de ${pessoa.nome}`}
                  >
                    LinkedIn <ExternalLink size={15} aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
      {comFonte.length > 0 && (
        <details className={styles.detalhes}>
          <summary>
            Fontes dos contatos <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <ul className={styles.fontes}>
            {comFonte.map((canal) => (
              <li key={canal.href}>
                <strong>{canal.valor}</strong>
                {canal.fontes
                  .filter((fonte) => fonte.url)
                  .map((fonte) => (
                    <a
                      key={fonte.nome}
                      href={fonte.url!}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={0}
                    >
                      {fonte.nome} <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  ))}
              </li>
            ))}
          </ul>
        </details>
      )}
      {(contatos.telefonesOcultos || diretos.some((canal) => canal.whatsapp)) && (
        <footer className={styles.notas}>
          {contatos.telefonesOcultos && (
            <p>
              Telefones de uma coleta antiga foram ocultados. Os dados salvos foram preservados.
            </p>
          )}
          {diretos.some((canal) => canal.whatsapp) && (
            <p>Disponibilidade no WhatsApp não verificada.</p>
          )}
        </footer>
      )}
    </section>
  );
}
