// Formato não comprova titularidade, linha ativa ou disponibilidade no WhatsApp.
// Plano de numeração: gov.br/anatel/pt-br/regulado/numeracao/plano-de-numeracao-brasileiro
export const VERSAO_COLETA_TELEFONES = 2;

const DDDS = new Set(
  '11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(
    ' ',
  ),
);

export function telefoneDe(valor: unknown) {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  if (!texto || texto.length > 80 || !/^\+?[\d ().\t-]+$/.test(texto)) return null;
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(texto)) return null;
  let nacional = texto.replace(/\D/g, '');
  if (!nacional || /^(\d)\1+$/.test(nacional)) return null;
  const internacional = texto.startsWith('+');
  if (!internacional && /^0[3589]00\d{7}$/.test(nacional)) {
    return {
      numero: nacional,
      exibicao: `${nacional.slice(0, 4)} ${nacional.slice(4, 7)} ${nacional.slice(7)}`,
      tel: `tel:${nacional}`,
      whatsapp: null,
    };
  }
  if (!internacional && /^(300[34]|400[34])\d{4}$/.test(nacional)) {
    return {
      numero: nacional,
      exibicao: `${nacional.slice(0, 4)}-${nacional.slice(4)}`,
      tel: `tel:${nacional}`,
      whatsapp: null,
    };
  }
  if (internacional && !nacional.startsWith('55')) {
    if (!/^[1-9]\d{7,14}$/.test(nacional)) return null;
    return {
      numero: nacional,
      exibicao: texto,
      tel: `tel:+${nacional}`,
      whatsapp: `https://wa.me/${nacional}`,
    };
  }
  // 55 com 10/11 dígitos é DDD, não o código do país.
  if (
    (internacional || nacional.length === 12 || nacional.length === 13) &&
    nacional.startsWith('55')
  )
    nacional = nacional.slice(2);
  else if (!internacional && nacional.startsWith('0') && [11, 12].includes(nacional.length))
    nacional = nacional.slice(1);
  const ddd = nacional.slice(0, 2);
  const assinante = nacional.slice(2);
  if (!DDDS.has(ddd) || !/^(?:[2-5]\d{7}|9\d{8})$/.test(assinante)) return null;
  const numero = `55${nacional}`;
  return {
    numero,
    exibicao: `(${ddd}) ${assinante.slice(0, -4)}-${assinante.slice(-4)}`,
    tel: `tel:+${numero}`,
    whatsapp: `https://wa.me/${numero}`,
  };
}

export function telefonesSemDuplicatas(valores: unknown[]): string[] {
  const vistos = new Set<string>();
  return valores.flatMap((valor) => {
    const telefone = telefoneDe(valor);
    if (!telefone || vistos.has(telefone.numero) || typeof valor !== 'string') return [];
    vistos.add(telefone.numero);
    return [valor.trim()];
  });
}

export function emailDe(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const email = valor.trim().toLowerCase();
  if (
    email.length > 254 ||
    !/^[a-z0-9!#$%&'*+/=^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=^_`{|}~-]+)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(
      email,
    )
  )
    return null;
  return email;
}

export function emailsSemDuplicatas(valores: unknown[]): string[] {
  return [...new Set(valores.map(emailDe).filter((email): email is string => email !== null))];
}
