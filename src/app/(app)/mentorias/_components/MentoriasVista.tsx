'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, Coins } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { cancelarCheckin, fazerCheckin } from '@/lib/mentorias/actions';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import type { EstadoMentoria } from './estadoMentoria';
import { atualizarUrlFiltros } from '../../_components/filtros/espelhoUrl';
import { AgendaMentorias } from './AgendaMentorias';
import { CalendarioMentorias } from './CalendarioMentorias';
import { CartaoProxima } from './CartaoProxima';
import { ControleSegmentado } from '../../_components/filtros/ControleSegmentado';
import { HistoricoDropdown } from '../../_components/HistoricoDropdown';
import { MeusCheckins } from './MeusCheckins';
import { ICONE_AGENDA, ICONE_CALENDARIO, type IdVista } from './vistas';
import { estadoDe } from './estadoMentoria';
import { ModalDetalheMentoria } from './ModalDetalheMentoria';
import { ModalOperacaoMentoria, type FaseOperacaoMentoria } from './ModalOperacaoMentoria';
import styles from './MentoriasVista.module.css';

/**
 * O SHELL das mentorias: segura tudo que as DUAS vistas compartilham — o
 * check-in, a ficha da sessão, a confirmação — e troca só o miolo.
 *
 * Por que o estado sobe para cá: o check-in feito no calendário tem que aparecer
 * na agenda, e a mesma ficha de sessão abre dos dois lados. Estado duplicado por
 * vista seria a garantia de divergirem no primeiro bug.
 *
 * O CARTÃO DA PRÓXIMA FICA ACIMA DAS ABAS, fora da troca. Ele é o AGORA — a
 * sessão ao vivo ou a próxima —, e trocar o modo de leitura não pode esconder a
 * única coisa da tela que é urgente.
 *
 * Agenda, calendário e histórico agora compartilham o mesmo fluxo. Isso evita
 * uma lateral permanente sem função imediata e deixa a decisão principal ocupar
 * o canvas com clareza.
 *
 * Este comentário já descreveu um check-in que vivia em estado de tela e "não
 * fingia persistência". Isso deixou de ser verdade quando o pilar ganhou banco —
 * comentário que descreve o que não existe ensina o próximo a mentir sobre o
 * repo, e é verificável com grep.
 */
