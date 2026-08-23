'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { EmptyState } from '@/design-system/via';
import { cancelarCheckin, fazerCheckin } from '@/lib/mentorias/actions';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import type { EstadoMentoria } from './estadoMentoria';
import { atualizarUrlFiltros } from '../../_components/filtros/espelhoUrl';
import { AgendaMentorias } from './AgendaMentorias';
import { CalendarioMentorias } from './CalendarioMentorias';
import { CartaoProxima } from './CartaoProxima';
import { TrilhoInscricoes } from './TrilhoInscricoes';
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
 * A LARGURA SEPARA OS DOIS MIOLOS, e é a regra da casa aplicada ao pé da letra:
 * "grade ganha coluna, lista tem MEDIDA". A agenda é uma pilha de linhas de um
 * dado só (hora + título + mentor + CTA) — esticada no canvas de 1600, o miolo
 * vira vão morto entre o título e o botão. O calendário é grade: ele PRECISA da
 * área, e por isso ocupa a largura inteira. O cartão da próxima acompanha o
 * canvas nos dois casos, porque card com mesh gosta de largura.
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
}: {
  sessoes: SessaoMentoria[];
  agoraIso: string;
  vistaInicial: IdVista;
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

  /* O TRILHO SOME QUANDO NÃO HÁ CHECK-IN — e a GRADE precisa saber disso.
     `TrilhoInscricoes` já devolvia `null` sozinho, mas a coluna continuava
     reservada: quem nunca se inscreveu via ~360px de nada à direita da lista, e
     as linhas ficavam espremidas num canto de uma tela larga. CSS não consegue
     perguntar "meu filho renderizou?", então quem responde é este booleano. */
  const temInscricoes = futuras.some((s) => s.euInscrito);

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
        <EmptyState
          title={sessoes.length === 0 ? 'Nenhuma mentoria publicada' : 'Nenhuma mentoria agendada'}
          description="As próximas sessões aparecem aqui com data, horário e custo em créditos. Depois do check-in, a sala fica disponível nesta página."
          action={
            <div className={styles.vazioAcoes}>
              <Link href="/formacoes" className={styles.vazioCta}>
                Continuar formação
              </Link>
              {totalCheckins > 0 ? (
                <HistoricoDropdown total={totalCheckins} rotulo="Check-ins anteriores">
                  <MeusCheckins sessoes={sessoes} agora={agora} aoAbrirDetalhe={abrirDetalhe} />
                </HistoricoDropdown>
              ) : null}
            </div>
          }
        />
      ) : (
        <>
          {/* AS TABS ABREM A TELA, acima do cartão. Elas escolhem o MODO DE
              LEITURA da agenda inteira — estavam abaixo do cartão, o que as
              rebaixava a controle de uma seção quando na verdade governam tudo
              que vem depois. */}
          <div className={styles.chrome}>
            <div className={styles.chromeContexto}>
              <p className={styles.chromeEyebrow}>Agenda de mentorias</p>
              <p className={styles.chromeResumo}>
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

          <div
            className={styles.corpo}
            data-vista={vista}
            data-apoio={temInscricoes ? '' : undefined}
          >
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

            {/* Some sozinho quando não há check-in — ver o componente. */}
            <aside className={styles.apoio}>
              <TrilhoInscricoes sessoes={futuras} agora={agora} aoAbrirDetalhe={abrirDetalhe} />
            </aside>
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
        agora={agora}
        aoFechar={fecharCheckin}
        aoConfirmar={confirmarCheckin}
      />
    </div>
  );
}
