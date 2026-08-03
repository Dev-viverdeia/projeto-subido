'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Alert, Button, EmptyState, Modal } from '@/design-system/via';
import { cancelarCheckin, fazerCheckin } from '@/lib/mentorias/actions';
import { iniciais } from '../../_components/iniciais';
import { TRILHAS } from '@/lib/mentorias/tipos';
import type { SessaoMentoria } from '@/lib/mentorias/tipos';
import type { EstadoMentoria } from './estadoMentoria';
import { atualizarUrlFiltros } from '../../_components/filtros/espelhoUrl';
import { AgendaMentorias } from './AgendaMentorias';
import { CalendarioMentorias } from './CalendarioMentorias';
import { CartaoProxima } from './CartaoProxima';
import { TrilhoInscricoes } from './TrilhoInscricoes';
import { ControleSegmentado } from '../../_components/filtros/ControleSegmentado';
import { ICONE_AGENDA, ICONE_CALENDARIO, type IdVista } from './vistas';
import { duracaoMin, estadoDe, horaCurta, rotuloDoDia } from './estadoMentoria';
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
  const [erro, setErro] = useState<string | null>(null);

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

  const porId = useCallback(
    (id: string | null) => (id ? (sessoes.find((s) => s.id === id) ?? null) : null),
    [sessoes],
  );
  const detalhe = porId(detalheId);
  const confirmando = porId(confirmandoId);
  const mentorDoDetalhe = detalhe?.mentor;

  const abrirDetalhe = useCallback((id: string) => setDetalheId(id), []);
  const pedirCheckin = useCallback((id: string) => setConfirmandoId(id), []);
  const executar = useCallback((acao: () => Promise<{ ok: boolean; mensagem?: string }>) => {
    setErro(null);
    iniciarGravacao(async () => {
      const r = await acao();
      if (!r.ok) setErro(r.mensagem ?? 'Não foi possível concluir agora.');
    });
  }, []);

  const cancelar = useCallback((id: string) => executar(() => cancelarCheckin(id)), [executar]);

  return (
    <div className={styles.raiz}>
      {/* A recusa vem do TRIGGER, não daqui — "as vagas acabaram enquanto você
          decidia" é uma frase que só o banco pode dizer com verdade. */}
      {/* `role="alert"` no wrapper e não no `Alert`: o componente do DS não
          repassa props soltas, e sem o papel o texto entra em tela sem ser
          anunciado — quem usa leitor de tela clicaria em "Confirmar" e não
          saberia por que nada aconteceu. */}
      {erro && (
        <div role="alert">
          <Alert tone="attn">{erro}</Alert>
        </div>
      )}

      {/* CATÁLOGO VAZIO ≠ FILTRO VAZIO, e confundir os dois cria um beco: a
          mensagem da agenda diz "veja em Todas as próximas sessões", o que só
          faz sentido quando existe sessão em ALGUM lugar. Sem nenhuma mentoria
          publicada, esse convite leva a outra tela vazia.
          Este estado passou a ser o estado NORMAL da tela — a agenda deixou de
          ser gerada em código e começa sem nada até o admin cadastrar. */}
      {sessoes.length === 0 ? (
        <EmptyState
          title="Nenhuma mentoria publicada"
          description="As sessões aparecem aqui assim que forem agendadas. Você vê o horário, faz check-in e recebe a sala pelo mesmo lugar."
        />
      ) : (
        <>
          {destaque && (
            <CartaoProxima
              sessao={destaque}
              estado={estadoComInscricao(destaque)}
              agora={agora}
              aoAbrirDetalhe={() => abrirDetalhe(destaque.id)}
              aoFazerCheckin={() => pedirCheckin(destaque.id)}
            />
          )}

          <div className={styles.corpo} data-vista={vista}>
            <div className={styles.principal}>
              <div className={styles.chrome}>
                {/* O `SeletorVista` era uma CÓPIA do controle segmentado — e o
                comentário do próprio `ControleSegmentado` já dizia que ele fora
                extraído para substituir esta cópia e as abas de catálogo. A
                cópia ficou para trás e, com ela, as setas do teclado: o
                `role="tablist"` prometia navegação por seta e não entregava. */}
                <ControleSegmentado
                  opcoes={[
                    { id: 'agenda', rotulo: 'Agenda', icone: ICONE_AGENDA },
                    { id: 'calendario', rotulo: 'Calendário', icone: ICONE_CALENDARIO },
                  ]}
                  ativa={vista}
                  aoMudar={(id) => setVista(id as IdVista)}
                  layoutId="mentorias-vista"
                  ariaLabel="Modo de visualização"
                />
              </div>

              {vista === 'agenda' ? (
                <AgendaMentorias
                  sessoes={futuras}
                  agora={agora}
                  agoraIso={agoraIso}
                  estadoDaSessao={estadoComInscricao}
                  gravando={gravando}
                  aoAbrirDetalhe={abrirDetalhe}
                  aoFazerCheckin={pedirCheckin}
                  aoCancelarCheckin={cancelar}
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

      {/* Ficha da sessão — a mesma dos dois lados. */}
      <Modal
        open={detalhe !== null}
        onClose={() => setDetalheId(null)}
        title={detalhe?.titulo}
        size="md"
      >
        {detalhe && (
          <div className={styles.detalhe}>
            {/* Os quatro dados viram uma TIRA com rótulo, não uma frase em mono.
                Numa linha só, "TER 28 JUL · 19:00–20:30 · 90 MIN · 22/30 VAGAS"
                obriga a pessoa a decodificar a posição para saber o que é cada
                número. Com rótulo, cada um se lê sozinho. */}
            <dl className={styles.ficha}>
              <div className={styles.fichaItem}>
                <dt className={styles.fichaRotulo}>Quando</dt>
                <dd className={styles.fichaValor}>{rotuloDoDia(detalhe.inicioIso, agora).mono}</dd>
              </div>
              <div className={styles.fichaItem}>
                <dt className={styles.fichaRotulo}>Horário</dt>
                <dd className={styles.fichaValor}>
                  {horaCurta(detalhe.inicioIso)}–{horaCurta(detalhe.fimIso)}
                </dd>
              </div>
              <div className={styles.fichaItem}>
                <dt className={styles.fichaRotulo}>Duração</dt>
                <dd className={styles.fichaValor}>{duracaoMin(detalhe)} min</dd>
              </div>
              <div className={styles.fichaItem}>
                <dt className={styles.fichaRotulo}>Vagas</dt>
                <dd className={styles.fichaValor}>
                  {detalhe.inscritos}/{detalhe.vagas}
                </dd>
              </div>
            </dl>

            {/* SEM BARRA DE LOTAÇÃO — a regra da casa é literal: "zero contador,
                zero vagas restantes, zero barra de lotação". Uma barra que enche
                é medidor de escassez, e medidor de escassez converte no clique e
                diverge no reembolso.

                O NÚMERO fica, porque ele não é a mesma coisa: "22/30" é fato
                verificável e operacionalmente necessário — sem ele não dá para
                saber se ainda cabe. O que sai é o gesto que transforma o fato em
                pressão. Ele já está na tira de fichas acima, com rótulo. */}

            <p className={styles.detalheTexto}>{detalhe.descricao}</p>

            {/* Ficha do mentor: monograma, nome e credencial numa caixa própria.
                É onde a headline mora — na lista ela repetia a mesma frase em
                cada linha; aqui é lida uma vez, no momento em que importa. */}
            {mentorDoDetalhe && (
              <div className={styles.mentorCartao} data-trilha={mentorDoDetalhe.trilha}>
                <span className={styles.mentorMonograma} aria-hidden="true">
                  {iniciais(mentorDoDetalhe.nome)}
                </span>
                <span className={styles.mentorTextos}>
                  <span className={styles.mentorNome}>{mentorDoDetalhe.nome}</span>
                  <span className={styles.mentorHeadline}>{mentorDoDetalhe.headline}</span>
                </span>
                <span className={styles.mentorTrilha}>
                  {TRILHAS[mentorDoDetalhe.trilha].rotulo}
                </span>
              </div>
            )}
            {estadoComInscricao(detalhe) === 'checkin-aberto' && (
              <Button
                variant="primary"
                onClick={() => {
                  setDetalheId(null);
                  setConfirmandoId(detalhe.id);
                }}
              >
                Fazer check-in
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmação de check-in */}
      <Modal
        open={confirmando !== null}
        onClose={() => setConfirmandoId(null)}
        title="Confirmar check-in"
        size="sm"
        footer={
          <div className={styles.confirmarAcoes}>
            <Button variant="ghost" onClick={() => setConfirmandoId(null)}>
              Voltar
            </Button>
            <Button
              variant="primary"
              disabled={gravando}
              onClick={() => {
                const id = confirmandoId;
                if (!id) return;
                setConfirmandoId(null);
                executar(() => fazerCheckin(id));
              }}
            >
              {gravando ? 'Confirmando…' : 'Confirmar'}
            </Button>
          </div>
        }
      >
        {confirmando && (
          <p className={styles.confirmarTexto}>
            Você garante a vaga em “{confirmando.titulo}” (
            {rotuloDoDia(confirmando.inicioIso, agora).principal.toLowerCase()},{' '}
            {horaCurta(confirmando.inicioIso)}). Dá para cancelar até o início — a vaga volta para a
            fila.
          </p>
        )}
      </Modal>
    </div>
  );
}
