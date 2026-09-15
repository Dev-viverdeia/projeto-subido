import 'server-only';

import { dominioNormalizado, identidadeDaEmpresa } from './memoria';
import { comoRegistro, emailsValidos, qualificar, telefonesUnicos, textos } from './normalizacao';
import { telefoneDe } from './contatos';
import type { LeadProspeccaoEntrada } from './schema';

function identidadeDeCombinacao(lead: LeadProspeccaoEntrada) {
  const dominio = dominioNormalizado(lead.dominio);
  if (dominio) return `dominio:${dominio}`;
  const telefone = telefoneDe(lead.telefone)?.numero ?? telefoneDe(lead.telefones[0])?.numero;
  if (telefone && telefone.length >= 10) return `telefone:${telefone}`;
  return `empresa:${identidadeDaEmpresa(lead)}`;
}

export function combinar(principal: LeadProspeccaoEntrada[], complemento: LeadProspeccaoEntrada[]) {
  const porChave = new Map<string, LeadProspeccaoEntrada>();
  for (const lead of [...principal, ...complemento]) {
    const identidade = identidadeDeCombinacao(lead);
    const existente = porChave.get(identidade);
    if (!existente) {
      porChave.set(identidade, lead);
      continue;
    }
    const combinado = {
      ...existente,
      categoria: existente.categoria ?? lead.categoria,
      endereco: existente.endereco ?? lead.endereco,
      cidade: existente.cidade ?? lead.cidade,
      estado: existente.estado ?? lead.estado,
      site_url: existente.site_url ?? lead.site_url,
      dominio: existente.dominio ?? lead.dominio,
      telefone: existente.telefone ?? lead.telefone,
      telefones: telefonesUnicos([...existente.telefones, ...lead.telefones]).slice(0, 12),
      emails: emailsValidos([...existente.emails, ...lead.emails]),
      redes_sociais: [...existente.redes_sociais, ...lead.redes_sociais].filter(
        (rede, indice, todas) => todas.findIndex((item) => item.url === rede.url) === indice,
      ),
      decisores: [...existente.decisores, ...lead.decisores].filter(
        (decisor, indice, todos) =>
          todos.findIndex(
            (item) =>
              item.linkedin_url === decisor.linkedin_url ||
              item.nome.toLocaleLowerCase('pt-BR') === decisor.nome.toLocaleLowerCase('pt-BR'),
          ) === indice,
      ),
      horarios: existente.horarios.length ? existente.horarios : lead.horarios,
      maps_url: existente.maps_url ?? lead.maps_url,
      imagem_url: existente.imagem_url ?? lead.imagem_url,
      avaliacao: existente.avaliacao ?? lead.avaliacao,
      total_avaliacoes: existente.total_avaliacoes ?? lead.total_avaliacoes,
      descricao: existente.descricao ?? lead.descricao,
      fontes: [...new Set([...existente.fontes, ...lead.fontes])],
      dados: {
        ...lead.dados,
        ...existente.dados,
        mapa_contatos: {
          telefones: telefonesUnicos([
            ...textos(comoRegistro(existente.dados.mapa_contatos)?.telefones),
            ...textos(comoRegistro(lead.dados.mapa_contatos)?.telefones),
          ]),
        },
      },
    } satisfies LeadProspeccaoEntrada;
    porChave.set(identidade, { ...combinado, qualificacao: qualificar(combinado) });
  }
  return [...porChave.values()];
}
