'use client';

import { useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react';
import { CalendarClock, CheckCircle2, FileText, LockKeyhole, Video } from 'lucide-react';
import { SubidoLogo } from '@/components/brand/SubidoLogo';
import type { ConviteCall } from '@/lib/calls/queries';
import { callPodeAbrir, ROTULO_STATUS_CALL } from '@/lib/calls/tipos';
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

export function SalaCall({
  codigo,
  convite,
  anfitriao,
  nomeSugerido,
  videoConfigurado,
}: {
  codigo: string;
  convite: ConviteCall;
  anfitriao: boolean;
  nomeSugerido: string;
  videoConfigurado: boolean;
}) {
  const [nome, setNome] = useState(nomeSugerido);
  const [consentiu, setConsentiu] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [credenciais, setCredenciais] = useState<Credenciais | null>(null);
  const salaAberta = callPodeAbrir(convite.status) && (anfitriao || convite.disponivel);
  const podeEntrar = salaAberta && videoConfigurado && nome.trim().length > 0 && consentiu;
  const estadoSala =
    salaAberta && videoConfigurado ? 'Sala disponível' : ROTULO_STATUS_CALL[convite.status];

  async function entrar() {
    if (!podeEntrar) return;
    setCarregando(true);
    setErro('');

    try {
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
      setCredenciais({ serverUrl: resultado.server_url, token: resultado.participant_token });
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível abrir a sala.');
    } finally {
      setCarregando(false);
    }
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
          onDisconnected={() => setCredenciais(null)}
        >
          {anfitriao ? (
            <div className={styles.experienciaAnfitriao}>
              <div className={styles.palcoVideo}>
                <VideoConference />
              </div>
              <LiveCoach reuniaoId={convite.reuniaoId} ativo={convite.liveCoachAtivo} />
            </div>
          ) : (
            <VideoConference />
          )}
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <main className={styles.pagina}>
      <div className={styles.marca}>
        <SubidoLogo size={18} variant="mono" />
        <span className={styles.marcaApoio}>Sala inteligente</span>
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
                  <strong>Transcrição privada</strong>
                  <small>As falas ficam ligadas somente ao histórico desta oportunidade.</small>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Resumo para revisão</strong>
                  <small>Decisões e próximos passos aparecem depois da call.</small>
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
              <strong>Depois da call</strong>
              <span>Você poderá revisar tudo antes de aplicar qualquer mudança no CRM.</span>
            </p>
          </div>

          {!videoConfigurado && (
            <div className={styles.aviso}>
              A infraestrutura de vídeo está em ativação. O agendamento e o link já estão
              preservados.
            </div>
          )}
          {videoConfigurado && !salaAberta && callPodeAbrir(convite.status) && (
            <div className={styles.aviso}>A sala abre 30 minutos antes do horário agendado.</div>
          )}
          {!callPodeAbrir(convite.status) && (
            <div className={styles.aviso}>Esta call já foi encerrada.</div>
          )}
          {erro && (
            <div className={styles.erro} role="alert">
              {erro}
            </div>
          )}

          <button type="button" onClick={() => void entrar()} disabled={!podeEntrar || carregando}>
            <Video size={17} strokeWidth={1.9} aria-hidden="true" />
            {carregando ? 'Abrindo sala…' : 'Entrar na call'}
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
