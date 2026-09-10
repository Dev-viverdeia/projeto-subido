'use client';

import { AjudaNaFalha } from '@/components/suporte/AjudaNaFalha';

export function RecuperarConversa({
  mensagem,
  tipo,
  threadId,
  verificar,
  pausado,
  confirmando,
  retomar,
  editar,
  responder,
}: {
  mensagem: string;
  tipo?: string;
  threadId?: string;
  verificar: boolean;
  pausado: boolean;
  confirmando: boolean;
  retomar: () => void;
  editar: () => void;
  responder?: () => void;
}) {
  const sessao = tipo === 'sessao';
  return (
    <AjudaNaFalha
      contexto="sobral"
      pagina={threadId ? `/consultor/${threadId}` : '/consultor'}
      aviso={tipo === 'interrompida' ? 'status' : 'alert'}
      titulo={mensagem}
      descricao={
        sessao
          ? 'Abra o login em outra aba e volte aqui. Não precisa reenviar sua pergunta.'
          : verificar
            ? 'Verificar não inicia uma nova geração.'
            : undefined
      }
      acao={
        <>
          {sessao && (
            <a
              href="/entrar"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Entrar na conta (abre em outra aba)"
            >
              Entrar na conta
            </a>
          )}
          {pausado && (
            <>
              <button type="button" onClick={retomar}>
                {confirmando ? 'Confirmar envio' : 'Retomar envio'}
              </button>
              {!confirmando && (
                <button type="button" onClick={editar}>
                  Voltar à edição
                </button>
              )}
            </>
          )}
          {responder && (
            <button type="button" onClick={responder}>
              {verificar
                ? 'Verificar resposta'
                : tipo === 'interrompida'
                  ? 'Gerar novamente'
                  : 'Tentar novamente'}
            </button>
          )}
        </>
      }
    />
  );
}
