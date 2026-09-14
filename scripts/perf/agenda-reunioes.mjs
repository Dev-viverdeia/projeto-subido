import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

/** Dados sintéticos no PostgreSQL descartável do gate; nunca na conta de um cliente. */
export async function verificarAgendaReunioes({ sql }) {
  const dono = randomUUID();
  const outro = randomUUID();
  const empresa = randomUUID();
  const contato = randomUUID();
  const oportunidade = randomUUID();
  await sql(`
    alter table crm_empresas add column nome text;
    alter table crm_contatos add column nome text;
    alter table crm_oportunidades add column titulo text;
    alter table crm_empresas enable row level security;
    alter table crm_contatos enable row level security;
    alter table crm_oportunidades enable row level security;
    create policy agenda_empresa on crm_empresas for select to authenticated using(dono=(select auth.uid()));
    create policy agenda_contato on crm_contatos for select to authenticated using(dono=(select auth.uid()));
    create policy agenda_oportunidade on crm_oportunidades for select to authenticated using(dono=(select auth.uid()));
    create type calls_tipo as enum('descoberta','follow_up','proposta','kickoff','entrega','outro');
    create type calls_status as enum('agendada','aguardando','ao_vivo','processando','concluida','cancelada');
    create table calls_reunioes(id uuid primary key default gen_random_uuid(), dono uuid, empresa_id uuid, contato_id uuid, oportunidade_id uuid, titulo text, tipo calls_tipo default 'descoberta', status calls_status default 'concluida', agendada_para timestamptz, duracao_minutos smallint default 45, codigo_publico uuid default gen_random_uuid(), live_coach_ativo boolean default false, convidado_email text, google_sync_status text default 'sincronizado', google_event_url text, google_sync_erro text, criada_em timestamptz default now(), atualizada_em timestamptz default now());
    alter table calls_reunioes enable row level security;
    create policy agenda_reuniao on calls_reunioes for select to authenticated using(dono=(select auth.uid()));
    grant usage on schema public,auth to authenticated;
    grant select on calls_reunioes,crm_empresas,crm_contatos,crm_oportunidades to authenticated;
    insert into crm_empresas(id,dono,nome) values('${empresa}','${dono}','Clínica 50% _ Centro');
    insert into crm_contatos(id,dono,empresa_id,nome) values('${contato}','${dono}','${empresa}','Camila');
    insert into crm_oportunidades(id,dono,empresa_id,titulo) values('${oportunidade}','${dono}','${empresa}','Projeto arquivado');
    insert into calls_reunioes(dono,empresa_id,contato_id,oportunidade_id,titulo,agendada_para)
      select '${dono}','${empresa}','${contato}','${oportunidade}','Revisão '||n, '2026-09-01 15:00:00.123456Z'::timestamptz from generate_series(1,260) n;
    insert into calls_reunioes(dono,empresa_id,contato_id,oportunidade_id,titulo,status,agendada_para,duracao_minutos) values
      ('${dono}','${empresa}','${contato}','${oportunidade}','Próxima','agendada','2026-09-15 15:00Z',45),
      ('${dono}','${empresa}','${contato}','${oportunidade}','Na margem exata','agendada','2026-09-14 13:15Z',45),
      ('${dono}','${empresa}','${contato}','${oportunidade}','Vencida','agendada','2026-09-14 13:14:59.999999Z',45),
      ('${outro}','${empresa}',null,'${oportunidade}','Privada','agendada','2026-09-15 15:00Z',45);
  `);
  await sql(
    await readFile(
      new URL(
        '../../supabase/migrations/20260914181328_agenda_reunioes_paginada.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  async function consultar(visao, busca = '', cursor, usuario = dono) {
    const resultado =
      await sql(`set role authenticated; select set_config('request.jwt.claim.sub','${usuario}',false);
      select coalesce(jsonb_agg(r),'[]') from calls_listar_agenda('${visao}','${busca}',${cursor ? `'${cursor.agendada_para}'` : 'null'},${cursor ? `'${cursor.id}'` : 'null'},'2026-09-14 15:00Z') r;`);
    return JSON.parse(resultado.split('\n').at(-1));
  }
  assert.deepEqual(
    (await consultar('proximas')).map((r) => r.titulo),
    ['Na margem exata', 'Próxima'],
  );
  assert.deepEqual(
    (await consultar('pendentes')).map((r) => r.titulo),
    ['Vencida'],
  );
  assert.equal((await consultar('historico', 'Camila')).length, 13);
  assert.equal((await consultar('historico', '50% _')).length, 13);
  assert.equal((await consultar('historico', '50% x')).length, 0);
  assert.equal((await consultar('historico', 'Projeto arquivado')).length, 13);
  assert.equal((await consultar('historico', '', undefined, outro)).length, 0);
  assert.equal((await consultar('invalida')).length, 0);
  const ids = [];
  let cursor;
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    const pagina = await consultar('historico', '', cursor);
    ids.push(...pagina.slice(0, 12).map((r) => r.id));
    if (pagina.length <= 12) break;
    cursor = pagina[11];
  }
  assert.equal(ids.length, 260);
  assert.equal(new Set(ids).size, 260);
  const permissao = await sql(
    "select has_function_privilege('anon','public.calls_listar_agenda(text,text,timestamptz,uuid,timestamptz)','execute');",
  );
  assert.equal(permissao, 'f');
  console.log(
    'Agenda: 260 registros empatados, páginas sem repetição, próximas visíveis, margem exata, busca literal e isolamento verificados.',
  );
}
