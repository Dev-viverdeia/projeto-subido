'use client';

import { useRef, useState } from 'react';
import { History } from 'lucide-react';
import { compararEdicoes, type ConteudoEdicao } from '@/lib/propostas/edicao';
import type { RascunhoProposta } from '@/lib/propostas/rascunho-local';
import { ModalOperacao } from '../../_components/ModalOperacao';
import { ComparacaoConteudo } from './ComparacaoConteudo';
import type { useRascunhoProposta } from './useRascunhoProposta';
import styles from './RevisaoEdicao.module.css';

const data = (r: RascunhoProposta) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(r.salvoEm);

export function RecuperarRascunho({
  rascunho,
  local,
  recuperar,
  ocupado,
  focarEditor,
}: {
  rascunho: ReturnType<typeof useRascunhoProposta>;
  local: ConteudoEdicao;
  recuperar: (r: RascunhoProposta) => void;
  ocupado: boolean;
  focarEditor: () => void;
}) {
  const [selecionado, setSelecionado] = useState<RascunhoProposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const { disponiveis, falhou, bloqueado } = rascunho;
  const ultimo = disponiveis[0];
  const fechar = () => {
    setSelecionado(null);
    setErro(null);
    requestAnimationFrame(() => {
      if (gatilho.current?.isConnected) gatilho.current.focus({ preventScroll: true });
      else focarEditor();
    });
  };
  if (bloqueado || (!ultimo && !falhou)) return null;
  return (
    <>
      <section className={styles.aviso} aria-label="Rascunho neste navegador">
        <History size={21} aria-hidden="true" />
        <div role="status">
          <strong>
            {falhou ? 'A cópia neste navegador não foi guardada' : 'Você tem uma edição não salva'}
          </strong>
          <p>
            {falhou
              ? 'Salve a proposta antes de sair desta página.'
              : ultimo
                ? `Guardada em ${data(ultimo)}. Nada foi enviado ao cliente.`
                : ''}
          </p>
        </div>
        {falhou ? (
          <button type="button" onClick={rascunho.tentar}>
            Tentar novamente
          </button>
        ) : (
          <button
            type="button"
            ref={gatilho}
            disabled={ocupado}
            onClick={(e) => {
              e.currentTarget.focus();
              if (ultimo) setSelecionado(ultimo);
            }}
          >
            Revisar rascunho
          </button>
        )}
      </section>
      <ModalOperacao
        open={Boolean(selecionado)}
        onClose={fechar}
        title="Recuperar edição"
        size="lg"
        blocked={ocupado}
        description="A cópia volta para os campos. A proposta salva e o link do cliente não mudam."
        footer={
          <div className={styles.acoes}>
            <button type="button" data-autofocus onClick={fechar} disabled={ocupado}>
              Voltar
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => {
                if (selecionado && rascunho.descartar(selecionado)) fechar();
                else setErro('A cópia não pôde ser removida. Feche e confira novamente.');
              }}
            >
              Descartar esta cópia
            </button>
            <button
              type="button"
              data-primary
              disabled={ocupado}
              onClick={() => {
                if (selecionado && rascunho.retomar(selecionado)) {
                  recuperar(selecionado);
                  setSelecionado(null);
                } else setErro('Salve sua edição atual antes de recuperar outra cópia.');
              }}
            >
              Recuperar nos campos
            </button>
          </div>
        }
      >
        {selecionado && (
          <>
            {disponiveis.length > 1 && (
              <label className={styles.seletor}>
                Cópia para revisar
                <select
                  value={selecionado.id}
                  onChange={(e) => {
                    const r = disponiveis.find((r) => r.id === e.target.value);
                    if (r) setSelecionado(r);
                  }}
                >
                  {disponiveis.map((r, i) => (
                    <option key={r.id} value={r.id}>
                      {data(r)} · Cópia {i + 1}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className={styles.orientacao}>
              Disponível por 7 dias neste navegador. Encerrar a sessão remove as cópias locais.
              Descartar remove somente esta cópia.
            </p>
            {erro && (
              <p role="alert" className={styles.retorno}>
                {erro}
              </p>
            )}
            {compararEdicoes(selecionado, local).length ? (
              <ComparacaoConteudo
                local={selecionado}
                salva={local}
                rotuloLocal="Cópia recuperável"
                rotuloSalva="Campos atuais"
              />
            ) : (
              <p>O conteúdo é igual ao que está nos campos.</p>
            )}
          </>
        )}
      </ModalOperacao>
    </>
  );
}
