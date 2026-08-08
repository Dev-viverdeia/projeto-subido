import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  ContactRound,
  Database,
  Globe2,
  GraduationCap,
  House,
  MapPin,
  MessageSquareQuote,
  Sparkles,
  UsersRound,
  Video,
} from 'lucide-react';
import { FormularioEnriquecimento } from '@/app/(app)/crm/[id]/_components/FormularioEnriquecimento';
import pagina from '@/app/(app)/crm/[id]/pagina.module.css';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import shell from '../mapa-jornada/preview.module.css';

export const metadata: Metadata = { title: 'Preview · Dossiê do lead' };

export default async function PreviewDossiePage({
  searchParams,
}: PageProps<'/preview/crm-dossie'>) {
  if (process.env.NODE_ENV === 'production') notFound();
  const parametros = await searchParams;

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

          <section className={pagina.hero}>
            <div className={pagina.heroTopo}>
              <div className={pagina.identidade}>
                <p className={pagina.sobretitulo}>Dossiê comercial</p>
                <h1>Clínica Aurora</h1>
                <p>Automação do atendimento</p>
              </div>
              <div className={pagina.heroAcoes}>
                <span className={pagina.etapa}>Descoberta</span>
                <FormularioEnriquecimento
                  oportunidadeId="11111111-1111-4111-8111-111111111111"
                  dominioInicial="clinicaaurora.com.br"
                  linkedinInicial="https://www.linkedin.com/in/camila-rios"
                  temDossie
                  abertoInicial={parametros.modal === '1'}
                />
              </div>
            </div>

            <div className={pagina.sinais}>
              <div className={pagina.fonteSinal}>
                <Database size={17} aria-hidden="true" />
                <span>Histórico CRM</span>
                <strong>8 fatos</strong>
              </div>
              <span className={pagina.linhaSinal} />
              <div className={pagina.fonteSinal}>
                <Globe2 size={17} aria-hidden="true" />
                <span>Presença pública</span>
                <strong>clinicaaurora.com.br</strong>
              </div>
              <span className={pagina.linhaSinal} />
              <div className={`${pagina.fonteSinal} ${pagina.leituraSinal}`}>
                <Sparkles size={17} aria-hidden="true" />
                <span>Leitura IA</span>
                <strong>dossiê pronto</strong>
              </div>
            </div>

            <div className={pagina.heroMeta}>
              <span>
                <ContactRound size={14} aria-hidden="true" /> Camila Rios
              </span>
              <span>
                <Video size={14} aria-hidden="true" /> 2 calls
              </span>
              <span>
                <MapPin size={14} aria-hidden="true" /> São Paulo · SP
              </span>
            </div>
          </section>

          <section className={pagina.resumo}>
            <div className={pagina.resumoMarca}>
              <Sparkles size={18} aria-hidden="true" /> Leitura do lead
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
            <main className={pagina.colunaPrincipal}>
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
                    ['CRM', 'Indicação de um cliente', 'O lead entrou no pipeline por indicação.'],
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
                    <p>O site não coleta motivo da consulta antes de direcionar para o WhatsApp.</p>
                    <div className={pagina.validar}>
                      <span>
                        <strong>Como validar:</strong> perguntar quais informações a recepção coleta
                        antes de oferecer um horário.
                      </span>
                    </div>
                  </article>
                  <article className={pagina.hipotese} data-confianca="baixa">
                    <div className={pagina.hipoteseTopo}>
                      <h3>Há perda de demanda fora do horário comercial</h3>
                      <span>Confiança baixa</span>
                    </div>
                    <p>O site não informa atendimento automático ou tempo esperado de resposta.</p>
                    <div className={pagina.validar}>
                      <span>
                        <strong>Como validar:</strong> comparar volume e conversão por faixa de
                        horário.
                      </span>
                    </div>
                  </article>
                </div>
              </section>
            </main>

            <aside className={pagina.colunaLateral}>
              <section className={pagina.proximaAcao}>
                <p className={pagina.sobretituloClaro}>Recomendação operacional</p>
                <h2>Próxima ação</h2>
                <p className={pagina.acaoTexto}>Agendar uma call de descoberta com a recepção.</p>
                <p className={pagina.acaoPorque}>
                  O processo atual precisa ser confirmado antes de propor automação.
                </p>
                <button type="button">Usar como próxima ação</button>
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
        </div>
      </main>
    </div>
  );
}
