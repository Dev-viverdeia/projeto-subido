import { emailDe, telefoneDe } from '@/lib/prospeccao/contatos';
import {
  origensDoContato,
  registroContato,
  telefoneLegadoSemEvidencia,
  textosContato,
} from '@/lib/prospeccao/contatos-evidencias';
import { redesDeUrls } from '@/lib/prospeccao/redes-sociais';
import type { DossieLead } from './dossie-types';
import type { DossieEnriquecido } from './enriquecimento';

type TipoCanal = NonNullable<DossieEnriquecido['inteligenciaContato']>['canais'][number]['tipo'];
export type CanalFicha = {
  tipo: TipoCanal;
  valor: string;
  href: string;
  whatsapp: string | null;
  pessoa?: string;
  fontes: { nome: string; url: string | null }[];
};
export type PessoaFicha = {
  nome: string;
  cargo: string | null;
  origem: string;
  linkedin: string | null;
};
export type ContatosFicha = {
  canais: CanalFicha[];
  pessoas: PessoaFicha[];
  telefonesOcultos: boolean;
};

export function urlContatoPublica(valor: unknown): string | null {
  if (
    typeof valor !== 'string' ||
    !valor.trim() ||
    /\s/.test(valor.trim()) ||
    [...valor].some((char) => char.charCodeAt(0) < 32)
  )
    return null;
  const texto = valor.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(texto) && !/^https?:\/\//i.test(texto)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      !url.hostname.includes('.')
    )
      return null;
    return url.toString();
  } catch {
    return null;
  }
}

function perfil(valor: unknown) {
  const url = urlContatoPublica(valor);
  return url ? redesDeUrls([url])[0] : undefined;
}

function nomePessoa(valor: unknown) {
  if (typeof valor !== 'string') return null;
  const nome = valor.trim();
  return nome && !/^contato (?:a |n[aã]o |principal$)/i.test(nome) ? nome : null;
}

