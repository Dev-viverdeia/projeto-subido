import { AtSign, ExternalLink, Globe2, Mail, Phone, Send, UserRoundSearch } from 'lucide-react';
import type { DossieEnriquecido } from '@/lib/crm/enriquecimento';
import type { DossieLead } from '@/lib/crm/queries';
import styles from './PesquisaComercial.module.css';

type CanalContato = NonNullable<DossieEnriquecido['inteligenciaContato']>['canais'][number];

const ROTULO_CANAL: Record<CanalContato['tipo'], string> = {
  telefone: 'Telefone / WhatsApp',
  email: 'E-mail',
  site: 'Site',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  x: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
};

function IconeCanal({ tipo }: { tipo: CanalContato['tipo'] }) {
  const Icone =
    tipo === 'telefone'
      ? Phone
      : tipo === 'email'
        ? Mail
        : tipo === 'site'
          ? Globe2
          : tipo === 'instagram' || tipo === 'facebook' || tipo === 'linkedin'
            ? AtSign
            : Send;
  return <Icone size={17} strokeWidth={1.7} aria-hidden="true" />;
}

function urlWhatsapp(telefone: string): string | null {
  let digitos = telefone.replace(/\D/g, '');
  if ((digitos.length === 10 || digitos.length === 11) && !digitos.startsWith('55')) {
    digitos = `55${digitos}`;
  }
  return digitos.length >= 12 && digitos.length <= 13 ? `https://wa.me/${digitos}` : null;
}

export function InteligenciaDeContato({
  lead,
  dossie,
}: {
  lead: DossieLead;
  dossie: DossieEnriquecido;
}) {
  const encontrada = dossie.inteligenciaContato;
  const canais: CanalContato[] = encontrada?.canais ?? [
    ...(lead.contato?.telefone
      ? [
          {
            tipo: 'telefone' as const,
            valor: lead.contato.telefone,
            url: `tel:${lead.contato.telefone.replace(/\D/g, '')}`,
            origem: 'crm' as const,
          },
        ]
      : []),
    ...(lead.contato?.email
      ? [
          {
            tipo: 'email' as const,
            valor: lead.contato.email,
            url: `mailto:${lead.contato.email}`,
            origem: 'crm' as const,
          },
        ]
      : []),
    ...(lead.empresa.dominio
      ? [
          {
            tipo: 'site' as const,
            valor: lead.empresa.dominio,
            url: `https://${lead.empresa.dominio.replace(/^https?:\/\//, '')}`,
            origem: 'crm' as const,
          },
        ]
      : []),
  ];
  const pessoas = encontrada?.pessoas ?? [];

  return (
    <section className={styles.inteligenciaContato} aria-labelledby="contatos-encontrados-titulo">
      <header>
        <div>
          <p>Pronto para abordar</p>
          <h3 id="contatos-encontrados-titulo">Canais e pessoas encontradas</h3>
          <span>Dados públicos e cadastrais reunidos, com fatos e hipóteses separados.</span>
        </div>
        <div className={styles.resumoInteligencia}>
          <span>
            <strong>{canais.length}</strong> {canais.length === 1 ? 'canal' : 'canais'}
          </span>
          <span>
            <strong>{pessoas.length}</strong> {pessoas.length === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </div>
      </header>

      <div className={styles.corpoInteligencia}>
        <div className={styles.canaisEncontrados}>
          <p>Canais para começar o contato</p>
          {canais.length ? (
            <div className={styles.gradeCanais}>
              {canais.map((canal, indice) => {
                const whatsapp = canal.tipo === 'telefone' ? urlWhatsapp(canal.valor) : null;
                return (
                  <article key={`${canal.tipo}-${canal.valor}-${indice}`}>
                    <span className={styles.iconeCanal}>
                      <IconeCanal tipo={canal.tipo} />
                    </span>
                    <div>
                      <small>{ROTULO_CANAL[canal.tipo]}</small>
                      <strong>{canal.valor}</strong>
                      <span>
                        {canal.origem === 'prospeccao'
                          ? 'Encontrado na Prospecção'
                          : 'Já estava na ficha'}
                      </span>
                    </div>
                    <div className={styles.acoesCanal}>
                      {whatsapp && (
                        <a href={whatsapp} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                      )}
                      {canal.url && (
                        <a
                          href={canal.url}
                          target={canal.url.startsWith('http') ? '_blank' : undefined}
                          rel="noreferrer"
                        >
                          {canal.tipo === 'telefone'
                            ? 'Ligar'
                            : canal.tipo === 'email'
                              ? 'Escrever'
                              : 'Abrir'}
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className={styles.estadoContatoVazio}>
              Nenhum canal direto foi confirmado. Use o site ou a primeira call para localizar o
              contato certo.
            </p>
          )}
        </div>

        <div className={styles.pessoasEncontradas}>
          <p>Quem pode participar da decisão</p>
          {pessoas.length ? (
            <div className={styles.listaPessoas}>
              {pessoas.map((pessoa, indice) => (
                <article key={`${pessoa.nome}-${indice}`}>
                  <span className={styles.iconePessoa}>
                    <UserRoundSearch size={18} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <div>
                    <span className={styles.estadoPessoa} data-status={pessoa.status}>
                      {pessoa.status === 'confirmada' ? 'Contato confirmado' : 'Possível decisor'}
                    </span>
                    <strong>{pessoa.nome}</strong>
                    <small>{pessoa.cargo ?? pessoa.evidencia}</small>
                  </div>
                  {pessoa.linkedinUrl && (
                    <a
                      href={pessoa.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Abrir LinkedIn de ${pessoa.nome}`}
                    >
                      <ExternalLink size={15} strokeWidth={1.7} aria-hidden="true" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.estadoPessoaVazio}>
              <UserRoundSearch size={19} strokeWidth={1.7} aria-hidden="true" />
              <div>
                <strong>A pessoa certa ainda não foi confirmada.</strong>
                <span>Pergunte quem lidera o processo e quem aprova um piloto.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
