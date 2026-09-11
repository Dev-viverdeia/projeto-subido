'use client';
import { DecisaoCliente } from '@/app/proposta/[codigo]/DecisaoCliente';
import type { EstadoDecisaoProposta } from '@/lib/propostas/portal-actions';

/** Simulação local: nenhuma decisão, cobrança ou notificação sai deste componente. */
export function DecisaoPreview({
  erro,
  valorCentavos,
  pagamento,
}: {
  erro: boolean;
  valorCentavos: number | null;
  pagamento: boolean;
}) {
  async function responder(
    _estado: EstadoDecisaoProposta,
    dados: FormData,
  ): Promise<EstadoDecisaoProposta> {
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (dados.get('decisao') === 'aceita' && dados.get('aceiteTermos') !== 'sim') {
      return { erro: 'Confirme que leu e concorda com esta versão antes de aprovar.' };
    }
    if (erro) return { erro: 'Não foi possível registrar sua decisão agora. Tente novamente.' };
    const status = dados.get('decisao') === 'aceita' ? 'aceita' : 'recusada';
    return { status, sucesso: 'Simulação concluída. Nenhum dado foi enviado.' };
  }
  return (
    <DecisaoCliente
      codigo="00000000-0000-4000-8000-000000000000"
      nomeInicial="Camila Rios"
      emailInicial="camila@example.com"
      linkPagamento={pagamento ? 'https://example.com/pagamento' : null}
      valorCentavos={valorCentavos}
      submitAction={responder}
    />
  );
}
