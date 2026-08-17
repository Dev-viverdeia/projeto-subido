import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  ContactRound,
  GraduationCap,
  House,
  MessageSquareQuote,
  Layers3,
  UsersRound,
  Video,
} from 'lucide-react';
import { CabecalhoDossie } from '@/app/(app)/crm/[id]/_components/CabecalhoDossie';
import { JornadaEntradaLead } from '@/app/(app)/crm/[id]/_components/JornadaEntradaLead';
import { ResumoOperacionalLead } from '@/app/(app)/crm/[id]/_components/ResumoOperacionalLead';
import pagina from '@/app/(app)/crm/[id]/pagina.module.css';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { DossieLead } from '@/lib/crm/queries';
import shell from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Dossiê do lead' };

const LEAD_OPERACIONAL: DossieLead = {
  oportunidade: {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Automação do atendimento',
    etapa: 'descoberta',
    empresaId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    empresa: 'Clínica Aurora',
    dominio: 'clinicaaurora.com.br',
    enriquecidoEm: '2026-08-08T18:10:00.000Z',
    enriquecimentoStatus: 'concluido',
    contatoId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    contato: 'Camila Rios',
    contatoEmail: 'camila@clinicaaurora.com.br',
    valorCentavos: null,
    proximaAcao: 'Enviar o diagnóstico do piloto e marcar a apresentação com a diretoria.',
    proximaAcaoEm: '2026-08-12T15:00:00.000Z',
    ganhaEm: null,
    perdidaEm: null,
    motivoPerda: null,
    ultimoFato: 'Call de descoberta concluída',
    ultimoFatoEm: '2026-08-08T17:44:00.000Z',
    atualizadoEm: '2026-08-08T17:46:00.000Z',
    criadoEm: '2026-08-03T13:00:00.000Z',
  },
  empresa: {
    nome: 'Clínica Aurora',
    dominio: 'clinicaaurora.com.br',
    setor: 'Saúde',
    porte: 'Médio',
    cidade: 'São Paulo',
    estado: 'SP',
  },
  contato: {
    nome: 'Camila Rios',
    email: 'camila@clinicaaurora.com.br',
    telefone: null,
    cargo: 'Diretora de Operações',
    linkedinUrl: 'https://www.linkedin.com/in/camila-rios',
  },
  eventos: [
    {
      id: 'evento-2',
      titulo: 'Dossiê comercial atualizado',
      descricao: 'Site público e histórico do CRM foram lidos novamente.',
      tipo: 'enriquecimento',
      ocorridoEm: '2026-08-08T18:10:00.000Z',
      fonte: 'Enriquecimento',
    },
    {
      id: 'evento-1',
      titulo: 'Call de descoberta concluída',
      descricao: 'Dores, decisões e compromissos foram adicionados ao contexto do lead.',
      tipo: 'call_concluida',
      ocorridoEm: '2026-08-08T17:44:00.000Z',
      fonte: 'Calls',
    },
    {
      id: 'evento-3',
      titulo: 'Lead entrou no pipeline',
      descricao: 'Oportunidade criada por indicação de um cliente.',
      tipo: 'lead_criado',
      ocorridoEm: '2026-08-03T13:00:00.000Z',
      fonte: 'CRM',
    },
  ],
  calls: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      titulo: 'Descoberta do atendimento',
      tipo: 'descoberta',
      status: 'concluida',
      agendadaPara: '2026-08-08T17:00:00.000Z',
      iniciadaEm: '2026-08-08T17:02:00.000Z',
      encerradaEm: '2026-08-08T17:44:00.000Z',
      duracaoMinutos: 45,
      codigoPublico: 'preview-descoberta',
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      titulo: 'Follow-up do diagnóstico',
      tipo: 'follow_up',
      status: 'agendada',
      agendadaPara: '2026-08-12T15:00:00.000Z',
      iniciadaEm: null,
      encerradaEm: null,
      duracaoMinutos: 30,
      codigoPublico: 'preview-follow-up',
    },
  ],
  acoesPlano: [
    {
      id: '55555555-5555-4555-8555-555555555555',
      titulo: 'Enviar o diagnóstico do piloto e marcar a apresentação com a diretoria.',
      prazoEm: '2026-08-12T15:00:00.000Z',
      reuniaoId: '22222222-2222-4222-8222-222222222222',
    },
  ],
  projetoAtivo: {
    id: '66666666-6666-4666-8666-666666666666',
    titulo: 'Atendimento inteligente para clínicas',
    status: 'em_execucao',
    atualizadoEm: '2026-08-08T18:10:00.000Z',
  },
  projetoRecente: {
    id: '66666666-6666-4666-8666-666666666666',
    titulo: 'Atendimento inteligente para clínicas',
    status: 'em_execucao',
    atualizadoEm: '2026-08-08T18:10:00.000Z',
  },
  propostaRecente: {
    id: '77777777-7777-4777-8777-777777777777',
    titulo: 'Atendimento inteligente para clínicas',
    status: 'aceita',
    reuniaoId: '22222222-2222-4222-8222-222222222222',
  },
  enriquecimentos: [],
  totalCalls: 2,
};

