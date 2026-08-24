import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  Cloud,
  Coins,
  KeyRound,
  Layers3,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { obterEstadoGoogleCalendar } from '@/lib/google-calendar/queries';
import { IntegracaoGoogleCalendar } from './_components/IntegracaoGoogleCalendar';
import { FormularioIdentidade } from './_components/FormularioIdentidade';
import { obterSaldoCreditos } from '@/lib/creditos/queries';
import { PLANOS_SUBIDO, planoDosMetadados, planoTemRecurso } from '@/lib/planos/acessos';
import { PainelAcessoPlano } from './_components/PainelAcessoPlano';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Conta' };

const CONTINUIDADE = [
  'Projetos e tarefas concluídas',
  'Clientes, reuniões e propostas',
  'Formações, mentorias e certificados',
] as const;

const ATALHOS = [
  {
    href: '/solucoes',
    rotulo: 'Projetos',
    detalhe: 'Retomar uma entrega',
    Icone: BriefcaseBusiness,
  },
  {
    href: '/formacoes',
    rotulo: 'Formações',
    detalhe: 'Continuar aprendendo',
    Icone: BookOpen,
  },
  {
    href: '/certificados',
    rotulo: 'Certificados',
    detalhe: 'Ver o que você concluiu',
    Icone: Award,
  },
] as const;

/**
 * A conta reúne orientação e controles reais. Nome e e-mail vêm dos claims já
 * verificados; apenas o nome é editável porque o e-mail faz parte da identidade
 * de autenticação e precisa de um fluxo separado de confirmação.
 */
