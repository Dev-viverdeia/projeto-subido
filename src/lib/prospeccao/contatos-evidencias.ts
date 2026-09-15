import { emailDe, telefoneDe, VERSAO_COLETA_TELEFONES } from './contatos';
import { redesDeUrls } from './redes-sociais';

export function registroContato(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === 'object' && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

export function textosContato(valor: unknown): string[] {
  return Array.isArray(valor)
    ? valor.filter((item): item is string => typeof item === 'string')
    : [];
}

export function telefoneLegadoSemEvidencia(valor: string, dados: unknown) {
  const raiz = registroContato(dados);
  const site = registroContato(raiz.site_contatos);
  const mapa = registroContato(raiz.mapa_contatos);
  const numero = telefoneDe(valor)?.numero;
  const contem = (lista: unknown) =>
    textosContato(lista).some((item) => telefoneDe(item)?.numero === numero);
  return Boolean(
    numero &&
    site.versao_telefones !== VERSAO_COLETA_TELEFONES &&
    contem(site.telefones) &&
    !contem(mapa.telefones),
  );
}

export function origensDoContato(
  dados: unknown,
  tipo: 'telefone' | 'email' | 'rede',
  valor: string,
) {
  const chave = (item: string) =>
    tipo === 'telefone'
      ? telefoneDe(item)?.numero
      : tipo === 'email'
        ? emailDe(item)
        : redesDeUrls([item])[0]?.url;
  const corresponde = (origem: unknown) => {
    const fonte = registroContato(origem);
    const campo =
      tipo === 'telefone' ? fonte.telefones : tipo === 'email' ? fonte.emails : fonte.redes_sociais;
    return (
      Array.isArray(campo) &&
      campo.some((item) => {
        const texto = typeof item === 'string' ? item : registroContato(item).url;
        return typeof texto === 'string' && Boolean(chave(texto)) && chave(texto) === chave(valor);
      })
    );
  };
  const raiz = registroContato(dados);
  return [
    ...(corresponde(raiz.site_contatos) ? ['Site da empresa'] : []),
    ...(corresponde(raiz.mapa_contatos) ? ['Google Maps'] : []),
  ];
}
