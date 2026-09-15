'use client';

import { useCallback, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  AtSign,
  BriefcaseBusiness,
  Building2,
  Camera,
  Globe,
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
import { telefoneDe } from '@/lib/prospeccao/contatos';
import {
  decisoresDo,
  emailsDo,
  enriquecimentoDeContatosEmAndamento,
  identificadorRede,
  qualificacaoDo,
  redesDo,
  rotuloRede,
  telefonesDo,
  urlWhatsapp,
  type Lead,
} from './dossie';
import { ModalDossie } from './ModalDossie';
import { useRetornoProspeccao } from './useRetornoProspeccao';
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
      <LinkContatoProspeccao
        lead={lead}
        canal={canal}
        href={href}
        aria-label={`${rotulo}: ${valor}`}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
      >
        <span className={styles.canalIcone}>{icone}</span>
        <span className={styles.canalConteudo}>
          <small>{rotulo}</small>
          <span>{valor}</span>
        </span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </LinkContatoProspeccao>
      <CopiarContato valor={valorCopiar} className={styles.copiarCanal} />
    </div>
  );
}

export function ListaResultados({
  leads,
  lista,
  retomarEmpresa,
}: {
  leads: Lead[];
  lista?: string;
  retomarEmpresa?: string;
}) {
  const raiz = useRetornoProspeccao(lista, retomarEmpresa);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [retornarFoco, setRetornarFoco] = useState<HTMLButtonElement | null>(null);
  const fecharModal = useCallback(() => setSelecionadoId(null), []);
  const selecionado = selecionadoId
    ? (leads.find((lead) => lead.id === selecionadoId) ?? null)
    : null;
  const enriquecendo = leads.some(enriquecimentoDeContatosEmAndamento);

  if (!leads.length) {
    return (
      <div
        ref={raiz}
        className={styles.semResultados}
        tabIndex={-1}
        aria-label="Resultados da Prospecção"
      >
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
        <span className={styles.resultadosLinha}>
          <strong>{leads.length} empresas</strong>
          {enriquecendo && (
            <span className={styles.statusSegundoPlano} role="status">
              <RefreshCw size={12} aria-hidden="true" />
              Atualizando contatos
            </span>
          )}
        </span>
      </div>

      <div
        ref={raiz}
        className={styles.gradeLeads}
        role="list"
        aria-label="Empresas encontradas"
        tabIndex={-1}
      >
        {leads.map((lead) => {
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
          const oportunidade = qualificacaoDo(lead).oportunidade;
          const canais: Omit<Parameters<typeof Canal>[0], 'lead'>[] = [];
          if (telefone) {
            const whatsapp = urlWhatsapp(telefone);
            canais.push({
              canal: whatsapp ? 'whatsapp' : 'telefone',
              icone: <Phone size={18} aria-hidden="true" />,
              rotulo: decisor?.telefone
                ? `Telefone · ${decisor.nome}`
                : whatsapp
                  ? 'Telefone / WhatsApp'
                  : 'Telefone',
              valor: telefone,
              href: whatsapp ?? telefoneDe(telefone)!.tel,
            });
          }
          if (email) {
            canais.push({
              canal: 'email',
              icone: <AtSign size={18} aria-hidden="true" />,
              rotulo: decisor?.email ? `E-mail · ${decisor.nome}` : 'E-mail da empresa',
              valor: email,
              href: `mailto:${email}`,
            });
          }
          if (linkedin) {
            canais.push({
              canal: 'linkedin',
              icone: <BriefcaseBusiness size={18} aria-hidden="true" />,
              rotulo: 'LinkedIn',
              valor: decisor?.linkedin_url ? decisor.nome : 'Perfil da empresa',
              href: linkedin,
              valorCopiar: linkedin,
            });
          }
          for (const rede of redes) {
            if (canais.some((canal) => canal.canal === rede.rede)) continue;
            canais.push({
              canal: rede.rede,
              icone:
                rede.rede === 'instagram' ? (
                  <Camera size={18} aria-hidden="true" />
                ) : (
                  <Globe size={18} aria-hidden="true" />
                ),
              rotulo: rotuloRede(rede.rede),
              valor: identificadorRede(rede),
              href: rede.url,
              valorCopiar: rede.url,
            });
          }
          // A sugestão só muda a ordem de canais realmente presentes na ficha.
          // Telefone e WhatsApp compartilham o mesmo número, sem atestar que ele tem WhatsApp.
          const preferido = oportunidade?.melhor_canal;
          const ehPreferido = (canal: (typeof canais)[number]) =>
            canal.canal === preferido || (preferido === 'telefone' && canal.canal === 'whatsapp');
          const canaisVisiveis = canais
            .toSorted((a, b) => Number(ehPreferido(b)) - Number(ehPreferido(a)))
            .slice(0, 2);
          const local = [lead.cidade, lead.estado].filter(Boolean).join(', ');

          return (
            <article
              className={styles.cartaoLead}
              role="listitem"
              key={lead.id}
              aria-labelledby={`empresa-${lead.id}`}
            >
              <div className={styles.cartaoConteudo}>
                <div className={styles.empresaLead}>
                  <h3 id={`empresa-${lead.id}`}>{lead.nome}</h3>
                  <p>{lead.categoria ?? 'Empresa local'}</p>
                  {local && (
                    <span>
                      <MapPin size={14} aria-hidden="true" />
                      {local}
                    </span>
                  )}
                </div>
                <div className={styles.canaisLead}>
                  {canaisVisiveis.map((canal) => (
                    <Canal key={canal.canal} lead={lead.id} {...canal} />
                  ))}
                  {!canais.length && (
                    <div className={styles.semCanalLead}>
                      <Phone size={18} aria-hidden="true" />
                      <span>
                        {enriquecimentoDeContatosEmAndamento(lead)
                          ? 'Buscando canais de contato…'
                          : 'Contato ainda não encontrado'}
                      </span>
                    </div>
                  )}
                </div>

                {decisor && (
                  <div className={styles.contatoPrincipalLead}>
                    <UserRound size={16} aria-hidden="true" />
                    <p>
                      <span>Possível contato</span> <strong>{decisor.nome}</strong>
                      {decisor.cargo && ` · ${decisor.cargo}`}
                    </p>
                  </div>
                )}

                {oportunidade && (
                  <div className={styles.oportunidadeLead}>
                    <Target size={17} aria-hidden="true" />
                    <div>
                      <span>Projeto para validar</span>
                      <strong>{oportunidade.projeto_titulo}</strong>
                    </div>
                  </div>
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
                  lista={lista}
                  oportunidade={lead.crm_oportunidade_id}
                  className={styles.acaoCrmLead}
                />
              </footer>
            </article>
          );
        })}
      </div>

      {selecionado && (
        <ModalDossie
          lead={selecionado}
          lista={lista}
          onClose={fecharModal}
          retornarFoco={retornarFoco}
        />
      )}
    </>
  );
}
