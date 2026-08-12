import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  Bot,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  UserRound,
} from 'lucide-react';
import type { PlanoJornada } from '@/lib/jornada/motor';
import styles from './MapaJornada.module.css';

type Props = {
  configuracao?: ReactNode;
  nome: string | null;
  cliente: ReactNode;
  contato: ReactNode;
  proximaAcao?: ReactNode;
  proximaMentoria?: ReactNode;
  diagnosticoSobral: ReactNode;
  focoSobral: ReactNode;
  plano: PlanoJornada;
};

function TrilhoJornada({ plano }: { plano: PlanoJornada }) {
  return (
    <ol className={styles.trilho} aria-label="Etapas da jornada profissional">
      {plano.etapas.map((etapa) => (
        <li
          key={etapa.id}
          data-status={etapa.status}
          aria-current={etapa.id === plano.etapaAtual ? 'step' : undefined}
        >
          <span className={styles.trilhoMarca} aria-hidden="true">
            {etapa.status === 'concluida' ? <Check size={13} strokeWidth={2.7} /> : etapa.numero}
          </span>
          <span className={styles.trilhoTexto}>
            <strong>{etapa.titulo}</strong>
            <small>
              {etapa.concluidos}/{etapa.passos.length} evidências
            </small>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function MapaJornada({
  configuracao,
  nome,
  cliente,
  contato,
  proximaAcao,
  proximaMentoria,
  diagnosticoSobral,
  focoSobral,
  plano,
}: Props) {
  const etapaAtual = plano.etapas.find((item) => item.id === plano.etapaAtual) ?? plano.etapas[0]!;
  const hoje = new Date();
  const dataLonga = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (!plano.perfilCompleto) {
    return (
      <div className={`${styles.pagina} pagina-mapa-jornada`}>
        <header className={styles.topo}>
          <div>
            <span className={styles.estadoOperacao}>Primeira configuração</span>
            <p className={styles.saudacao}>Bom dia{nome ? `, ${nome}` : ''}.</p>
            <p className={styles.data}>
              Vamos montar uma base clara para sua operação · {dataLonga}
            </p>
          </div>
          <span className={styles.passoAtual}>Passo 1 de 3</span>
        </header>

        <section className={styles.ativacao} aria-labelledby="titulo-ativacao">
          <div className={styles.ativacaoIntroducao}>
            <span className={styles.selo}>Seu ponto de partida</span>
            <h1 id="titulo-ativacao">Defina o foco da sua primeira oferta.</h1>
            <p>
              Três decisões organizam o que você vai vender, para quem e como começar sem se perder
              na plataforma.
            </p>
            <div className={styles.tempoAtivacao}>
              <Clock3 size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>Leva menos de 3 minutos</span>
            </div>
          </div>
          <div className={styles.configuracaoAberta}>{configuracao}</div>
        </section>

        <section className={styles.caminho} aria-labelledby="titulo-caminho">
          <div className={styles.caminhoCabecalho}>
            <div>
              <p>Depois da configuração</p>
              <h2 id="titulo-caminho">Sua operação passa a ter um próximo passo claro.</h2>
            </div>
            <span>Cada avanço exige uma evidência real na plataforma.</span>
          </div>
          <TrilhoJornada plano={plano} />
        </section>
      </div>
    );
  }

  return (
    <div className={`${styles.pagina} pagina-mapa-jornada`}>
      <header className={styles.topo}>
        <div>
          <span className={styles.estadoOperacao}>Sua operação hoje</span>
          <p className={styles.saudacao}>Bom dia{nome ? `, ${nome}` : ''}.</p>
          <p className={styles.data}>{dataLonga}</p>
        </div>
        <div className={styles.resumoTopo}>
          <span>Ciclo atual</span>
          <strong>{etapaAtual.titulo}</strong>
        </div>
      </header>

      <section className={styles.comando} aria-label="Próximo movimento da operação">
        <article className={styles.prioridade}>
          <div className={styles.prioridadeTopo}>
            <span>Seu próximo movimento</span>
            <em>{etapaAtual.titulo}</em>
          </div>
          <h1>{plano.proximoPasso.titulo}</h1>
          <p>{plano.proximoPasso.detalhe}</p>
          <Link href={plano.proximoPasso.destino} className={styles.botaoPrimario}>
            {plano.proximoPasso.acao}
            <ArrowRight size={17} strokeWidth={2} aria-hidden="true" />
          </Link>
          <div className={styles.evidenciaPrioridade}>
            <CheckCircle2 size={16} strokeWidth={1.9} aria-hidden="true" />
            <span>
              <small>Evidência atual</small>
              <strong>{plano.proximoPasso.evidencia}</strong>
            </span>
          </div>
        </article>

        <aside className={styles.progresso} aria-label="Progresso da jornada">
          <div className={styles.progressoNumero}>
            <span>Jornada comprovada</span>
            <strong>{plano.percentual}%</strong>
          </div>
          <div
            className={styles.progressoTrilho}
            role="progressbar"
            aria-label="Progresso da jornada"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={plano.percentual}
          >
            <span style={{ width: `${plano.percentual}%` }} />
          </div>
          <p>
            {plano.evidenciasConcluidas} de {plano.totalEvidencias} evidências reais registradas
          </p>
          <div className={styles.marco}>
            <span>Marco desta etapa</span>
            <strong>{etapaAtual.marco}</strong>
          </div>
        </aside>

        <div className={styles.comandoTrilho}>
          <TrilhoJornada plano={plano} />
        </div>
      </section>

      <section className={styles.operacao} aria-labelledby="titulo-operacao">
        <div className={styles.secaoCabecalho}>
          <div>
            <p>Contexto para agir</p>
            <h2 id="titulo-operacao">Agora na operação</h2>
          </div>
          <span>Somente o que pode mudar sua próxima decisão.</span>
        </div>

        <div className={styles.cartoesOperacao}>
          <Link href="/crm" className={styles.cartaoOperacao}>
            <span className={styles.cartaoIcone} aria-hidden="true">
              <Building2 size={19} strokeWidth={1.8} />
            </span>
            <span className={styles.cartaoConteudo}>
              <small>Cliente em foco</small>
              <strong>{cliente}</strong>
              <em>
                <UserRound size={13} strokeWidth={1.8} aria-hidden="true" /> {contato}
              </em>
              <p>{proximaAcao ?? 'Defina a próxima ação no CRM'}</p>
            </span>
            <ArrowRight
              className={styles.cartaoSeta}
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </Link>

          <Link href="/mentorias" className={styles.cartaoOperacao}>
            <span className={styles.cartaoIcone} aria-hidden="true">
              <CalendarDays size={19} strokeWidth={1.8} />
            </span>
            <span className={styles.cartaoConteudo}>
              <small>Próximo encontro</small>
              <strong>{proximaMentoria ?? 'Mentoria de implementação'}</strong>
              <p>Leve o bloqueio mais importante da sua entrega.</p>
            </span>
            <ArrowRight
              className={styles.cartaoSeta}
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </Link>

          <Link href="/consultor" className={`${styles.cartaoOperacao} ${styles.cartaoSobral}`}>
            <span className={styles.cartaoIcone} aria-hidden="true">
              <Bot size={19} strokeWidth={1.8} />
            </span>
            <span className={styles.cartaoConteudo}>
              <small>Leitura do Sobral AI</small>
              <strong>{diagnosticoSobral}</strong>
              <p>{focoSobral}</p>
            </span>
            <ArrowRight
              className={styles.cartaoSeta}
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      {configuracao}
    </div>
  );
}
