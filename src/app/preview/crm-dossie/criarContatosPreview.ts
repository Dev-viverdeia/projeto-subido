import type { DossieLead } from '@/lib/crm/queries';
import { montarContatosFicha } from '@/lib/crm/contatos-ficha';

export function criarContatosPreview(lead: DossieLead, cenario: string) {
  if (cenario === 'vazio')
    return {
      ...lead,
      contato: null,
      empresa: { ...lead.empresa, dominio: null },
      contatos: { canais: [], pessoas: [], telefonesOcultos: false },
    };
  const contato = {
    ...lead.contato!,
    telefone: '(48) 3028-9989',
    email:
      cenario === 'longo'
        ? 'diretoria.relacionamento.e.projetos@empresa-com-nome-bastante-longo.com.br'
        : lead.contato!.email,
  };
  const atual = { ...lead, contato };
  return {
    ...atual,
    contatos: montarContatosFicha(atual, lead.enriquecimentos[0]?.dossie, {
      telefone: '4830289989',
      telefones: ['+554830289989', '1847894818', '(48) 99888-7777'],
      emails: [contato.email, 'atendimento@clinicaaurora.com.br'],
      site_url: 'https://clinicaaurora.com.br/contato',
      maps_url: 'https://maps.google.com/?cid=1',
      redes_sociais: [{ rede: 'instagram', url: 'https://instagram.com/clinicaaurora' }],
      dados: {
        mapa_contatos: { telefones: ['4830289989'] },
        site_contatos: { telefones: ['1847894818'], emails: ['atendimento@clinicaaurora.com.br'] },
      },
    }),
  };
}
