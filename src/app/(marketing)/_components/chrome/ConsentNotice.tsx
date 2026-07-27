'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import styles from './ConsentNotice.module.css';

type Escolha = 'aceito' | 'essenciais';
const CHAVE = 'subido_consent_v1';

/**
 * Aviso de consentimento (LGPD).
 *
 * NEGADO POR PADRÃO. O script de Consent Mode v2 (ver o layout) declara
 * `ad_storage`, `analytics_storage`, `ad_user_data` e `ad_personalization` como
 * `denied` ANTES de qualquer tag carregar. Este componente só faz o `update`.
 *
 * TRADE-OFF QUE PRECISA SER DECISÃO, NÃO DESCOBERTA:
 * negar por padrão reduz as conversões MEDIDAS enquanto o modeling do Consent Mode
 * não estiver ligado no Google Ads. Isso é escolha de negócio — mas é melhor decidir
 * agora do que perceber num painel três semanas depois do lançamento.
 *
 * Fica no canto inferior ESQUERDO: o direito é a zona do polegar no mobile, e no
 * futuro é onde um dock de CTA moraria. Não é modal, não bloqueia e não causa shift
 * (é `fixed`, fora do fluxo).
 */
/**
 * `useSyncExternalStore` e não `useEffect` + `setState`.
 *
 * O localStorage é um store EXTERNO ao React, e ler dele num effect para depois
 * chamar setState dispara render em cascata (o lint de hooks reclama com razão).
 * Este hook existe exatamente para isso, e ainda resolve a hidratação: o snapshot do
 * SERVIDOR diz "já decidiu", então nada é renderizado no HTML; o do cliente diz a
 * verdade e o aviso aparece depois — sem mismatch e sem flash de conteúdo.
 */
const semAssinatura = () => () => {};
const decidiuNoCliente = () => {
  try {
    return localStorage.getItem(CHAVE) !== null;
  } catch {
    return true; // aba anônima: não insiste
  }
};
const decidiuNoServidor = () => true;

export function ConsentNotice() {
  const jaDecidiu = useSyncExternalStore(semAssinatura, decidiuNoCliente, decidiuNoServidor);
  const [decidiuAgora, setDecidiuAgora] = useState(false);
  const visivel = !jaDecidiu && !decidiuAgora;

  const decidir = (escolha: Escolha) => {
    try {
      localStorage.setItem(CHAVE, escolha);
    } catch {
      /* ignora */
    }

    const concedido = escolha === 'aceito' ? 'granted' : 'denied';
    // Formato do Consent Mode v2. O payload é plano e de strings, então cabe no
    // tipo do dataLayer sem escape.
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({
      event: 'consent_update',
      ad_storage: concedido,
      analytics_storage: concedido,
      ad_user_data: concedido,
      ad_personalization: concedido,
    });

    setDecidiuAgora(true);
  };

  if (!visivel) return null;

  return (
    <aside className={styles.wrap} role="dialog" aria-label="Preferências de cookies">
      <p className={styles.texto}>
        Usamos cookies para medir campanhas e melhorar a plataforma. Você pode aceitar ou seguir só
        com os essenciais. Detalhes na{' '}
        <Link href="/privacidade" className={styles.link}>
          política de privacidade
        </Link>
        .
      </p>
      <div className={styles.acoes}>
        <button type="button" className={styles.secundario} onClick={() => decidir('essenciais')}>
          Só essenciais
        </button>
        <button type="button" className={styles.primario} onClick={() => decidir('aceito')}>
          Aceitar
        </button>
      </div>
    </aside>
  );
}
