import {
  AtSign,
  BriefcaseBusiness,
  Camera,
  ChevronDown,
  Mail,
  Phone,
  Play,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { CanalContatoProspeccao } from '@/lib/prospeccao/schema';
import { telefoneDe } from '@/lib/prospeccao/contatos';
import { AcaoContatoProspeccao } from './AcaoContatoProspeccao';
import { CopiarContato } from './CopiarContato';
import {
  emailsDo,
  fonteDoContato,
  identificadorRede,
  redesDo,
  rotuloRede,
  telefonesDo,
  type Lead,
} from './dossie';
import styles from './ModalProspeccao.module.css';

type Contato = {
  chave: string;
  tipo: 'telefone' | 'email' | 'rede';
  valor: string;
  rotulo: string;
  icone: ReactNode;
  canal: CanalContatoProspeccao;
  href: string;
  copiar: string;
};

export function ContatosEmpresa({ lead }: { lead: Lead }) {
  const telefones: Contato[] = telefonesDo(lead).map((valor, i) => ({
    chave: `tel:${valor}`,
    tipo: 'telefone',
    valor,
    rotulo: i === 0 ? 'Telefone principal' : 'Outro telefone',
    icone: <Phone size={20} aria-hidden="true" />,
    canal: 'telefone',
    href: telefoneDe(valor)!.tel,
    copiar: valor,
  }));
  const emails: Contato[] = emailsDo(lead).map((valor) => ({
    chave: `email:${valor}`,
    tipo: 'email',
    valor,
    rotulo: 'E-mail',
    icone: <Mail size={20} aria-hidden="true" />,
    canal: 'email',
    href: `mailto:${valor}`,
    copiar: valor,
  }));
  const redes: Contato[] = redesDo(lead).map((rede) => ({
    chave: rede.url,
    tipo: 'rede',
    valor: identificadorRede(rede),
    rotulo: rotuloRede(rede.rede),
    icone:
      rede.rede === 'instagram' ? (
        <Camera size={20} aria-hidden="true" />
      ) : rede.rede === 'linkedin' ? (
        <BriefcaseBusiness size={20} aria-hidden="true" />
      ) : rede.rede === 'facebook' ? (
        <Users size={20} aria-hidden="true" />
      ) : rede.rede === 'youtube' ? (
        <Play size={20} aria-hidden="true" />
      ) : (
        <AtSign size={20} aria-hidden="true" />
      ),
    canal: rede.rede,
    href: rede.url,
    copiar: rede.url,
  }));
  const principais = [telefones[0], emails[0], redes[0]].filter((contato): contato is Contato =>
    Boolean(contato),
  );
  const extras = [...telefones.slice(1), ...emails.slice(1), ...redes.slice(1)];

  function linha(contato: Contato) {
    const whatsapp = contato.tipo === 'telefone' ? telefoneDe(contato.valor)?.whatsapp : null;
    return (
      <li className={styles.contactRow} key={contato.chave}>
        <span className={styles.contactIcon}>{contato.icone}</span>
        <div className={styles.contactData}>
          <span>{contato.rotulo}</span>
          <strong>{contato.valor}</strong>
          <small>{fonteDoContato(lead, contato.tipo, contato.copiar)}</small>
        </div>
        <div className={styles.contactActions}>
          <CopiarContato valor={contato.copiar} />
          {whatsapp && (
            <AcaoContatoProspeccao lead={lead.id} canal="whatsapp" href={whatsapp}>
              WhatsApp
            </AcaoContatoProspeccao>
          )}
          <AcaoContatoProspeccao lead={lead.id} canal={contato.canal} href={contato.href}>
            {contato.tipo === 'telefone'
              ? 'Ligar'
              : contato.tipo === 'email'
                ? 'Escrever'
                : 'Abrir perfil'}
          </AcaoContatoProspeccao>
        </div>
      </li>
    );
  }

  return (
    <section
      className={`${styles.section} ${styles.contactsSection}`}
      aria-labelledby="canais-titulo"
    >
      <div className={styles.sectionHeading}>
        <h3 id="canais-titulo">Contatos da empresa</h3>
      </div>
      {principais.length ? (
        <ul className={styles.contactList} aria-label="Contatos principais">
          {principais.map(linha)}
        </ul>
      ) : (
        <div className={styles.noContacts}>
          <Phone size={20} aria-hidden="true" />
          <div>
            <strong>Nenhum contato disponível</strong>
            <span>Consulte o site ou o Google Maps para encontrar um canal da empresa.</span>
          </div>
        </div>
      )}
      {extras.length > 0 && (
        <details className={styles.moreContacts}>
          <summary>
            Outros contatos <span>{extras.length}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <ul className={styles.contactList} aria-label="Outros contatos">
            {extras.map(linha)}
          </ul>
        </details>
      )}
      {telefones.some((contato) => telefoneDe(contato.valor)?.whatsapp) && (
        <p className={styles.contactNote}>Disponibilidade no WhatsApp não verificada.</p>
      )}
    </section>
  );
}
