'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CircleAlert, LoaderCircle, RefreshCw } from 'lucide-react';
import { sessaoCheckoutValida, type EstadoCheckout } from '@/lib/billing/checkout';
import styles from './RetornoCheckout.module.css';

export function RetornoCheckout({
  retorno,
  sessao,
  tipo,
}: {
  retorno?: string;
  sessao?: string;
  tipo: 'assinatura' | 'creditos';
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoCheckout | 'consultando' | 'demorando'>('consultando');
  const [tentativa, setTentativa] = useState(0);
  const podeConsultar = retorno === 'sucesso' && sessaoCheckoutValida(sessao);

  useEffect(() => {
    if (!podeConsultar) return;
    let ativo = true;
    let timer: ReturnType<typeof setTimeout>;
    let timeout: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    const inicio = Date.now();
    async function consultar() {
      controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch(
          `/api/billing/checkout?session_id=${encodeURIComponent(sessao!)}`,
          { cache: 'no-store', signal: controller.signal },
        );
        const json: unknown = await response.json();
        const estados: EstadoCheckout[] = [
          'confirmado',
          'atualizando',
          'pendente',
          'expirado',
          'falhou',
          'reembolsado',
          'indisponivel',
          'nao_encontrado',
        ];
        if (
          !json ||
          typeof json !== 'object' ||
          !('estado' in json) ||
          !estados.includes(json.estado as EstadoCheckout)
        )
          throw new Error('resposta_invalida');
        const dado = json as { estado: EstadoCheckout };
        if (!ativo) return;
        if (!response.ok) {
          setEstado(dado.estado === 'nao_encontrado' ? 'nao_encontrado' : 'indisponivel');
          return;
        }
        setEstado(dado.estado);
        if (dado.estado === 'confirmado') {
          router.refresh();
          return;
        }
        if (dado.estado === 'pendente' || dado.estado === 'atualizando') {
          if (Date.now() - inicio >= 55_000) setEstado('demorando');
          else timer = setTimeout(() => void consultar(), 5_000);
        }
      } catch {
        if (ativo) setEstado('indisponivel');
      } finally {
        clearTimeout(timeout);
      }
    }
    void consultar();
    return () => {
      ativo = false;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller?.abort();
    };
  }, [podeConsultar, sessao, tentativa, router]);

  if (!retorno) return null;
  const ativo = podeConsultar && ['consultando', 'pendente', 'atualizando'].includes(estado);
  const confirmado = podeConsultar && estado === 'confirmado';
  const recuperar = podeConsultar && ['indisponivel', 'demorando'].includes(estado);
  const credito = tipo === 'creditos';
  let titulo = 'Não foi possível abrir o pagamento.';
  let detalhe = 'Tente novamente em instantes.';
  if (retorno === 'cancelado') {
    titulo = 'Você voltou do pagamento.';
    detalhe = 'Confira o estado da conta antes de iniciar outra compra.';
  }
  if (retorno === 'sucesso') {
    titulo = 'Não foi possível identificar este pagamento.';
    detalhe =
      'Confira sua conta. Se houve uma cobrança, não refaça a compra antes de falar com o suporte.';
    if (ativo) {
      titulo =
        estado === 'atualizando'
          ? credito
            ? 'Atualizando seus créditos.'
            : 'Atualizando seu acesso.'
          : 'Conferindo o pagamento.';
      detalhe = 'Você pode continuar usando a plataforma enquanto confirmamos.';
    } else if (confirmado) {
      titulo = credito ? 'Créditos adicionados.' : 'Assinatura confirmada.';
      detalhe = credito ? 'Seu saldo já foi atualizado.' : 'Seu acesso já foi atualizado.';
    } else if (recuperar) {
      titulo =
        estado === 'demorando'
          ? 'A confirmação ainda não chegou.'
          : 'Não conseguimos conferir agora.';
      detalhe = 'Não refaça a compra. Verifique novamente ou fale com o suporte.';
    } else if (podeConsultar && ['falhou', 'expirado'].includes(estado)) {
      titulo = estado === 'expirado' ? 'Este pagamento foi encerrado.' : 'Pagamento não concluído.';
      detalhe = 'Confira a cobrança antes de tentar novamente.';
    } else if (podeConsultar && estado === 'reembolsado') {
      titulo = 'Reembolso registrado.';
      detalhe = 'Consulte os detalhes no portal de cobrança.';
    }
  }
  return (
    <section
      className={styles.retorno}
      data-estado={confirmado ? 'confirmado' : ativo ? 'consultando' : 'atencao'}
      aria-label="Estado do pagamento"
    >
      <span className={styles.icone} aria-hidden="true">
        {ativo ? (
          <LoaderCircle className={styles.girando} size={22} />
        ) : confirmado ? (
          <Check size={22} />
        ) : (
          <CircleAlert size={22} />
        )}
      </span>
      <div role="status" aria-live="polite">
        <strong>{titulo}</strong>
        <p>{detalhe}</p>
      </div>
      {recuperar ? (
        <button
          type="button"
          onClick={() => {
            setEstado('consultando');
            setTentativa((valor) => valor + 1);
          }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Verificar novamente
        </button>
      ) : null}
      {!ativo && !confirmado && retorno === 'sucesso' ? (
        <a href="mailto:suporte@viverdeia.ai?subject=Pagamento%20Subido">Falar com suporte</a>
      ) : null}
    </section>
  );
}