export default async function ContaPage({ searchParams }: PageProps<'/conta'>) {
  const supabase = await createClient();
  const [{ data }, calendar, parametros, saldoCreditos] = await Promise.all([
    supabase.auth.getClaims(),
    obterEstadoGoogleCalendar(),
    searchParams,
    obterSaldoCreditos(),
  ]);

  const claims = data?.claims;
  const email = typeof claims?.email === 'string' ? claims.email : '—';
  const metadata = claims?.user_metadata;
  const plano = planoDosMetadados(claims?.app_metadata);
  const acessoBloqueado =
    Boolean(parametros.upgrade) && !planoTemRecurso(plano, 'modulo_comercial');
  const nome = typeof metadata?.nome === 'string' ? metadata.nome : '—';
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  return (
    <div className={styles.pagina}>
      <header className={styles.intro}>
        <div>
          <p className={styles.sobretitulo}>Sua conta</p>
          <h1>Conta e integrações</h1>
        </div>
        <p className={styles.resumo}>
          Gerencie seu perfil, conecte sua agenda e acesse os dados salvos na plataforma.
        </p>
      </header>

      {parametros.calendar === 'conectado' && (
        <div className={styles.avisoIntegracao} data-tom="sucesso" role="status">
          <CalendarCheck2 size={17} strokeWidth={1.8} aria-hidden="true" />
          Google Calendar conectado. Agora você pode enviar o convite ao criar uma reunião.
        </div>
      )}
      {parametros.calendar === 'erro' && (
        <div className={styles.avisoIntegracao} data-tom="erro" role="alert">
          Não foi possível conectar o calendário. Tente novamente.
        </div>
      )}
      {acessoBloqueado && (
        <div className={styles.avisoIntegracao} data-tom="atencao" role="alert">
          <Layers3 size={17} strokeWidth={1.8} aria-hidden="true" />
          <span>
            <strong>Esta área não faz parte do seu acesso atual.</strong>
            Você continua com formações, projetos, Sobral AI, reuniões e Live Coach.
          </span>
        </div>
      )}

      <section className={styles.economia} aria-label="Plano e créditos">
        <Link href="/conta/creditos" className={styles.cartaoEconomia}>
          <span className={styles.iconeEconomia} aria-hidden="true">
            <Coins size={20} strokeWidth={1.7} />
          </span>
          <div>
            <p>Créditos disponíveis</p>
            <strong>{saldoCreditos ?? '—'}</strong>
            <small>
              {plano === 'starter'
                ? 'Use o saldo nas mentorias disponíveis para o seu plano.'
                : 'Use em prospecção, enriquecimento e mentorias.'}
            </small>
          </div>
          <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
        </Link>
        <article>
          <span className={styles.iconeEconomia} aria-hidden="true">
            <Layers3 size={20} strokeWidth={1.7} />
          </span>
          <div>
            <p>Plano atual</p>
            <strong>{PLANOS_SUBIDO[plano].nome}</strong>
            <small>{PLANOS_SUBIDO[plano].descricao}</small>
          </div>
        </article>
      </section>

      <PainelAcessoPlano plano={plano} destaque={acessoBloqueado} />

      <IntegracaoGoogleCalendar calendar={calendar} />

      <section className={styles.perfil} aria-labelledby="nome-profissional">
        <div className={styles.identidade}>
          <span className={styles.avatar} aria-hidden="true">
            {iniciais || <UserRound size={28} strokeWidth={1.5} />}
          </span>

          <div className={styles.dadosPrincipais}>
            <span className={styles.estado}>
              <Cloud size={14} strokeWidth={1.8} aria-hidden="true" />
              Conta sincronizada
            </span>
            <h2 id="nome-profissional">{nome}</h2>
            <p>{email}</p>
          </div>
        </div>

        <div className={styles.baseSalva}>
          <p>Dados salvos nesta conta</p>
          <ul>
            {CONTINUIDADE.map((item) => (
              <li key={item}>
                <Check size={14} strokeWidth={2.2} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <nav className={styles.atalhos} aria-label="Atalhos da sua conta">
          {ATALHOS.map(({ href, rotulo, detalhe, Icone }) => (
            <Link href={href} key={href}>
              <span className={styles.iconeAtalho} aria-hidden="true">
                <Icone size={18} strokeWidth={1.7} />
              </span>
              <span>
                <strong>{rotulo}</strong>
                <small>{detalhe}</small>
              </span>
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </section>

      <div className={styles.grade}>
        <section className={styles.cartao} aria-labelledby="identidade-profissional">
          <header className={styles.cabecalhoCartao}>
            <span aria-hidden="true">
              <UserRound size={18} strokeWidth={1.7} />
            </span>
            <div>
              <p>Perfil</p>
              <h2 id="identidade-profissional">Nome exibido na plataforma</h2>
            </div>
          </header>

          <FormularioIdentidade key={nome} nome={nome} />
        </section>

        <section className={styles.cartao} aria-labelledby="acesso-e-seguranca">
          <header className={styles.cabecalhoCartao}>
            <span aria-hidden="true">
              <ShieldCheck size={18} strokeWidth={1.7} />
            </span>
            <div>
              <p>Proteção</p>
              <h2 id="acesso-e-seguranca">Acesso e segurança</h2>
            </div>
          </header>

          <div className={styles.acessos}>
            <div className={styles.acesso}>
              <span className={styles.iconeAcesso} aria-hidden="true">
                <Mail size={17} strokeWidth={1.7} />
              </span>
              <span>
                <small>E-mail de acesso</small>
                <strong>{email}</strong>
              </span>
              <em>Verificado</em>
            </div>

            <div className={styles.acesso}>
              <span className={styles.iconeAcesso} aria-hidden="true">
                <KeyRound size={17} strokeWidth={1.7} />
              </span>
              <span>
                <small>Senha</small>
                <strong>Senha cadastrada</strong>
              </span>
              <Link href="/nova-senha">Trocar senha</Link>
            </div>
          </div>

          <p className={styles.notaSeguranca}>
            <ShieldCheck size={14} strokeWidth={1.8} aria-hidden="true" />
            Para alterar e-mail ou senha, confirme sua identidade novamente.
          </p>
        </section>
      </div>
    </div>
  );
}
