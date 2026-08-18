import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, Building2, CalendarDays, Check, Clock3, UserRound } from 'lucide-react';
import type { PlanoJornada } from '@/lib/jornada/motor';
import styles from './MapaJornada.module.css';

type Props = {
  configuracao?: ReactNode;
  nome: string | null;
  prioridade: ReactNode;
  cliente: ReactNode;
  contato: ReactNode;
  proximaAcao?: ReactNode;
  proximaMentoria?: ReactNode;
  plano: PlanoJornada;
};

function TrilhoJornada({ plano }: { plano: PlanoJornada }) {
  return (
    <ol className={styles.trilho} aria-label="Etapas do trabalho">
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
              {etapa.concluidos} de {etapa.passos.length} itens
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
  prioridade,
  cliente,
  contato,
  proximaAcao,
  proximaMentoria,
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
            <span className={styles.estadoOperacao}>Antes de começar</span>
            <p className={styles.saudacao}>Bom dia{nome ? `, ${nome}` : ''}.</p>
            <p className={styles.data}>
              Configure sua primeira oferta para usar a plataforma · {dataLonga}
            </p>
          </div>
          <span className={styles.passoAtual}>Passo 1 de 3</span>
        </header>

        <section className={styles.ativacao} aria-labelledby="titulo-ativacao">
          <div className={styles.ativacaoIntroducao}>
            <span className={styles.selo}>Configuração inicial</span>
            <h1 id="titulo-ativacao">Escolha o que você quer vender primeiro.</h1>
            <p>Informe o mercado, o projeto e uma frase simples para apresentar seu serviço.</p>
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
              <p>Como a plataforma organiza o trabalho</p>
              <h2 id="titulo-caminho">Cinco etapas, da preparação à próxima venda.</h2>
            </div>
            <span>Os itens são concluídos conforme você trabalha na plataforma.</span>
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
          <span className={styles.estadoOperacao}>Hoje</span>
          <p className={styles.saudacao}>Bom dia{nome ? `, ${nome}` : ''}.</p>
          <p className={styles.data}>{dataLonga}</p>
        </div>
        <div className={styles.resumoTopo}>
          <span>Etapa atual</span>
          <strong>{etapaAtual.titulo}</strong>
        </div>
      </header>

      <section className={styles.comando} aria-label="Próxima ação recomendada">
        {prioridade}

        <aside className={styles.progresso} aria-label="Progresso geral">
          <div className={styles.progressoNumero}>
            <span>Progresso geral</span>
            <strong>{plano.percentual}%</strong>
          </div>
          <div
            className={styles.progressoTrilho}
            role="progressbar"
            aria-label="Progresso geral"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={plano.percentual}
          >
            <span style={{ width: `${plano.percentual}%` }} />
          </div>
          <p>
            {plano.evidenciasConcluidas} de {plano.totalEvidencias} itens concluídos
          </p>
          <div className={styles.marco}>
            <span>Objetivo desta etapa</span>
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
            <p>Para hoje</p>
            <h2 id="titulo-operacao">Informações para decidir o que fazer</h2>
          </div>
          <span>Abra um item para continuar o trabalho.</span>
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
              <p>Leve uma dúvida ou um problema real da sua entrega.</p>
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
