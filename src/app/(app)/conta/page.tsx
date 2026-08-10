import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Cloud,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { FormularioIdentidade } from './_components/FormularioIdentidade';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Conta' };

const CONTINUIDADE = [
  'Projetos e etapas concluídas',
  'Contexto de CRM, calls e propostas',
  'Formações, conversas e certificados',
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
    detalhe: 'Consultar suas provas',
    Icone: Award,
  },
] as const;

/**
 * A conta reúne orientação e controles reais. Nome e e-mail vêm dos claims já
 * verificados; apenas o nome é editável porque o e-mail faz parte da identidade
 * de autenticação e precisa de um fluxo separado de confirmação.
 */
export default async function ContaPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const claims = data?.claims;
  const email = typeof claims?.email === 'string' ? claims.email : '—';
  const metadata = claims?.user_metadata;
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
          <p className={styles.sobretitulo}>Base do profissional</p>
          <h1>Tudo o que você constrói, ligado à sua conta.</h1>
        </div>
        <p className={styles.resumo}>
          Sua identidade conecta projetos, clientes, aprendizado e conquistas para você sempre
          continuar do ponto certo.
        </p>
      </header>

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
          <p>O que fica com você</p>
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
              <p>Identidade</p>
              <h2 id="identidade-profissional">Como a plataforma apresenta você</h2>
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
                <strong>Protegida pela sua conta</strong>
              </span>
              <Link href="/nova-senha">Trocar senha</Link>
            </div>
          </div>

          <p className={styles.notaSeguranca}>
            <ShieldCheck size={14} strokeWidth={1.8} aria-hidden="true" />
            Alterações de acesso exigem confirmação para proteger seus projetos e clientes.
          </p>
        </section>
      </div>
    </div>
  );
}
