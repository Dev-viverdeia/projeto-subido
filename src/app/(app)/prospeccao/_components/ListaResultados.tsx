'use client';

import { useCallback, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  AtSign,
  BriefcaseBusiness,
  Building2,
  Camera,
  MapPin,
  Phone,
  RefreshCw,
  Target,
  UserRound,
} from 'lucide-react';
import { AtualizarEnriquecimentos } from './AtualizarEnriquecimentos';
import { BotaoEnviarCrm } from './BotaoEnviarCrm';
import { CopiarContato } from './CopiarContato';
import { LinkContatoProspeccao } from './LinkContatoProspeccao';
import type { CanalContatoProspeccao } from '@/lib/prospeccao/schema';
import {
  decisoresDo,
  emailsDo,
  enriquecimentoDeContatosEmAndamento,
  identificadorRede,
  qualificacaoDo,
  redesDo,
  rotuloCompletude,
  telefonesDo,
  urlWhatsapp,
  type Lead,
} from './dossie';
import { ModalDossie } from './ModalDossie';
import styles from '../pagina.module.css';

function Canal({
  icone,
  rotulo,
  valor,
  href,
  lead,
  canal,
  valorCopiar = valor,
}: {
  icone: ReactNode;
  rotulo: string;
  valor: string;
  href: string;
  lead: string;
  canal: CanalContatoProspeccao;
  valorCopiar?: string;
}) {
  return (
    <div className={styles.canalLead}>
      <span className={styles.canalIcone}>{icone}</span>
      <div>
        <small>{rotulo}</small>
        <LinkContatoProspeccao
          lead={lead}
          canal={canal}
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel="noreferrer"
        >
          {valor}
        </LinkContatoProspeccao>
      </div>
      <CopiarContato valor={valorCopiar} className={styles.copiarCanal} />
    </div>
  );
}