export function MentoriasVista({
  sessoes,
  agoraIso,
  vistaInicial,
  saldoInicial,
}: {
  sessoes: SessaoMentoria[];
  agoraIso: string;
  vistaInicial: IdVista;
  saldoInicial: number | null;
}) {
  /* O MESMO instante no servidor e na hidratação — "começa em 45 min" idêntico
     dos dois lados. O relógio não avança na tela; avança no refresh. */
  const agora = useMemo(() => new Date(agoraIso), [agoraIso]);

  const [vista, setVista] = useState<IdVista>(vistaInicial);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [faseCheckin, setFaseCheckin] = useState<FaseOperacaoMentoria>('confirmacao');
  const [faseCancelamento, setFaseCancelamento] = useState<FaseOperacaoMentoria>('confirmacao');
  const [falhaOperacao, setFalhaOperacao] = useState<string | null>(null);
  const [saldo, setSaldo] = useState<number | null>(saldoInicial);

  /**
   * O CHECK-IN DEIXOU DE SER ESTADO DA ABA.
   *
   * Antes ele vivia num `useState<string[]>`: o fluxo era completo na tela e não
   * saía dela — recarregar perdia tudo, e a vaga "ocupada" nunca existiu para
   * mais ninguém. Agora é `INSERT` com RLS, e quem recusa é o banco: sessão
   * lotada, encerrada ou não publicada voltam do trigger, não daqui.
   *
   * `useTransition` porque a Server Action revalida a rota — o React segura o
   * pending enquanto o RSC volta com `euInscrito` e a contagem já corrigidos.
   * Não há estado otimista: numa última vaga, mostrar "confirmado" antes de o
   * banco decidir é exatamente a mentira que este pilar existia para não contar.
   */
  const [gravando, iniciarGravacao] = useTransition();

  /* A vista entra na URL: é escolha de LEITURA, não estado do dispositivo — um
     link para o calendário reproduz o calendário no aparelho de quem recebe.
     `replaceState` direto (ver espelhoUrl): `router.replace` re-renderizaria o
     servidor a cada troca de aba, numa rota dinâmica. */
  useEffect(() => {
    atualizarUrlFiltros({ vista: vista === 'agenda' ? null : vista });
  }, [vista]);

  /* `euInscrito` vem do servidor, por linha, via RLS — não de uma lista local. */
  const estadoComInscricao = useCallback(
    (s: SessaoMentoria): EstadoMentoria => estadoDe(s, agora, s.euInscrito),
    [agora],
  );

  const estaAoVivo = useCallback(
    (s: SessaoMentoria) =>
      agora.getTime() >= new Date(s.inicioIso).getTime() &&
      agora.getTime() < new Date(s.fimIso).getTime(),
    [agora],
  );

  /* A AGENDA só olha para frente; o CALENDÁRIO precisa do passado, senão navegar
     para o mês anterior mostra um mês vazio. Duas listas, uma fonte. */
  const futuras = useMemo(
    () =>
      sessoes
        .filter((s) => estadoDe(s, agora, false) !== 'encerrada' || estaAoVivo(s))
        .sort((a, b) => a.inicioIso.localeCompare(b.inicioIso)),
    [sessoes, agora, estaAoVivo],
  );

  const destaque = futuras.find((s) => estaAoVivo(s)) ?? futuras[0] ?? null;
  const checkinsAbertos = futuras.filter((s) => estadoComInscricao(s) === 'checkin-aberto').length;
  const totalCheckins = sessoes.filter((s) => s.euInscrito).length;

  const porId = useCallback(
    (id: string | null) => (id ? (sessoes.find((s) => s.id === id) ?? null) : null),
    [sessoes],
  );
  const detalhe = porId(detalheId);
  const confirmando = porId(confirmandoId);
  const cancelando = porId(cancelandoId);

  const abrirDetalhe = useCallback((id: string) => setDetalheId(id), []);
  const pedirCheckin = useCallback((id: string) => {
    setFalhaOperacao(null);
    setFaseCheckin('confirmacao');
    setConfirmandoId(id);
  }, []);
  const pedirCancelamento = useCallback((id: string) => {
    setFalhaOperacao(null);
    setFaseCancelamento('confirmacao');
    setCancelandoId(id);
  }, []);

  const fecharCheckin = useCallback(() => {
    if (faseCheckin === 'processando') return;
    setConfirmandoId(null);
    setFaseCheckin('confirmacao');
    setFalhaOperacao(null);
  }, [faseCheckin]);

  const fecharCancelamento = useCallback(() => {
    if (faseCancelamento === 'processando') return;
    setCancelandoId(null);
    setFaseCancelamento('confirmacao');
    setFalhaOperacao(null);
  }, [faseCancelamento]);

  const confirmarCheckin = useCallback(() => {
    if (!confirmandoId) return;
    const id = confirmandoId;
    setFalhaOperacao(null);
    setFaseCheckin('processando');
    iniciarGravacao(async () => {
      const resultado = await fazerCheckin(id);
      if (!resultado.ok) {
        setFalhaOperacao(resultado.mensagem ?? 'Não foi possível confirmar o check-in agora.');
        setFaseCheckin('erro');
        return;
      }
      setSaldo(resultado.saldo);
      setFaseCheckin('sucesso');
    });
  }, [confirmandoId]);

  const confirmarCancelamento = useCallback(() => {
    if (!cancelandoId) return;
    const id = cancelandoId;
    setFalhaOperacao(null);
    setFaseCancelamento('processando');
    iniciarGravacao(async () => {
      const resultado = await cancelarCheckin(id);
      if (!resultado.ok) {
        setFalhaOperacao(resultado.mensagem ?? 'Não foi possível cancelar o check-in agora.');
        setFaseCancelamento('erro');
        return;
      }
      setSaldo(resultado.saldo);
      setFaseCancelamento('sucesso');
    });
  }, [cancelandoId]);

  return (
    <div className={styles.raiz} data-vista={vista}>
      {/* CATÁLOGO VAZIO ≠ FILTRO VAZIO, e confundir os dois cria um beco: a
          mensagem da agenda diz "veja em Todas as próximas sessões", o que só
          faz sentido quando existe sessão em ALGUM lugar. Sem nenhuma mentoria
          publicada, esse convite leva a outra tela vazia.
          Este estado passou a ser o estado NORMAL da tela — a agenda deixou de
          ser gerada em código e começa sem nada até o admin cadastrar. */}
      {futuras.length === 0 ? (
        <section className={styles.vazio} aria-labelledby="mentorias-vazio-titulo">
          <div className={styles.vazioPrincipal}>
            <span className={styles.vazioIcone} aria-hidden="true">
              <CalendarDays size={22} strokeWidth={1.7} />
            </span>
            <div>
              <p className={styles.vazioEyebrow}>Agenda de mentorias</p>
              <h2 id="mentorias-vazio-titulo">
                {sessoes.length === 0 ? 'Novas sessões aparecem aqui.' : 'Sua agenda está livre.'}
              </h2>
              <p>Você verá mentor, horário e custo antes de confirmar o check-in.</p>
            </div>
          </div>

          <div className={styles.vazioDecisao}>
            <span className={styles.vazioSaldo}>
              <Coins size={17} strokeWidth={1.7} aria-hidden="true" />
              <span>
                <small>Saldo disponível</small>
                <strong>{saldo === null ? '—' : saldo} créditos</strong>
              </span>
            </span>
            <Link href="/formacoes" className={styles.vazioCta}>
              Continuar aprendendo
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            {totalCheckins > 0 ? (
              <HistoricoDropdown total={totalCheckins} rotulo="Ver check-ins">
                <MeusCheckins sessoes={sessoes} agora={agora} aoAbrirDetalhe={abrirDetalhe} />
              </HistoricoDropdown>
            ) : null}
          </div>
        </section>
      ) : (
        <>
          {/* AS TABS ABREM A TELA, acima do cartão. Elas escolhem o MODO DE
              LEITURA da agenda inteira — estavam abaixo do cartão, o que as
              rebaixava a controle de uma seção quando na verdade governam tudo
              que vem depois. */}
          <div className={styles.chrome}>
            <div className={styles.chromeContexto}>
              <p className={styles.chromeEyebrow}>Próximas sessões</p>
              <p className={styles.chromeResumo} aria-live="polite">
                {futuras.length} {futuras.length === 1 ? 'próxima sessão' : 'próximas sessões'}
                {checkinsAbertos > 0 && (
                  <>
                    {' · '}
                    {checkinsAbertos}{' '}
                    {checkinsAbertos === 1
                      ? 'disponível para check-in'
                      : 'disponíveis para check-in'}
                  </>
                )}
              </p>
            </div>

            <div className={styles.chromeAcoes}>
              <span className={styles.saldoAtual} aria-label={`${saldo ?? 0} créditos disponíveis`}>
                <Coins size={15} strokeWidth={1.8} aria-hidden="true" />
                <strong>{saldo === null ? '—' : saldo}</strong>
                <span>créditos</span>
              </span>
              {/* O `SeletorVista` era uma CÓPIA do controle segmentado — e o
            comentário do próprio `ControleSegmentado` já dizia que ele fora
            extraído para substituir esta cópia e as abas de catálogo. A
            cópia ficou para trás e, com ela, as setas do teclado: o
            `role="tablist"` prometia navegação por seta e não entregava. */}
              <ControleSegmentado
                opcoes={[
                  { id: 'agenda', rotulo: 'Agenda', icone: ICONE_AGENDA },
                  { id: 'calendario', rotulo: 'Mês', icone: ICONE_CALENDARIO },
                ]}
                ativa={vista}
                aoMudar={(id) => setVista(id as IdVista)}
                layoutId="mentorias-vista"
                ariaLabel="Modo de visualização"
              />

              {/* O canto direito da mesma linha: histórico completo de check-ins,
                encerradas incluídas — o trilho lateral só enxerga as futuras, e
                sessão que termina sumia da tela sem deixar rastro. Presente
                mesmo com zero: o painel vazio diz isso com uma linha honesta,
                como no Consultor. */}
              <HistoricoDropdown total={totalCheckins} rotulo="Check-ins">
                <MeusCheckins sessoes={sessoes} agora={agora} aoAbrirDetalhe={abrirDetalhe} />
              </HistoricoDropdown>
            </div>
          </div>

          {/* O CARTÃO GRANDE É DA AGENDA, não da tela. No calendário ele repetia
              em 400px de altura a mesma sessão que a grade já mostra na célula do
              dia — e empurrava o mês inteiro para fora da dobra. A vista de
              calendário É a visão geral; um destaque acima dela compete com ela. */}
          {vista === 'agenda' && destaque && (
            <CartaoProxima
              sessao={destaque}
              estado={estadoComInscricao(destaque)}
              agora={agora}
              gravando={gravando}
              aoAbrirDetalhe={() => abrirDetalhe(destaque.id)}
              aoFazerCheckin={() => pedirCheckin(destaque.id)}
              aoCancelarCheckin={() => pedirCancelamento(destaque.id)}
            />
          )}

          <div className={styles.corpo} data-vista={vista}>
            <div className={styles.principal}>
              {vista === 'agenda' ? (
                <AgendaMentorias
                  sessoes={futuras}
                  agora={agora}
                  agoraIso={agoraIso}
                  estadoDaSessao={estadoComInscricao}
                  gravando={gravando}
                  aoAbrirDetalhe={abrirDetalhe}
                  aoFazerCheckin={pedirCheckin}
                  aoCancelarCheckin={pedirCancelamento}
                />
              ) : (
                <CalendarioMentorias
                  sessoes={sessoes}
                  agora={agora}
                  estadoDaSessao={estadoComInscricao}
                  aoAbrirDetalhe={abrirDetalhe}
                />
              )}
            </div>
          </div>
        </>
      )}

      <ModalDetalheMentoria
        sessao={detalhe}
        estado={detalhe ? estadoComInscricao(detalhe) : null}
        agora={agora}
        gravando={gravando}
        aoFechar={() => setDetalheId(null)}
        aoFazerCheckin={pedirCheckin}
        aoCancelarCheckin={pedirCancelamento}
      />

      {/* A separação entre estado e ação termina numa confirmação curta. O
          cancelamento libera uma vaga para outra pessoa; deixá-lo em um clique
          na linha torna a ação evidente, mas também fácil de acionar por engano. */}
      <ModalOperacaoMentoria
        tipo="cancelamento"
        sessao={cancelando}
        fase={faseCancelamento}
        falha={falhaOperacao}
        saldoAtual={saldo}
        agora={agora}
        aoFechar={fecharCancelamento}
        aoConfirmar={confirmarCancelamento}
      />

      {/* Confirmação de check-in */}
      <ModalOperacaoMentoria
        tipo="checkin"
        sessao={confirmando}
        fase={faseCheckin}
        falha={falhaOperacao}
        saldoAtual={saldo}
        agora={agora}
        aoFechar={fecharCheckin}
        aoConfirmar={confirmarCheckin}
      />
    </div>
  );
}
