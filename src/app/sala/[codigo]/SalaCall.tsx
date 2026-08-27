'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  Video,
  WifiOff,
} from 'lucide-react';
import type { DisconnectReason } from 'livekit-client';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ConviteCall } from '@/lib/calls/queries';
import type { PlanoCall } from '@/lib/calls/plano';
import { atrasoDaReconexao, desconexaoPermiteRetomar } from '@/lib/calls/reconexao';
import { callPassouDaJanela, callPodeAbrir, ROTULO_STATUS_CALL } from '@/lib/calls/tipos';
import { LiveCoach } from './LiveCoach';
import styles from './sala.module.css';

const DATA = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

type Credenciais = { serverUrl: string; token: string };
type Recuperacao = { estado: 'tentando' | 'falhou'; tentativa: number; mensagem?: string };

const MAX_TENTATIVAS_RECONEXAO = 3;

export function SalaCall({
  codigo,
  convite,
  anfitriao,
  nomeSugerido,
  videoConfigurado,
  planoAnfitriao = null,
}: {
  codigo: string;
  convite: ConviteCall;
  anfitriao: boolean;
  nomeSugerido: string;
  videoConfigurado: boolean;
  planoAnfitriao?: PlanoCall | null;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(nomeSugerido);
  const [consentiu, setConsentiu] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [credenciais, setCredenciais] = useState<Credenciais | null>(null);
  const [saida, setSaida] = useState<'processando' | 'encerrada' | null>(null);
  const [recuperacao, setRecuperacao] = useState<Recuperacao | null>(null);
  const passouDaJanela = callPassouDaJanela({
    status: convite.status,
    agendadaPara: convite.agendadaPara,
    duracaoMinutos: convite.duracaoMinutos,
  });
  const salaAberta =
    callPodeAbrir(convite.status) && !passouDaJanela && (anfitriao || convite.disponivel);
  const podeEntrar = salaAberta && videoConfigurado && nome.trim().length > 0 && consentiu;
  const estadoSala =
    salaAberta && videoConfigurado
      ? 'Sala disponível'
      : passouDaJanela
        ? 'Horário encerrado'
        : ROTULO_STATUS_CALL[convite.status];

  useEffect(() => {
    if (saida !== 'processando') return;
    const navegacao = window.setTimeout(
      () => router.replace(`/reunioes/${convite.reuniaoId}`),
      900,
    );
    return () => window.clearTimeout(navegacao);
  }, [convite.reuniaoId, router, saida]);

  async function obterCredenciais() {
    const response = await fetch('/api/calls/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, nome: nome.trim(), consentiu }),
    });
    const resultado = (await response.json()) as {
      erro?: string;
      server_url?: string;
      participant_token?: string;
    };
    if (!response.ok || !resultado.server_url || !resultado.participant_token) {
      throw new Error(resultado.erro || 'Não foi possível abrir a sala.');
    }
    return { serverUrl: resultado.server_url, token: resultado.participant_token };
  }

  useEffect(() => {
    if (recuperacao?.estado !== 'tentando') return;
    let cancelado = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const novasCredenciais = await obterCredenciais();
          if (cancelado) return;
          setCredenciais(novasCredenciais);
          setRecuperacao(null);
        } catch (falha) {
          if (cancelado) return;
          if (recuperacao.tentativa < MAX_TENTATIVAS_RECONEXAO) {
            setRecuperacao({ estado: 'tentando', tentativa: recuperacao.tentativa + 1 });
            return;
          }
          setRecuperacao({
            estado: 'falhou',
            tentativa: recuperacao.tentativa,
            mensagem: falha instanceof Error ? falha.message : 'Não foi possível retomar a sala.',
          });
        }
      })();
    }, atrasoDaReconexao(recuperacao.tentativa));
    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
    // Nome e consentimento não mudam enquanto a pessoa está dentro da reunião.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recuperacao]);

  function aoDesconectar(reason?: DisconnectReason) {
    setCredenciais(null);
    if (desconexaoPermiteRetomar(reason)) {
      setRecuperacao({ estado: 'tentando', tentativa: 1 });
      return;
    }
    setSaida(anfitriao ? 'processando' : 'encerrada');
  }

  async function encerrarDepoisDaFalha() {
    if (anfitriao) {
      await fetch(`/api/calls/${convite.reuniaoId}/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentos: [] }),
        keepalive: true,
      }).catch(() => null);
    }
    setRecuperacao(null);
    setSaida(anfitriao ? 'processando' : 'encerrada');
  }

  async function entrar() {
    if (!podeEntrar) return;
    setCarregando(true);
    setErro('');

    try {
      setCredenciais(await obterCredenciais());
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível abrir a sala.');
    } finally {
      setCarregando(false);
    }
  }

  if (recuperacao) {
    const tentando = recuperacao.estado === 'tentando';
    return (
      <main className={styles.saida}>
        <section className={styles.saidaCartao} role="status" aria-live="assertive">
          <span className={styles.saidaIcone} aria-hidden="true">
            {tentando ? (
              <LoaderCircle className="lucide-loader-circle" size={28} />
            ) : (
              <WifiOff size={28} />
            )}
          </span>
          <p>
            {tentando
              ? `Tentativa ${recuperacao.tentativa} de ${MAX_TENTATIVAS_RECONEXAO}`
              : 'Conexão interrompida'}
          </p>
          <h1>{tentando ? 'Reconectando à reunião' : 'A reunião continua protegida'}</h1>
          <span>
            {tentando
              ? 'Aguarde um instante. Você volta para a mesma conversa automaticamente.'
              : recuperacao.mensagem || 'Confira sua internet e tente entrar novamente.'}
          </span>
          {tentando ? (
            <i aria-hidden="true" />
          ) : (
            <div className={styles.recuperacaoAcoes}>
              <button
                type="button"
                className={styles.botaoRetomar}
                onClick={() => setRecuperacao({ estado: 'tentando', tentativa: 1 })}
              >
                <RotateCcw size={16} aria-hidden="true" /> Tentar novamente
              </button>
              <button
                type="button"
                className={styles.botaoEncerrar}
                onClick={() => void encerrarDepoisDaFalha()}
              >
                {anfitriao ? 'Encerrar e salvar' : 'Sair da reunião'}
              </button>
            </div>
          )}
        </section>
      </main>
    );
  }

  if (credenciais) {
    return (
      <div className={styles.salaAoVivo} data-lk-theme="default">
        <LiveKitRoom
          token={credenciais.token}
          serverUrl={credenciais.serverUrl}
          connect
          audio
          video
          onDisconnected={aoDesconectar}
        >
          {anfitriao ? (
            <div className={styles.experienciaAnfitriao}>
              <div className={styles.palcoVideo}>
                <VideoConference />
              </div>
              <LiveCoach
                reuniaoId={convite.reuniaoId}
                ativo={convite.liveCoachAtivo}
                plano={planoAnfitriao}
              />
            </div>
          ) : (
            <VideoConference />
          )}
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  if (saida) {
    return (
      <main className={styles.saida}>
        <section className={styles.saidaCartao} role="status" aria-live="polite">
          <span className={styles.saidaIcone} aria-hidden="true">
            {saida === 'processando' ? <LoaderCircle size={28} /> : <CheckCircle2 size={28} />}
          </span>
          <p>{saida === 'processando' ? 'Conversa salva' : 'Reunião encerrada'}</p>
          <h1>
            {saida === 'processando' ? 'Preparando o resumo da reunião' : 'Obrigado por participar'}
          </h1>
          <span>
            {saida === 'processando'
              ? 'Você será levado para revisar os fatos e o próximo passo desta venda.'
              : 'Você já pode fechar esta página com segurança.'}
          </span>
          {saida === 'processando' && <i aria-hidden="true" />}
        </section>
      </main>
    );
  }

  return (
    <main className={styles.pagina}>
      <div className={styles.marca}>
        <SubidoLogo size={18} variant="mono" />
        <span className={styles.marcaApoio}>Sala da reunião</span>
      </div>

      <section className={styles.cartao}>
        <div className={styles.contexto}>
          <p className={styles.sobretitulo}>{anfitriao ? 'Sua sala' : 'Você foi convidado'}</p>
          <h1>{convite.titulo}</h1>
          <div className={styles.horario}>
            <CalendarClock size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{DATA.format(new Date(convite.agendadaPara))}</span>
            <small>{convite.duracaoMinutos} minutos</small>
          </div>

          <div className={styles.memoria}>
            <p>O que acontece com esta conversa</p>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <strong>Áudio e transcrição privados</strong>
                  <small>A conversa fica ligada somente ao histórico desta ficha.</small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Resumo para revisão</strong>
                  <small>Decisões e próximos passos aparecem depois da reunião.</small>
                </div>
              </li>
              {convite.liveCoachAtivo && anfitriao && (
                <li>
                  <span>03</span>
                  <div>
                    <strong>Coach só para você</strong>
                    <small>O convidado não vê as recomendações durante a conversa.</small>
                  </div>
                </li>
              )}
            </ol>
          </div>
        </div>

        <div className={styles.entrada}>
          <div className={styles.estado}>
            <span>Estado da sala</span>
            <strong>{estadoSala}</strong>
          </div>
          <h2>Preparar entrada</h2>
          <p>Confirme seu nome e como esta conversa será registrada.</p>

          <label className={styles.campo}>
            <span>Seu nome</span>
            <input
              value={nome}
              onChange={(evento) => setNome(evento.target.value)}
              autoComplete="name"
              maxLength={160}
              placeholder="Como quer aparecer"
            />
          </label>

          <label className={styles.consentimento}>
            <input
              type="checkbox"
              checked={consentiu}
              onChange={(evento) => setConsentiu(evento.target.checked)}
            />
            <span>
              Concordo com a gravação e transcrição desta reunião para gerar o histórico, o resumo e
              os próximos passos da conversa.
            </span>
          </label>

          <div className={styles.destinoDados}>
            <FileText size={16} strokeWidth={1.8} aria-hidden="true" />
            <p>
              <strong>Depois da reunião</strong>
              <span>Você poderá revisar tudo antes de atualizar a ficha do cliente.</span>
            </p>
          </div>

          {!videoConfigurado && (
            <div className={styles.aviso}>
              A infraestrutura de vídeo está em ativação. O agendamento e o link já estão
              preservados.
            </div>
          )}
          {videoConfigurado && !salaAberta && callPodeAbrir(convite.status) && (
            <div className={styles.aviso}>
              {passouDaJanela
                ? 'O horário terminou sem esta reunião ser concluída. Organize a pendência em Reuniões.'
                : 'A sala abre 30 minutos antes do horário agendado.'}
            </div>
          )}
          {!callPodeAbrir(convite.status) && (
            <div className={styles.aviso}>Esta reunião já foi encerrada.</div>
          )}
          {erro && (
            <div className={styles.erro} role="alert">
              {erro}
            </div>
          )}

          {carregando && (
            <div className={styles.conectando} role="status" aria-live="polite">
              <span className={styles.conectandoIcone} aria-hidden="true">
                <LoaderCircle size={18} />
              </span>
              <span>
                <strong>Preparando sua entrada</strong>
                <small>Conectando acesso protegido, áudio e vídeo.</small>
              </span>
              <i aria-hidden="true">
                <span />
              </i>
            </div>
          )}

          <button type="button" onClick={() => void entrar()} disabled={!podeEntrar || carregando}>
            {carregando ? (
              <LoaderCircle className={styles.girando} size={17} aria-hidden="true" />
            ) : (
              <Video size={17} strokeWidth={1.9} aria-hidden="true" />
            )}
            {carregando ? 'Abrindo sala…' : 'Entrar na reunião'}
          </button>

          <div className={styles.seguranca}>
            <LockKeyhole size={14} strokeWidth={1.8} aria-hidden="true" />
            Link individual · acesso protegido
          </div>
        </div>
      </section>

      <footer>
        <CheckCircle2 size={14} strokeWidth={1.8} aria-hidden="true" />
        Subido · em colaboração com Viver de IA
      </footer>
    </main>
  );
}