export function ListaResultados({ leads }: { leads: Lead[] }) {
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [retornarFoco, setRetornarFoco] = useState<HTMLButtonElement | null>(null);
  const fecharModal = useCallback(() => setSelecionadoId(null), []);
  const selecionado = selecionadoId
    ? (leads.find((lead) => lead.id === selecionadoId) ?? null)
    : null;
  const enriquecendo = leads.some(enriquecimentoDeContatosEmAndamento);

  if (!leads.length) {
    return (
      <div className={styles.semResultados}>
        <Building2 size={25} strokeWidth={1.5} aria-hidden="true" />
        <h3>Não encontramos empresas novas neste recorte.</h3>
        <p>
          As empresas que você já recebeu foram retiradas. Tente uma região próxima ou um tipo de
          empresa mais amplo; os créditos não usados já voltaram para o saldo.
        </p>
      </div>
    );
  }

  return (
    <>
      <AtualizarEnriquecimentos ativo={enriquecendo} />
      <div className={styles.resumoResultados}>
        <div>
          <span className={styles.resultadosLinha}>
            <strong>{leads.length} empresas novas</strong>
            {enriquecendo && (
              <span className={styles.statusSegundoPlano} role="status">
                <RefreshCw size={12} aria-hidden="true" />
                Atualizando contatos
              </span>
            )}
          </span>
          <span>Ordenadas pela qualidade dos contatos encontrados.</span>
        </div>
        <span>Clique em “Ver detalhes” para consultar fontes, site e dados adicionais.</span>
      </div>

      <div className={styles.gradeLeads} role="list">
        {leads.map((lead, indice) => {
          const telefones = telefonesDo(lead);
          const emails = emailsDo(lead);
          const redes = redesDo(lead);
          const decisores = decisoresDo(lead);
          const decisor =
            decisores.find((pessoa) => pessoa.email || pessoa.telefone) ?? decisores[0] ?? null;
          const telefone = decisor?.telefone ?? telefones[0] ?? null;
          const email = decisor?.email ?? emails[0] ?? null;
          const linkedin =
            decisor?.linkedin_url ?? redes.find((rede) => rede.rede === 'linkedin')?.url ?? null;
          const instagram = redes.find((rede) => rede.rede === 'instagram') ?? null;
          const qualificacao = qualificacaoDo(lead);
          const oportunidade = qualificacao.oportunidade;

          return (
            <article className={styles.cartaoLead} role="listitem" key={lead.id}>
              <div className={styles.cartaoLeadTopo}>
                <span className={styles.numeroLead}>{String(indice + 1).padStart(2, '0')}</span>
                <span className={styles.qualidadeLead} data-alta={qualificacao.completude >= 80}>
                  {rotuloCompletude(qualificacao.completude)}
                </span>
              </div>

              <div className={styles.empresaLead}>
                <h3>{lead.nome}</h3>
                <p>{lead.categoria ?? 'Empresa local'}</p>
                <span>
                  <MapPin size={13} aria-hidden="true" />
                  {[lead.cidade, lead.estado].filter(Boolean).join(', ') ||
                    lead.endereco ||
                    'Região a confirmar'}
                </span>
              </div>

              {oportunidade && (
                <div className={styles.oportunidadeLead}>
                  <div className={styles.oportunidadeLeadTitulo}>
                    <span>
                      <Target size={14} aria-hidden="true" /> Projeto mais aderente
                    </span>
                    <small data-confianca={oportunidade.confianca}>
                      {oportunidade.confianca === 'alta'
                        ? 'Boa aderência'
                        : oportunidade.confianca === 'media'
                          ? 'Aderência provável'
                          : 'Hipótese inicial'}
                    </small>
                  </div>
                  <strong>{oportunidade.projeto_titulo}</strong>
                  <p>{oportunidade.motivo}</p>
                </div>
              )}

              <div className={styles.contatoPrincipalLead} data-encontrado={Boolean(decisor)}>
                <span className={styles.contatoPrincipalIcone}>
                  <UserRound size={15} aria-hidden="true" />
                </span>
                <div>
                  <small>{decisor ? 'Pessoa para procurar' : 'Pessoa para procurar'}</small>
                  <strong>{decisor?.nome ?? 'Responsável a identificar'}</strong>
                  <span>
                    {decisor?.cargo ?? 'Peça pelo responsável da área ao iniciar o contato.'}
                  </span>
                </div>
              </div>

              <div className={styles.canaisLead}>
                {telefone && (
                  <Canal
                    lead={lead.id}
                    canal={urlWhatsapp(telefone) ? 'whatsapp' : 'telefone'}
                    icone={<Phone size={15} aria-hidden="true" />}
                    rotulo={decisor?.telefone ? 'Telefone do decisor' : 'Telefone / WhatsApp'}
                    valor={telefone}
                    href={urlWhatsapp(telefone) ?? `tel:${telefone}`}
                  />
                )}
                {email && (
                  <Canal
                    lead={lead.id}
                    canal="email"
                    icone={<AtSign size={15} aria-hidden="true" />}
                    rotulo={decisor?.email ? 'E-mail do decisor' : 'E-mail da empresa'}
                    valor={email}
                    href={`mailto:${email}`}
                  />
                )}
                {linkedin && (!telefone || !email) && (
                  <Canal
                    lead={lead.id}
                    canal="linkedin"
                    icone={<BriefcaseBusiness size={15} aria-hidden="true" />}
                    rotulo={decisor?.linkedin_url ? 'LinkedIn do decisor' : 'LinkedIn'}
                    valor={decisor ? decisor.nome : 'Abrir perfil'}
                    href={linkedin}
                    valorCopiar={linkedin}
                  />
                )}
                {instagram && !linkedin && (!telefone || !email) && (
                  <Canal
                    lead={lead.id}
                    canal="instagram"
                    icone={<Camera size={15} aria-hidden="true" />}
                    rotulo="Instagram"
                    valor={identificadorRede(instagram)}
                    href={instagram.url}
                    valorCopiar={instagram.url}
                  />
                )}
                {!telefone && !email && !linkedin && !instagram && (
                  <p className={styles.semCanalLead}>
                    Abra os detalhes para consultar os demais canais encontrados.
                  </p>
                )}
              </div>

              <footer className={styles.acoesLead}>
                <button
                  type="button"
                  className={styles.verDetalhes}
                  onClick={(evento) => {
                    setRetornarFoco(evento.currentTarget);
                    setSelecionadoId(lead.id);
                  }}
                >
                  Ver detalhes <ArrowUpRight size={14} aria-hidden="true" />
                </button>
                <BotaoEnviarCrm
                  lead={lead.id}
                  oportunidade={lead.crm_oportunidade_id}
                  compacto
                  className={styles.acaoCrmLead}
                />
              </footer>
            </article>
          );
        })}
      </div>

      {selecionado && (
        <ModalDossie lead={selecionado} onClose={fecharModal} retornarFoco={retornarFoco} />
      )}
    </>
  );
}
