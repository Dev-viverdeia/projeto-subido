'use client';

import { useRef } from 'react';
import { ChevronDown, FileDiff } from 'lucide-react';
import { Spinner } from '@/design-system/via';
import { compararEdicoes, type ConteudoEdicao } from '@/lib/propostas/edicao';
import { ROTULO_STATUS_PROPOSTA } from '@/lib/propostas/status';
import { ModalOperacao } from '../../_components/ModalOperacao';
import type { useEdicaoSegura } from './useEdicaoSegura';
import styles from './RevisaoEdicao.module.css';

export function RevisaoEdicao({
  edicao,
  local,
  salvar,
  salvando,
  semAcesso,
}: {
  edicao: ReturnType<typeof useEdicaoSegura>;
  local: ConteudoEdicao;
  salvar: (dados: FormData) => void;
  salvando: boolean;
  semAcesso: boolean;
}) {
  const gatilho = useRef<HTMLButtonElement>(null);
  const fechar = () => {
    edicao.fechar();
    requestAnimationFrame(() => gatilho.current?.focus({ preventScroll: true }));
  };
  const { remota, erro, consultando } = edicao;
  if (!edicao.bloqueado && !erro) return null;
  const diferencas = remota ? compararEdicoes(local, remota) : [];
  return (
    <>
      <section className={styles.aviso} aria-label="Atualização do documento">
        <FileDiff size={21} aria-hidden="true" />
        <div role="status">
          <strong>
            {remota
              ? 'Esta proposta mudou em outra aba ou dispositivo.'
              : erro
                ? 'Não conseguimos conferir a versão'
                : 'Conferindo a versão da proposta'}
          </strong>
          <p>
            {erro ??
              (remota
                ? 'Sua edição está preservada. Confira o que mudou antes de salvar.'
                : 'Os campos desta aba continuam como você deixou.')}
          </p>
          {erro?.startsWith('Entre novamente') && (
            <a href="/entrar" target="_blank" rel="noreferrer">
              Entrar em outra aba
            </a>
          )}
        </div>
        {remota ? (
          <button
            ref={gatilho}
            type="button"
            onClick={(evento) => {
              evento.currentTarget.focus();
              edicao.abrir();
            }}
            disabled={salvando}
          >
            Revisar alteração
          </button>
        ) : erro ? (
          <button type="button" onClick={edicao.tentar} disabled={consultando}>
            Tentar novamente
          </button>
        ) : (
          <Spinner size="sm" />
        )}
      </section>
      <ModalOperacao
        open={edicao.aberto && Boolean(remota)}
        onClose={fechar}
        title="Revisar alteração"
        size="lg"
        blocked={salvando}
        description="Confira as diferenças e escolha qual conteúdo manter."
        footer={
          <div className={styles.acoes}>
            <button type="button" onClick={fechar} disabled={salvando} data-autofocus>
              Voltar à edição
            </button>
            <button type="button" onClick={edicao.usarSalva} disabled={salvando}>
              Usar versão salva
            </button>
            {remota && diferencas.length > 0 && (
              <form action={salvar}>
                <input type="hidden" name="id" value={remota.id} />
                <input type="hidden" name="versao" value={remota.versao} />
                <input type="hidden" name="titulo" value={local.titulo} />
                <input type="hidden" name="documento" value={JSON.stringify(local.documento)} />
                <button type="submit" data-primary disabled={salvando || semAcesso}>
                  {salvando ? 'Salvando…' : 'Salvar minha edição'}
                </button>
              </form>
            )}
          </div>
        }
      >
        {remota && (
          <>
            <div className={styles.resumo}>
              <span>Versão salva {remota.versao}</span>
              <span>{ROTULO_STATUS_PROPOSTA[remota.status]}</span>
            </div>
            {edicao.mudouNovamente && (
              <p className={styles.retorno} role="alert">
                A proposta mudou novamente. Confira a comparação atualizada antes de salvar.
              </p>
            )}
            {erro && (
              <p className={styles.retorno} role="alert">
                {erro}
              </p>
            )}
            {diferencas.length === 0 ? (
              <p>O conteúdo é igual. Use a versão salva para atualizar esta aba.</p>
            ) : (
              <>
                <p className={styles.orientacao}>
                  Usar a versão salva substitui os campos desta aba. Salvar sua edição substitui o
                  conteúdo salvo
                  {['aceita', 'apresentada', 'recusada'].includes(remota.status)
                    ? ' e pode reabrir a proposta como rascunho'
                    : ''}
                  .
                </p>
                <div className={styles.diferencas}>
                  {diferencas.map((item, indice) => (
                    <details key={item.rotulo} open={indice === 0}>
                      <summary>
                        {item.rotulo}
                        <ChevronDown size={17} aria-hidden="true" />
                      </summary>
                      <div className={styles.comparacao}>
                        <div>
                          <h3>Sua edição</h3>
                          <p>{item.local || 'Não preenchido'}</p>
                        </div>
                        <div>
                          <h3>Versão salva</h3>
                          <p>{item.salva || 'Não preenchido'}</p>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </ModalOperacao>
    </>
  );
}