/** Somente apresentação. Nenhum número é marcado como validado por pertencer ao cadastro. */
export function montarContatosFicha(
  lead: Pick<DossieLead, 'contato' | 'empresa'>,
  dossie: DossieEnriquecido | null = null,
  origem: unknown = null,
): ContatosFicha {
  const fonte = registroContato(origem);
  const dados = fonte.dados ?? fonte.dados_publicos;
  const canais = new Map<string, CanalFicha>();
  const pessoas = new Map<string, PessoaFicha>();
  const pessoasImportadas = (
    Array.isArray(fonte.decisores)
      ? fonte.decisores
      : (dossie?.inteligenciaContato?.pessoas ?? []).filter((item) => item.status !== 'confirmada')
  ).map(registroContato);
  let telefonesOcultos = false;
  const doImportado = (tipo: TipoCanal, valor: string) => {
    if (tipo === 'telefone')
      return [
        fonte.telefone,
        ...textosContato(fonte.telefones),
        ...pessoasImportadas.map((item) => item.telefone),
      ].some((item) => telefoneDe(item)?.numero === telefoneDe(valor)?.numero);
    if (tipo === 'email')
      return [...textosContato(fonte.emails), ...pessoasImportadas.map((item) => item.email)].some(
        (item) => emailDe(item) === emailDe(valor),
      );
    return false;
  };
  const adicionar = (
    tipo: TipoCanal,
    valor: unknown,
    url: unknown,
    origemCanal: 'crm' | 'prospeccao',
    pessoaDoCanal?: string,
  ) => {
    if (typeof valor !== 'string' || !valor.trim()) return;
    let canal: Pick<CanalFicha, 'valor' | 'href' | 'whatsapp'>;
    let chave: string;
    if (tipo === 'telefone') {
      const telefone = telefoneDe(valor);
      if (!telefone) return;
      if (
        !(origemCanal === 'crm' && lead.contato?.telefoneManual) &&
        telefoneLegadoSemEvidencia(valor, dados)
      ) {
        telefonesOcultos = true;
        return;
      }
      canal = { valor: telefone.exibicao, href: telefone.tel, whatsapp: telefone.whatsapp };
      chave = `telefone:${telefone.numero}`;
    } else if (tipo === 'email') {
      const email = emailDe(valor);
      if (!email) return;
      canal = { valor: email, href: `mailto:${encodeURIComponent(email)}`, whatsapp: null };
      chave = `email:${email}`;
    } else {
      const href = urlContatoPublica(url ?? valor);
      if (!href) return;
      const rede = tipo !== 'site' ? perfil(href) : null;
      if (tipo !== 'site' && rede?.rede !== tipo) return;
      const destino = rede?.url ?? href;
      const caminho = new URL(destino);
      canal = {
        valor:
          tipo === 'site'
            ? caminho.hostname.replace(/^www\./, '')
            : `@${caminho.pathname.split('/').filter(Boolean).at(-1)?.replace(/^@/, '') ?? tipo}`,
        href: destino,
        whatsapp: null,
      };
      chave = `${tipo}:${tipo === 'site' ? caminho.hostname.replace(/^www\./, '').toLowerCase() : destino.replace('://www.', '://').replace('http:', 'https:')}`;
    }
    const fontes =
      tipo === 'site'
        ? []
        : origensDoContato(
            dados,
            tipo === 'telefone' || tipo === 'email' ? tipo : 'rede',
            canal.href.startsWith('http') ? canal.href : valor,
          );
    const nomes =
      origemCanal === 'crm' && tipo === 'telefone' && lead.contato?.telefoneManual
        ? ['Cadastrado na ficha']
        : fontes.length
          ? fontes
          : [
              origemCanal === 'prospeccao' || doImportado(tipo, valor)
                ? 'Prospecção · fonte não informada'
                : 'Cadastrado na ficha',
            ];
    const fontesDoCanal = nomes.map((nome) => ({
      nome,
      url:
        nome === 'Site da empresa'
          ? urlContatoPublica(fonte.site_url ?? lead.empresa.dominio)
          : nome === 'Google Maps'
            ? urlContatoPublica(fonte.maps_url)
            : null,
    }));
    const existente = canais.get(chave);
    if (existente) {
      for (const item of fontesDoCanal)
        if (!existente.fontes.some((atual) => atual.nome === item.nome))
          existente.fontes.push(item);
      // Evidência do campo substitui a atribuição vaga do snapshot, nunca o contrário.
      if (existente.fontes.some((item) => item.url))
        existente.fontes = existente.fontes.filter(
          (item) => item.nome !== 'Prospecção · fonte não informada',
        );
      return;
    }
    canais.set(chave, {
      tipo,
      ...canal,
      fontes: fontesDoCanal,
      ...(pessoaDoCanal ? { pessoa: pessoaDoCanal } : {}),
    });
  };
  const pessoa = (valor: unknown, cadastrado: boolean) => {
    const item = registroContato(valor);
    const nome = nomePessoa(item.nome);
    if (!nome || pessoas.has(nome.toLocaleLowerCase('pt-BR'))) return;
    const rede = perfil(item.linkedinUrl ?? item.linkedin_url);
    pessoas.set(nome.toLocaleLowerCase('pt-BR'), {
      nome,
      cargo: typeof item.cargo === 'string' ? item.cargo.trim() || null : null,
      origem: cadastrado ? 'Contato da ficha' : 'Vínculo a confirmar',
      linkedin: rede?.rede === 'linkedin' ? rede.url : null,
    });
  };

  if (lead.contato) {
    pessoa(lead.contato, true);
    const nome = nomePessoa(lead.contato.nome) ?? undefined;
    adicionar('telefone', lead.contato.telefone, null, 'crm', nome);
    adicionar('email', lead.contato.email, null, 'crm', nome);
  }
  for (const valor of [fonte.telefone, ...textosContato(fonte.telefones)])
    adicionar('telefone', valor, null, 'prospeccao');
  for (const valor of textosContato(fonte.emails)) adicionar('email', valor, null, 'prospeccao');
  const redes = Array.isArray(fonte.redes_sociais) ? fonte.redes_sociais : [];
  for (const item of redes) {
    const rede = perfil(registroContato(item).url);
    if (rede) adicionar(rede.rede, rede.url, rede.url, 'prospeccao');
  }
  for (const item of pessoasImportadas) {
    const nome = nomePessoa(item.nome);
    if (!nome) continue;
    pessoa(item, false);
    adicionar('telefone', item.telefone, null, 'prospeccao', nome);
    adicionar('email', item.email, null, 'prospeccao', nome);
  }
  for (const item of dossie?.inteligenciaContato?.canais ?? []) {
    // O snapshot do enriquecimento não substitui um contato que o usuário alterou depois.
    if (item.origem === 'crm' && ['telefone', 'email', 'site'].includes(item.tipo)) continue;
    if (item.tipo === 'site' && (lead.empresa.dominio || fonte.site_url)) continue;
    if (
      item.origem === 'prospeccao' &&
      ('telefones' in fonte || 'emails' in fonte) &&
      ['telefone', 'email'].includes(item.tipo) &&
      !doImportado(item.tipo, item.valor)
    )
      continue;
    adicionar(item.tipo, item.valor, item.url, item.origem);
  }
  adicionar(
    'site',
    lead.empresa.dominio ?? fonte.site_url,
    null,
    lead.empresa.dominio ? 'crm' : 'prospeccao',
  );
  return { canais: [...canais.values()], pessoas: [...pessoas.values()], telefonesOcultos };
}
