import { sessaoCheckoutValida, type EstadoCheckout } from '@/lib/billing/checkout';
import { obterStripe } from '@/lib/billing/stripe';
import { createClient } from '@/lib/supabase/server';

function resposta(estado: EstadoCheckout, status = 200) {
  return Response.json({ estado }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

/** Apenas consulta. O webhook continua sendo o único caminho de concessão. */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessaoCheckoutValida(sessionId)) return resposta('nao_encontrado', 400);
  const supabase = await createClient();
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser();
  if (erroAuth || !user) return resposta('nao_encontrado', 401);
  const stripe = obterStripe();
  if (!stripe) return resposta('indisponivel', 503);

  try {
    const sessao = await stripe.checkout.sessions.retrieve(
      sessionId,
      {},
      { timeout: 8_000, maxNetworkRetries: 0 },
    );
    // Ambas as referências são gravadas pelo servidor na criação do checkout.
    if (sessao.metadata?.usuario_id !== user.id || sessao.client_reference_id !== user.id)
      return resposta('nao_encontrado', 404);
    if (sessao.status === 'expired') return resposta('expirado');
    if (sessao.status !== 'complete' || sessao.payment_status === 'unpaid')
      return resposta('pendente');

    if (sessao.mode === 'payment') {
      const { data, error } = await supabase
        .from('billing_pedidos_creditos')
        .select('status')
        .eq('usuario_id', user.id)
        .eq('stripe_checkout_session_id', sessionId)
        .maybeSingle();
      if (error) return resposta('indisponivel', 503);
      if (data?.status === 'reembolsado' || data?.status === 'falhou') return resposta(data.status);
      return resposta(data?.status === 'pago' ? 'confirmado' : 'atualizando');
    }
    if (sessao.mode === 'subscription' && sessao.subscription) {
      const subscriptionId =
        typeof sessao.subscription === 'string' ? sessao.subscription : sessao.subscription.id;
      const { data, error } = await supabase
        .from('billing_assinaturas')
        .select('status')
        .eq('usuario_id', user.id)
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();
      if (error) return resposta('indisponivel', 503);
      if (data?.status === 'canceled' || data?.status === 'incomplete_expired')
        return resposta('expirado');
      if (data?.status === 'past_due' || data?.status === 'unpaid' || data?.status === 'paused')
        return resposta('pendente');
      if (data && ['active', 'trialing'].includes(data.status)) {
        // Renova os claims depois da concessão no banco, nunca concede pelo retorno.
        const { error: erroSessao } = await supabase.auth.refreshSession();
        return erroSessao ? resposta('indisponivel', 503) : resposta('confirmado');
      }
      return resposta('atualizando');
    }
    return resposta('nao_encontrado', 404);
  } catch {
    // Não devolver dados do provedor, URLs de pagamento ou identificadores de outra conta.
    return resposta('indisponivel', 503);
  }
}
