'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
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
import { SalaAoVivo } from './SalaAoVivo';
import { RoteiroSala } from './RoteiroSala';
import { EstadoFinalSala } from './EstadoFinalSala';
import { PreparacaoMidia } from './PreparacaoMidia';
import { MIDIA_INICIAL, usePreparacaoMidia, type EscolhasMidia } from './usePreparacaoMidia';
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
  const midia = usePreparacaoMidia();
  const [escolhasEntrada, setEscolhasEntrada] = useState<EscolhasMidia>(MIDIA_INICIAL);
  const kickoff = convite.tipo === 'kickoff';
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
    if (!podeEntrar || carregando) return;
    setEscolhasEntrada(midia.escolhas);
    midia.liberar();
    setCarregando(true);
    setErro('');

    try {
      setCredenciais(await obterCredenciais());
    } catch (falha) {
      midia.desligar('audio');
      midia.desligar('video');
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
      <SalaAoVivo
        credenciais={credenciais}
        convite={convite}
        anfitriao={anfitriao}
        plano={planoAnfitriao}
        aoDesconectar={aoDesconectar}
        escolhas={escolhasEntrada}
        aoMudarEscolhas={setEscolhasEntrada}
      />
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
            {saida === 'processando'
              ? kickoff
                ? 'Organizando o acordo do projeto'
                : 'Preparando o resumo da reunião'
              : 'Obrigado por participar'}
          </h1>
          <span>
            {saida === 'processando'
              ? kickoff
                ? 'Você será levado para revisar resultado, responsáveis, acessos, limites e próximos passos.'
                : 'Você será levado para revisar os fatos e o próximo passo desta venda.'
              : 'Você já pode fechar esta página com segurança.'}
          </span>
          {saida === 'processando' && <i aria-hidden="true" />}
        </section>
      </main>
    );
  }

  if (!callPodeAbrir(convite.status) || passouDaJanela) {
    return (
      <EstadoFinalSala
        convite={convite}
        anfitriao={anfitriao}
        passouDaJanela={passouDaJanela}
        horario={DATA.format(new Date(convite.agendadaPara))}
      />
    );
  }

  return (
    <main className={styles.pagina}>
      <div className={styles.marca}>
        <SubidoLogo size={18} />
        <span className={styles.marcaApoio}>{kickoff ? 'Sala do kickoff' : 'Sala da reunião'}</span>
      </div>

      <section className={styles.cartao} data-convidado={!anfitriao || undefined}>
        <div className={styles.contexto}>
          <p className={styles.sobretitulo}>
            {anfitriao ? (kickoff ? 'Seu kickoff' : 'Sua sala') : 'Você foi convidado'}
          </p>
          <h1>{convite.titulo}</h1>
          <div className={styles.horario}>
            <CalendarClock size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{DATA.format(new Date(convite.agendadaPara))}</span>
            <small>{convite.duracaoMinutos} minutos</small>
          </div>

          {salaAberta && videoConfigurado && (
            <PreparacaoMidia midia={midia} bloqueado={carregando} />
          )}

          {anfitriao && (
            <details className={styles.memoria}>
              <summary>{kickoff ? 'O que precisa sair definido' : 'Durante a reunião'}</summary>
              <RoteiroSala kickoff={kickoff} mostrarCoach={convite.liveCoachAtivo && anfitriao} />
            </details>
          )}
        </div>

        <div className={styles.entrada}>
          <div className={styles.estado}>
            <span>Estado da sala</span>
            <strong>{estadoSala}</strong>
          </div>
          {anfitriao && (
            <>
              <h2>{kickoff ? 'Preparar kickoff' : 'Preparar entrada'}</h2>
              <p>
                {kickoff
                  ? 'Confirme seu nome. O acordo só será atualizado após sua revisão.'
                  : 'Confirme seu nome e autorize o registro.'}
              </p>
            </>
          )}

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
              {kickoff
                ? 'Autorizo a gravação e a transcrição para preparar o acordo do projeto.'
                : 'Autorizo a gravação e a transcrição para gerar o resumo e os próximos passos.'}
            </span>
          </label>

          {anfitriao && (
            <div className={styles.destinoDados}>
              {kickoff ? (
                <ClipboardCheck size={16} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <FileText size={16} strokeWidth={1.8} aria-hidden="true" />
              )}
              <p>
                <strong>{kickoff ? 'Ao encerrar' : 'Depois da reunião'}</strong>
                <span>
                  {kickoff
                    ? 'Revise o acordo antes de iniciar a execução.'
                    : 'Revise o resumo antes de atualizar a ficha do cliente.'}
                </span>
              </p>
            </div>
          )}

          {!videoConfigurado && (
            <div className={styles.aviso}>
              A infraestrutura de vídeo está em ativação. O agendamento e o link já estão
              preservados.
            </div>
          )}
          {videoConfigurado && !salaAberta && (
            <div className={styles.aviso}>A sala abre 30 minutos antes do horário agendado.</div>
          )}
          {erro && (
            <div className={styles.erro} role="alert">
              {erro}
            </div>
          )}

          <button type="button" onClick={() => void entrar()} disabled={!podeEntrar || carregando}>
            {carregando ? (
              <LoaderCircle className={styles.girando} size={17} aria-hidden="true" />
            ) : (
              <Video size={17} strokeWidth={1.9} aria-hidden="true" />
            )}
            {carregando ? 'Abrindo sala…' : kickoff ? 'Entrar no kickoff' : 'Entrar na reunião'}
          </button>

          {salaAberta && videoConfigurado && !carregando && (
            <p className={styles.avisoConvidado}>
              {midia.escolhas.audio
                ? midia.escolhas.video
                  ? 'Você entrará com câmera e microfone ligados.'
                  : 'Você entrará com o microfone ligado e sem câmera.'
                : midia.escolhas.video
                  ? 'Você entrará com a câmera ligada e o microfone desligado.'
                  : 'Você entrará com câmera e microfone desligados.'}
            </p>
          )}

          {!anfitriao && (
            <p className={styles.avisoConvidado}>
              O organizador poderá revisar a gravação e o resumo.
            </p>
          )}

          <div className={styles.seguranca}>
            <LockKeyhole size={14} strokeWidth={1.8} aria-hidden="true" />
            Entrada com consentimento
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
