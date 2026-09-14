'use client';

import { useCallback, useRef, useState } from 'react';
import { RascunhoReuniao, useRascunhoReuniao } from '@/app/sala/[codigo]/RascunhoReuniao';
import { RetomadaReuniao } from '@/app/sala/[codigo]/RetomadaReuniao';
import { useRetomadaReuniao } from '@/app/sala/[codigo]/useRetomadaReuniao';
import { SaidaReuniao } from '@/app/sala/[codigo]/SaidaReuniao';
import styles from '@/app/sala/[codigo]/RetomadaReuniao.module.css';
import { SalaDispositivosPreview } from '../sala-dispositivos/SalaDispositivosPreview';

const CREDENCIAIS = { token: 'simulado', serverUrl: 'wss://example.test' };
export function RetomadaPreview({ convidado }: { convidado: boolean }) {
  return (
    <RascunhoReuniao>
      <Simulacao convidado={convidado} />
    </RascunhoReuniao>
  );
}
function Simulacao({ convidado }: { convidado: boolean }) {
  const { texto, interromper, limpar } = useRascunhoReuniao();
  const [pausada, setPausada] = useState(false);
  const [pedidos, setPedidos] = useState(0);
  const [encerramentos, setEncerramentos] = useState(0);
  const [saiu, setSaiu] = useState(false);
  const falhar = useRef(false);
  const resolver = useRef<(() => void) | null>(null);
  const obter = useCallback(
    (_signal: AbortSignal) =>
      new Promise<typeof CREDENCIAIS>((resolve, reject) => {
        setPedidos((n) => n + 1);
        // Pode resolver mesmo após cancelada, para testar que um retorno antigo é ignorado.
        resolver.current = () => resolve(CREDENCIAIS);
        if (falhar.current) reject(new Error('Erro técnico que não aparece na tela'));
      }),
    [],
  );
  const { estado, dispatch, online } = useRetomadaReuniao(obter, pausada);
  const aoPronta = useCallback(
    () => dispatch({ tipo: 'conectou', geracao: estado.geracao }),
    [dispatch, estado.geracao],
  );
  const sair = (encerrar = false) => {
    if (encerrar) setEncerramentos((n) => n + 1);
    dispatch({ tipo: 'sair' });
    limpar();
    setSaiu(true);
    return Promise.resolve();
  };
  const controles = (
    <div
      hidden
      data-testid="controle-retomada"
      data-pedidos={pedidos}
      data-encerramentos={encerramentos}
      data-tentativa={estado.tentativa}
    >
      <button
        onClick={() => {
          interromper();
          dispatch({ tipo: 'queda', geracao: estado.geracao });
        }}
      >
        Simular queda
      </button>
      <button
        onClick={() => {
          falhar.current = true;
        }}
      >
        Falhar tentativas
      </button>
      <button
        onClick={() => {
          falhar.current = false;
          resolver.current?.();
        }}
      >
        Concluir retomada
      </button>
    </div>
  );
  return (
    <>
      {controles}
      {estado.fase === 'fora' ? (
        <main className={styles.pagina}>
          <button
            className={styles.tentar}
            onClick={() => {
              setSaiu(false);
              dispatch({ tipo: 'entrar', credenciais: CREDENCIAIS });
            }}
          >
            {saiu ? 'Entrar novamente na demonstração' : 'Abrir demonstração'}
          </button>
        </main>
      ) : estado.credenciais ? (
        <SalaDispositivosPreview
          key={estado.geracao}
          convidado={convidado}
          simularEnvio
          aoPronta={aoPronta}
        />
      ) : (
        <RetomadaReuniao
          titulo="Reunião com Horizonte"
          offline={!online}
          falhou={estado.fase === 'falhou'}
          rascunho={!!texto}
          aoTentar={() => dispatch({ tipo: 'tentar' })}
        >
          {convidado ? (
            <button className={styles.sair} onClick={() => void sair()}>
              Sair da reunião
            </button>
          ) : (
            <SaidaReuniao
              className={styles.sair}
              aoMudarAbertura={setPausada}
              aoSair={() => sair()}
              aoEncerrar={() => sair(true)}
            />
          )}
        </RetomadaReuniao>
      )}
    </>
  );
}