const LEAD_NOVO: DossieLead = {
  ...LEAD_OPERACIONAL,
  oportunidade: {
    ...LEAD_OPERACIONAL.oportunidade,
    etapa: 'novo_lead',
    dominio: null,
    enriquecidoEm: null,
    enriquecimentoStatus: null,
    proximaAcao: null,
    proximaAcaoEm: null,
    ultimoFato: 'Lead entrou no pipeline',
    ultimoFatoEm: LEAD_OPERACIONAL.oportunidade.criadoEm,
  },
  empresa: { ...LEAD_OPERACIONAL.empresa, dominio: null },
  eventos: [LEAD_OPERACIONAL.eventos[2]!],
  calls: [],
  acoesPlano: [],
  projetoAtivo: null,
  projetoRecente: null,
  propostaRecente: null,
  totalCalls: 0,
};

export default async function PreviewDossiePage({
  searchParams,
}: PageProps<'/preview/crm-dossie'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;
  const entrada = parametros.entrada === '1';
  const lead = entrada ? LEAD_NOVO : LEAD_OPERACIONAL;

  return (
    <div className={shell.shell}>
      <aside className={shell.sidebar}>
        <div className={shell.logo}>
          <SubidoLogo size={18} />
        </div>
        <nav aria-label="Preview da navegação">
          <span>
            <House size={18} aria-hidden="true" /> Início
          </span>
          <a className={shell.ativo} href="#conteudo">
            <ContactRound size={18} aria-hidden="true" /> CRM
          </a>
          <span>
            <Video size={18} aria-hidden="true" /> Calls
          </span>
          <span>
            <BriefcaseBusiness size={18} aria-hidden="true" /> Projetos
          </span>
          <span>
            <GraduationCap size={18} aria-hidden="true" /> Formações
          </span>
          <span>
            <Bot size={18} aria-hidden="true" /> Sobral AI
          </span>
          <span>
            <UsersRound size={18} aria-hidden="true" /> Mentorias
          </span>
        </nav>
      </aside>

      <main id="conteudo" className={shell.conteudo}>
        <div className={pagina.pagina}>
          <span className={pagina.voltar}>
            <ArrowLeft size={15} aria-hidden="true" /> Voltar ao pipeline
          </span>

          <CabecalhoDossie
            lead={lead}
            enriquecimentoEmAndamento={false}
            temDossie={!entrada}
            modoEntrada={entrada}
          />

          {entrada ? (
            <JornadaEntradaLead
              oportunidadeId={lead.oportunidade.id}
              empresaNome={lead.empresa.nome}
              dominio={lead.empresa.dominio}
              linkedin={lead.contato?.linkedinUrl ?? null}
              estadoContexto="pendente"
              totalCalls={0}
            />
          ) : (
            <>
              <ResumoOperacionalLead lead={LEAD_OPERACIONAL} />

              <section className={pagina.resumo}>
                <div className={pagina.resumoMarca}>
                  <Layers3 size={18} aria-hidden="true" /> Leitura do lead
                </div>
                <div>
                  <h2>
                    A clínica centraliza o atendimento no WhatsApp e oferece agendamento para quatro
                    especialidades, mas não apresenta triagem automatizada no site.
                  </h2>
                  <p>Atualizado em 08 de agosto de 2026 · 4 fatos e 3 hipóteses separados.</p>
                </div>
              </section>

              <div className={pagina.gradeConteudo}>
                <div className={pagina.colunaPrincipal}>
                  <section className={pagina.bloco}>
                    <header className={pagina.blocoTopo}>
                      <div>
                        <p className={pagina.sobretitulo}>O que sabemos</p>
                        <h2>Fatos encontrados</h2>
                      </div>
                      <span>4</span>
                    </header>
                    <div className={pagina.gradeFatos}>
                      {[
                        [
                          'Site público',
                          'Atendimento pelo WhatsApp',
                          'O canal aparece em destaque em todas as páginas.',
                        ],
                        [
                          'CRM',
                          'Indicação de um cliente',
                          'O lead entrou no pipeline por indicação.',
                        ],
                        [
                          'Site público',
                          'Quatro especialidades',
                          'A página lista dermatologia, estética, nutrição e fisioterapia.',
                        ],
                        [
                          'Informado por você',
                          'Resposta demorada',
                          'O contato relatou perda de mensagens em horários de pico.',
                        ],
                      ].map(([origem, titulo, valor]) => (
                        <article className={pagina.fato} key={titulo}>
                          <div>
                            <BadgeCheck size={16} aria-hidden="true" /> <span>{origem}</span>
                          </div>
                          <h3>{titulo}</h3>
                          <p>{valor}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className={pagina.bloco}>
                    <header className={pagina.blocoTopo}>
                      <div>
                        <p className={pagina.sobretitulo}>O que precisa ser confirmado</p>
                        <h2>Hipóteses para a call</h2>
                      </div>
                      <span>2</span>
                    </header>
                    <div className={pagina.listaHipoteses}>
                      <article className={pagina.hipotese} data-confianca="media">
                        <div className={pagina.hipoteseTopo}>
                          <h3>A recepção repete perguntas de triagem</h3>
                          <span>Confiança média</span>
                        </div>
                        <p>
                          O site não coleta motivo da consulta antes de direcionar para o WhatsApp.
                        </p>
                        <div className={pagina.validar}>
                          <span>
                            <strong>Como validar:</strong> perguntar quais informações a recepção
                            coleta antes de oferecer um horário.
                          </span>
                        </div>
                      </article>
                      <article className={pagina.hipotese} data-confianca="baixa">
                        <div className={pagina.hipoteseTopo}>
                          <h3>Há perda de demanda fora do horário comercial</h3>
                          <span>Confiança baixa</span>
                        </div>
                        <p>
                          O site não informa atendimento automático ou tempo esperado de resposta.
                        </p>
                        <div className={pagina.validar}>
                          <span>
                            <strong>Como validar:</strong> comparar volume e conversão por faixa de
                            horário.
                          </span>
                        </div>
                      </article>
                    </div>
                  </section>
                </div>

                <aside className={pagina.colunaLateral}>
                  <section className={pagina.proximaAcao}>
                    <p className={pagina.sobretituloClaro}>Recomendação operacional</p>
                    <h2>Próxima ação</h2>
                    <p className={pagina.acaoTexto}>
                      Agendar uma call de descoberta com a recepção.
                    </p>
                    <p className={pagina.acaoPorque}>
                      O processo atual precisa ser confirmado antes de propor automação.
                    </p>
                    <button type="button">Adicionar ao plano</button>
                  </section>

                  <section className={pagina.painelLateral}>
                    <header>
                      <MessageSquareQuote size={18} aria-hidden="true" />
                      <div>
                        <p className={pagina.sobretitulo}>Roteiro de descoberta</p>
                        <h2>Perguntas para a call</h2>
                      </div>
                    </header>
                    <ol className={pagina.perguntas}>
                      <li>Quantas conversas novas chegam pelo WhatsApp por dia?</li>
                      <li>O que a recepção precisa perguntar antes de sugerir um horário?</li>
                      <li>Em quais horários as mensagens mais se acumulam?</li>
                    </ol>
                  </section>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
