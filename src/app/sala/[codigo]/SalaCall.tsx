'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Video,
} from 'lucide-react';
import { DisconnectReason } from 'livekit-client';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ConviteCall } from '@/lib/calls/queries';
import type { PlanoCall } from '@/lib/calls/plano';
import { desconexaoPermiteRetomar } from '@/lib/calls/reconexao';
import { callPassouDaJanela, callPodeAbrir, ROTULO_STATUS_CALL } from '@/lib/calls/tipos';
import { SalaAoVivo } from './SalaAoVivo';
import { obterCredenciaisSala, salvarSaida } from './salvarSaida';
import { RoteiroSala } from './RoteiroSala';
import { EstadoSaidaReuniao } from './EstadoSaidaReuniao';
import { EstadoFinalSala } from './EstadoFinalSala';
import { PreparacaoMidia } from './PreparacaoMidia';
import { SaidaReuniao } from './SaidaReuniao';
import { RascunhoReuniao, useRascunhoReuniao } from './RascunhoReuniao';
import { useRetomadaReuniao } from './useRetomadaReuniao';
import { RetomadaReuniao } from './RetomadaReuniao';
import retomadaStyles from './RetomadaReuniao.module.css';
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

type Props = {
  codigo: string;
  convite: ConviteCall;
  anfitriao: boolean;
  nomeSugerido: string;
  videoConfigurado: boolean;
  planoAnfitriao?: PlanoCall | null;
};

export function SalaCall(props: Props) {
  return (
    <RascunhoReuniao key={props.codigo}>
      <ParticipacaoReuniao {...props} />
    </RascunhoReuniao>
  );
}

function ParticipacaoReuniao({
  codigo,
  convite,
  anfitriao,
  nomeSugerido,
  videoConfigurado,
  planoAnfitriao = null,
}: Props) {
  const router = useRouter();
  const [nome, setNome] = useState(nomeSugerido);
  const [consentiu, setConsentiu] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [saida, setSaida] = useState<'processando' | 'encerrada' | 'saiu' | null>(null);
  const encerramentoConfirmado = useRef(false);
  const { texto, interromper, limpar } = useRascunhoReuniao();
  const [escolhendoSaida, setEscolhendoSaida] = useState(false);
  const obterCredenciais = useCallback(
    (signal?: AbortSignal) => obterCredenciaisSala(codigo, nome, consentiu, signal),
    [codigo, nome, consentiu],
  );
  const {
    estado: conexao,
    dispatch,
    online,
  } = useRetomadaReuniao(obterCredenciais, escolhendoSaida);
  const { credenciais, geracao } = conexao;
  const geracaoAtiva = useRef(geracao);
  useLayoutEffect(() => {
    geracaoAtiva.current = geracao;
  }, [geracao]);
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

  const aoDesconectar = useCallback(
    (reason?: DisconnectReason) => {
      if (geracaoAtiva.current !== geracao) return;
      geracaoAtiva.current = -1;
      if (encerramentoConfirmado.current && anfitriao) {
        dispatch({ tipo: 'sair' });
        limpar();
        setSaida('processando');
        return;
      }
      if (desconexaoPermiteRetomar(reason)) {
        interromper();
        dispatch({ tipo: 'queda', geracao });
        return;
      }
      dispatch({ tipo: 'sair' });
      limpar();
      setSaida(reason === DisconnectReason.CLIENT_INITIATED ? 'saiu' : 'encerrada');
    },
    [anfitriao, dispatch, geracao, interromper, limpar],
  );

  const aoConectar = useCallback(() => {
    if (geracaoAtiva.current === geracao) dispatch({ tipo: 'conectou', geracao });
  }, [dispatch, geracao]);
  const aoFalharConexao = useCallback(() => aoDesconectar(), [aoDesconectar]);

  async function encerrarDepoisDaFalha() {
    if (anfitriao) {
      await salvarSaida(convite.reuniaoId, [], true);
      encerramentoConfirmado.current = true;
    }
    dispatch({ tipo: 'sair' });
    limpar();
    setSaida(anfitriao ? 'processando' : 'encerrada');
  }

  async function entrar() {
    if (!podeEntrar || carregando) return;
    setEscolhasEntrada(midia.escolhas);
    midia.liberar();
    setCarregando(true);
    setErro('');

    try {
      const novasCredenciais = await obterCredenciais();
      encerramentoConfirmado.current = false;
      dispatch({ tipo: 'entrar', credenciais: novasCredenciais });
    } catch (falha) {
      midia.desligar('audio');
      midia.desligar('video');
      setErro(falha instanceof Error ? falha.message : 'Não foi possível abrir a sala.');
    } finally {
      setCarregando(false);
    }
  }

  if (conexao.fase === 'recuperando' || conexao.fase === 'falhou') {
    return (
      <RetomadaReuniao
        titulo={convite.titulo}
        offline={!online}
        falhou={conexao.fase === 'falhou'}
        rascunho={!!texto}
        aoTentar={() => dispatch({ tipo: 'tentar' })}
      >
        {anfitriao ? (
          <SaidaReuniao
            aoMudarAbertura={setEscolhendoSaida}
            className={retomadaStyles.sair}
            aoEncerrar={encerrarDepoisDaFalha}
            aoSair={async () => {
              // Sem internet, sair só desta participação é local; não encerra a reunião.
              if (online) await salvarSaida(convite.reuniaoId, [], false);
              dispatch({ tipo: 'sair' });
              limpar();
              setSaida('saiu');
            }}
          />
        ) : (
          <button
            type="button"
            className={retomadaStyles.sair}
            onClick={() => {
              dispatch({ tipo: 'sair' });
              limpar();
              setSaida('saiu');
            }}
          >
            Sair da reunião
          </button>
        )}
      </RetomadaReuniao>
    );
  }

  if (credenciais) {
    return (
      <SalaAoVivo
        key={geracao}
        credenciais={credenciais}
        convite={convite}
        anfitriao={anfitriao}
        plano={planoAnfitriao}
        aoDesconectar={aoDesconectar}
        aoConectar={aoConectar}
        aoFalharConexao={aoFalharConexao}
        escolhas={escolhasEntrada}
        aoMudarEscolhas={setEscolhasEntrada}
        aoConfirmarEncerramento={() => {
          encerramentoConfirmado.current = true;
        }}
      />
    );
  }

  if (saida) {
    return (
      <EstadoSaidaReuniao
        estado={saida}
        anfitriao={anfitriao}
        reuniaoId={convite.reuniaoId}
        aoVoltar={() => {
          midia.desligar('audio');
          midia.desligar('video');
          setErro('');
          setSaida(null);
        }}
      />
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
