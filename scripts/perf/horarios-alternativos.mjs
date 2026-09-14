import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export async function verificarHorariosAlternativos({ sql }) {
  await sql(
    await readFile(
      new URL(
        '../../supabase/migrations/20260914220000_horarios_alternativos.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const dono = randomUUID(),
    outro = randomUUID(),
    lotado = randomUUID(),
    propria = randomUUID();
  await sql(`insert into calls_reunioes(id,dono,titulo,status,agendada_para,duracao_minutos) values
    ('${propria}','${dono}','Existente','agendada','2099-10-12 09:00Z',60),
    (gen_random_uuid(),'${dono}','Em andamento','ao_vivo','2099-10-12 10:30Z',30),
    (gen_random_uuid(),'${dono}','Cancelada','cancelada','2099-10-12 11:00Z',240),
    (gen_random_uuid(),'${dono}','Concluída','concluida','2099-10-12 11:00Z',240),
    (gen_random_uuid(),'${dono}','Processando','processando','2099-10-12 11:00Z',240),
    (gen_random_uuid(),'${outro}','Outra conta','agendada','2099-10-12 11:00Z',240);
    insert into calls_reunioes(dono,titulo,status,agendada_para,duracao_minutos)
    select '${lotado}','Ocupado','aguardando',(('2099-10-12'::date+d.n)::timestamp at time zone 'UTC') + make_interval(hours=>h.n), least(240,(18-h.n)*60)
    from generate_series(0,6) d(n) cross join unnest(array[9,13,17]) h(n)
    where extract(isodow from '2099-10-12'::date+d.n) between 1 and 5;`);
  const consultar = async (inicio, duracao = 60, fuso = 'UTC', ignorar = null, usuario = dono) => {
    const resposta =
      await sql(`set role authenticated; select set_config('request.jwt.claim.sub','${usuario}',false);
      select coalesce(jsonb_agg(inicio order by inicio),'[]') from calls_sugerir_horarios('${inicio}',${duracao},'${fuso}',${ignorar ? `'${ignorar}'` : 'null'});`);
    return JSON.parse(resposta.split('\n').at(-1)).map((valor) => new Date(valor).toISOString());
  };
  assert.deepEqual(await consultar('2099-10-12 09:00Z'), [
    '2099-10-12T11:00:00.000Z',
    '2099-10-12T11:30:00.000Z',
    '2099-10-12T12:00:00.000Z',
  ]);
  assert.equal(
    (await consultar('2099-10-12 08:30Z', 30, 'UTC', propria))[0],
    '2099-10-12T09:00:00.000Z',
  );
  assert.equal(
    (await consultar('2099-10-12 09:00Z', 30, 'UTC', null, outro))[0],
    '2099-10-12T09:30:00.000Z',
  );
  assert.equal((await consultar('2099-10-09 17:45Z', 45))[0], '2099-10-12T11:00:00.000Z');
  assert.equal((await consultar('2099-10-12 13:59Z', 240))[0], '2099-10-12T14:00:00.000Z');
  assert.equal((await consultar('2099-10-12 14:01Z', 240))[0], '2099-10-13T09:00:00.000Z');
  assert.equal(
    (await consultar('2099-10-12 08:45+05:45', 45, 'Asia/Kathmandu'))[0],
    '2099-10-12T03:15:00.000Z',
  );
  assert.equal(
    (await consultar('2099-03-06 17:45-05', 45, 'America/New_York'))[0],
    '2099-03-09T13:00:00.000Z',
  );
  assert.deepEqual(await consultar('2099-10-12 09:00Z', 60, 'UTC', null, lotado), []);
  for (const duracao of [0, 241, 'null'])
    await assert.rejects(() => consultar('2099-10-12 09:00Z', duracao));
  await assert.rejects(() => consultar('infinity'));
  await assert.rejects(() => consultar('2099-10-12 09:00Z', 45, 'invalido'));
  await assert.rejects(() => consultar('2099-10-12 09:00Z', 45, 'UTC', null, ''));
  assert.equal(
    await sql(
      "select has_function_privilege('anon','public.calls_sugerir_horarios(timestamptz,integer,text,uuid)','execute');",
    ),
    'f',
  );
  console.log(
    'Alternativas: duração inteira, limites, fim de semana, fuso fracionado, DST, RLS, exclusão própria e agenda cheia aprovados.',
  );
}
