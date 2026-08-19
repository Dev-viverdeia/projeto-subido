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
  UserRound,
} from 'lucide-react';
import { AtualizarEnriquecimentos } from './AtualizarEnriquecimentos';
import { BotaoEnviarCrm } from './BotaoEnviarCrm';
import { CopiarContato } from './CopiarContato';
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
  valorCopiar = valor,
}: {
  icone: ReactNode;
  rotulo: string;
  valor: string;
  href: string;
  valorCopiar?: string;
}) {
  return (
    <div className={styles.canalLead}>
      <span className={styles.canalIcone}>{icone}</span>
      <div>
        <small>{rotulo}</small>
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {valor}
        </a>
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

              <div className={styles.decisorLead} data-encontrado={Boolean(decisor)}>
                <span className={styles.avatarDecisor}>
                  {decisor ? (
                    decisor.nome.slice(0, 1).toLocaleUpperCase('pt-BR')
                  ) : (
                    <UserRound size={16} />
                  )}
                </span>
                <div>
                  <small>{decisor ? 'Possível decisor' : 'Decisor'}</small>
                  <strong>{decisor?.nome ?? 'Ainda não identificado'}</strong>
                  <span>
                    {decisor?.cargo ?? 'Use os contatos da empresa para localizar a pessoa certa.'}
                  </span>
                </div>
              </div>

              <div className={styles.canaisLead}>
                {telefone && (
                  <Canal
                    icone={<Phone size={15} aria-hidden="true" />}
                    rotulo={decisor?.telefone ? 'Telefone do decisor' : 'Telefone / WhatsApp'}
                    valor={telefone}
                    href={urlWhatsapp(telefone) ?? `tel:${telefone}`}
                  />
                )}
                {email && (
                  <Canal
                    icone={<AtSign size={15} aria-hidden="true" />}
                    rotulo={decisor?.email ? 'E-mail do decisor' : 'E-mail da empresa'}
                    valor={email}
                    href={`mailto:${email}`}
                  />
                )}
                {linkedin && (
                  <Canal
                    icone={<BriefcaseBusiness size={15} aria-hidden="true" />}
                    rotulo={decisor?.linkedin_url ? 'LinkedIn do decisor' : 'LinkedIn'}
                    valor={decisor ? decisor.nome : 'Abrir perfil'}
                    href={linkedin}
                    valorCopiar={linkedin}
                  />
                )}
                {!linkedin && instagram && (
                  <Canal
                    icone={<Camera size={15} aria-hidden="true" />}
                    rotulo="Instagram"
                    valor={identificadorRede(instagram)}
                    href={instagram.url}
                    valorCopiar={instagram.url}
                  />
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
