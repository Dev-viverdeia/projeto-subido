import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Registro = Record<string, unknown>;

function registro(valor: unknown): Registro {
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? (valor as Registro) : {};
}

function texto(valor: unknown) {
  return typeof valor === 'string' && valor.trim() ? valor.trim() : null;
}

function primeiroEmail(contato: Registro) {
  const provavel = registro(contato.most_probable_work_email);
  const direto = texto(provavel.email);
  if (direto) return direto.toLocaleLowerCase('pt-BR');
  const emails = Array.isArray(contato.work_emails) ? contato.work_emails : [];
  for (const item of emails) {
    const email = texto(registro(item).email);
    if (email) return email.toLocaleLowerCase('pt-BR');
  }
  return null;
}

function primeiroTelefone(contato: Registro) {
  const provavel = registro(contato.most_probable_phone);
  const direto = texto(provavel.number);
  if (direto) return direto;
  const telefones = Array.isArray(contato.phones) ? contato.phones : [];
  for (const item of telefones) {
    const telefone = texto(registro(item).number);
    if (telefone) return telefone;
  }
  return null;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Método não permitido', { status: 405 });

  const segredoEsperado = Deno.env.get('FULLENRICH_WEBHOOK_SECRET');
  const segredoRecebido = new URL(request.url).searchParams.get('segredo');
  if (!segredoEsperado || segredoRecebido !== segredoEsperado) {
    return new Response('Não autorizado', { status: 401 });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const chave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !chave) return new Response('Configuração ausente', { status: 500 });

  const payload = registro(await request.json().catch(() => null));
  const itens = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.datas)
      ? payload.datas
      : [];
  const supabase = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let atualizados = 0;
  let pendentes = 0;

  for (const bruto of itens) {
    const item = registro(bruto);
    const custom = registro(item.custom);
    const dono = texto(custom.dono);
    const lista = texto(custom.lista);
    const chaveExterna = texto(custom.chave);
    if (!dono || !lista || !chaveExterna) continue;

    const { data: lead, error } = await supabase
      .from('prospeccao_leads')
      .select('id, decisores, qualificacao, dados, fontes')
      .eq('dono', dono)
      .eq('lista_id', lista)
      .eq('chave_externa', chaveExterna)
      .maybeSingle();
    if (error) return new Response('Falha ao localizar lead', { status: 500 });
    if (!lead) {
      pendentes += 1;
      continue;
    }

    const contato = registro(item.contact_info ?? registro(item.contact).contact_info);
    const email = primeiroEmail(contato);
    const telefone = primeiroTelefone(contato);
    const decisores = Array.isArray(lead.decisores) ? lead.decisores : [];
    const decisoresAtualizados = decisores.map((decisor, indice) => {
      if (indice !== 0) return decisor;
      const atual = registro(decisor);
      return {
        ...atual,
        email: email ?? atual.email ?? null,
        telefone: telefone ?? atual.telefone ?? null,
      };
    });
    const qualificacao = registro(lead.qualificacao);
    const completudeAtual =
      typeof qualificacao.completude === 'number' ? qualificacao.completude : 0;
    const sinais = Array.isArray(qualificacao.sinais)
      ? qualificacao.sinais.filter((item): item is string => typeof item === 'string')
      : [];
    if ((email || telefone) && !sinais.includes('Contato direto de possível decisor encontrado')) {
      sinais.unshift('Contato direto de possível decisor encontrado');
    }
    const dados = registro(lead.dados);
    const fontes = Array.isArray(lead.fontes)
      ? lead.fontes.filter((item): item is string => typeof item === 'string')
      : [];
    if ((email || telefone) && !fontes.includes('FullEnrich · contato profissional verificado')) {
      fontes.push('FullEnrich · contato profissional verificado');
    }

    const { error: erroAtualizacao } = await supabase
      .from('prospeccao_leads')
      .update({
        decisores: decisoresAtualizados,
        qualificacao: {
          ...qualificacao,
          completude: email || telefone ? Math.min(100, completudeAtual + 8) : completudeAtual,
          sinais: sinais.slice(0, 8),
        },
        fontes,
        dados: {
          ...dados,
          fullenrich_contatos: {
            status: email || telefone ? 'concluido' : 'sem_contato',
            atualizado_em: new Date().toISOString(),
          },
        },
      })
      .eq('id', lead.id)
      .eq('dono', dono);
    if (erroAtualizacao) return new Response('Falha ao atualizar lead', { status: 500 });
    atualizados += 1;
  }

  if (pendentes > 0) {
    return Response.json({ ok: false, atualizados, pendentes }, { status: 503 });
  }
  return Response.json({ ok: true, atualizados });
});
