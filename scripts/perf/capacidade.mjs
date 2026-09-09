/** Só Docker local, sem portas expostas, credenciais ou provedores reais. */
import { execFile as executarCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const executar = promisify(executarCallback);
const raiz = resolve(import.meta.dirname, '../..');
const pasta = await mkdtemp(join(tmpdir(), 'subido-capacidade-'));
const container = `subido-capacidade-${randomUUID().slice(0, 8)}`;
const modo = process.argv.includes('--baseline') ? 'baseline' : 'atual';
const soContratos = process.argv.includes('--contratos');
const apenasOito = process.argv.includes('--conexoes=8');
const relatorio = {
  modo,
  ambiente: 'PostgreSQL 17 local; esquema mínimo; sem provedores externos',
  contratos: {},
  cenarios: {},
};
const docker = (...args) => executar('docker', args, { maxBuffer: 20 * 1024 * 1024 });
async function sql(texto) {
  const arquivo = join(pasta, `${randomUUID()}.sql`);
  await writeFile(arquivo, texto);
  await docker('cp', arquivo, `${container}:/tmp/entrada-${arquivo.split('/').at(-1)}`);
  return (
    await docker(
      'exec',
      container,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-At',
      '-f',
      `/tmp/entrada-${arquivo.split('/').at(-1)}`,
    )
  ).stdout.trim();
}
async function funcao(migracao, nome) {
  const texto = await readFile(join(raiz, 'supabase/migrations', migracao), 'utf8');
  const inicio = texto.search(
    new RegExp(`create (?:or replace )?function ${nome.replaceAll('.', '\\.')}\\s*\\(`, 'i'),
  );
  if (inicio < 0) throw new Error(`Função ausente: ${nome}`);
  const inicioCorpo = texto.indexOf('$$', inicio);
  const fim = texto.indexOf('$$;', inicioCorpo + 2) + 3;
  return texto.slice(inicio, fim);
}
try {
  await docker(
    'run',
    '--detach',
    '--name',
    container,
    '--label',
    'subido.qa=capacidade',
    '--network',
    'none',
    '--memory',
    '1g',
    '--cpus',
    '2',
    '-e',
    'POSTGRES_HOST_AUTH_METHOD=trust',
    'postgres:17-alpine',
  );
  for (let n = 0; n < 30; n++) {
    try {
      await docker('exec', container, 'pg_isready', '-U', 'postgres');
      break;
    } catch {
      if (n === 29) throw new Error('Banco local não iniciou');
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  await sql(await readFile(join(raiz, 'scripts/perf/capacidade-fixture.sql'), 'utf8'));
  const plano = '20260905214500_plano_atual_cobranca_segura.sql';
  const escala = '20260826203000_escala_operacional_limites_alertas.sql';
  for (const [m, n] of [
    ['20260808134507_sobral_ai_direcao_operacional.sql', 'public.registrar_uso_sobral'],
    [plano, 'public.plano_subido_atual'],
    [plano, 'public.crm_iniciar_enriquecimento'],
    [escala, 'private.crm_limitar_enriquecimentos_usuario'],
    ['20260909023544_central_suporte.sql', 'public.suporte_notificacoes_reservar'],
  ])
    await sql(await funcao(m, n));
  await sql(
    await readFile(join(raiz, 'supabase/migrations/20260906211820_sobral_geracoes.sql'), 'utf8'),
  );
  await sql(
    await readFile(
      join(raiz, 'supabase/migrations/20260906013148_enriquecimento_worker_seguro.sql'),
      'utf8',
    ),
  );
  await sql(`create trigger limitar before insert on crm_enriquecimentos for each row execute function private.crm_limitar_enriquecimentos_usuario();
    create trigger estornar after update of status on crm_enriquecimentos for each row when(new.status='falhou') execute function private.crm_estornar_enriquecimento_falho();
    insert into private.crm_worker_credencial values(true,extensions.digest(repeat('x',64),'sha256'));`);
  if (modo === 'atual') {
    await sql(
      await readFile(
        join(raiz, 'supabase/migrations/20260909164615_capacidade_recuperacao.sql'),
        'utf8',
      ),
    );
  }
  // Rajada na mesma conta, em conversas diferentes. Cada cliente usa uma conexão real.
  await sql(`create table perf.perguntas as select n,gen_random_uuid() thread,gen_random_uuid() mensagem,gen_random_uuid() tentativa from generate_series(1,32) n;
    insert into consultor_threads select thread,(select dono from perf.contas where n=0),now() from perf.perguntas;
    insert into consultor_mensagens(id,thread_id,papel,conteudo) select mensagem,thread,'usuario','Teste isolado' from perf.perguntas;`);
  const inicios = await Promise.all(
    Array.from({ length: 32 }, (_, i) =>
      sql(
        `select sobral_iniciar_geracao(c.dono,p.thread,p.mensagem,p.tentativa,false)->>'executar' from perf.perguntas p cross join perf.contas c where p.n=${i + 1} and c.n=0;`,
      ).catch((e) =>
        e.stderr.includes('limite_sobral_simultaneo') ? 'limitado' : Promise.reject(e),
      ),
    ),
  );
  relatorio.contratos.ia = {
    pedidos: 32,
    aceitos: inicios.filter((x) => x === 'true').length,
    limitados: inicios.filter((x) => x === 'limitado').length,
  };
  const finalizacao = `select sobral_finalizar_geracao(c.dono,p.mensagem,p.tentativa,'concluida','{"texto":"Resposta sintética do laboratório.","tokens":100}') from perf.perguntas p cross join perf.contas c where p.n=1 and c.n=0;`;
  // A pergunta 1 pode perder a disputa de admissão. Escolhe qualquer recibo existente.
  const mensagemAceita = await sql(
    'select mensagem_id from sobral_geracoes order by mensagem_id limit 1;',
  );
  const finalizar = finalizacao.replace('p.n=1', `p.mensagem='${mensagemAceita}'::uuid`);
  await Promise.all(Array.from({ length: 32 }, () => sql(finalizar)));
  relatorio.contratos.finalizacao = JSON.parse(
    await sql(
      `select json_build_object('respostas',(select count(*) from consultor_mensagens where papel='consultor'),'tokens',(select sum(tokens) from consultor_uso));`,
    ),
  );
  const retomavel = await sql(
    `select mensagem_id from sobral_geracoes where estado='gerando' order by mensagem_id limit 1;`,
  );
  await sql(
    `update sobral_geracoes set expira_em=now()-interval '1 minute' where mensagem_id='${retomavel}';`,
  );
  const novaTentativa = randomUUID();
  const retomou = await sql(
    `select sobral_iniciar_geracao(c.dono,p.thread,p.mensagem,'${novaTentativa}',true)->>'executar' from perf.perguntas p cross join perf.contas c where p.mensagem='${retomavel}' and c.n=0;`,
  );
  const workerAntigo = await sql(
    `select sobral_finalizar_geracao(c.dono,p.mensagem,p.tentativa,'concluida','{"texto":"Resposta atrasada do laboratório.","tokens":100}') from perf.perguntas p cross join perf.contas c where p.mensagem='${retomavel}' and c.n=0;`,
  )
    .then(() => false)
    .catch((e) => (e.stderr.includes('Tentativa indisponível') ? true : Promise.reject(e)));
  relatorio.contratos.retomadaIA = {
    retomou: retomou === 'true',
    workerAntigoRecusado: workerAntigo,
  };
  await sql(`update sobral_geracoes set estado='interrompida' where estado='gerando';
    create table perf.enriquecer as select n,gen_random_uuid() id from generate_series(1,32)n;
    insert into crm_oportunidades select p.id,c.dono,c.dono,null from perf.enriquecer p cross join perf.contas c where c.n=0;`);
  const enriqs = await Promise.all(
    Array.from({ length: 32 }, (_, i) =>
      sql(
        `select set_config('request.jwt.claim.sub',(select dono::text from perf.contas where n=0),false); select crm_worker_iniciar((select id from perf.enriquecer where n=${i + 1}),repeat('x',64));`,
      )
        .then(() => true)
        .catch((e) =>
          e.stderr.includes('limite_enriquecimentos_simultaneos') ? false : Promise.reject(e),
        ),
    ),
  );
  relatorio.contratos.enriquecimento = { pedidos: 32, aceitos: enriqs.filter(Boolean).length };
  await Promise.all(
    Array.from({ length: 32 }, () =>
      sql(
        `select set_config('request.jwt.claim.sub',(select dono::text from perf.contas where n=0),false); select crm_worker_avancar(id,repeat('x',64),'falhou') from crm_enriquecimentos order by id;`,
      ),
    ),
  );
  relatorio.contratos.estorno = JSON.parse(
    await sql(
      `select json_build_object('saldo',(select saldo from prospeccao_carteiras where dono=(select dono from perf.contas where n=0)),'debitos',(select count(*) from prospeccao_movimentos where tipo='enriquecimento'),'estornos',(select count(*) from prospeccao_movimentos where tipo='estorno_enriquecimento'));`,
    ),
  );
  relatorio.contratos.resultadoAtrasadoRecusado =
    (
      await sql(
        `select set_config('request.jwt.claim.sub',(select dono::text from perf.contas where n=0),false); select bool_and(not crm_worker_avancar(id,repeat('x',64),'concluido','{}')) from crm_enriquecimentos;`,
      )
    )
      .split('\n')
      .at(-1) === 't';
  await sql(
    `insert into suporte_notificacoes(evento,destinatario,tipo,criado_em,atualizado_em) select n::text,'qa@example.test','usuario',now()-interval '2 minutes',now()-interval '2 minutes' from generate_series(1,100)n;`,
  );
  const reservas = await Promise.all(
    Array.from({ length: 16 }, () => sql('select id from suporte_notificacoes_reservar();')),
  );
  const ids = reservas.flatMap((r) => (r ? r.split('\n') : []));
  relatorio.contratos.email = {
    workers: 16,
    reservados: ids.length,
    duplicados: ids.length - new Set(ids).size,
  };
  const recuperarEmail = ids[0];
  await sql(`update suporte_notificacoes set estado='entregue',atualizado_em=now()-interval '6 minutes';
    update suporte_notificacoes set estado='enviando' where id='${recuperarEmail}';`);
  const retomada = await sql('select id from suporte_notificacoes_reservar();');
  await sql(
    `update suporte_notificacoes set criado_em=now()-interval '24 hours' where id='${recuperarEmail}'; select id from suporte_notificacoes_reservar();`,
  );
  relatorio.contratos.retomadaEmail = {
    mesmoId: retomada === recuperarEmail,
    expirado:
      (await sql(`select estado from suporte_notificacoes where id='${recuperarEmail}';`)) ===
      'expirado',
  };
  console.log(JSON.stringify(relatorio.contratos, null, 2));
  if (!soContratos) {
    // Carga mista de transações reais. Falha/retry sintéticos; sem IA, rede externa ou envio.
    await sql(await readFile(join(raiz, 'scripts/perf/capacidade-carga.sql'), 'utf8'));
    const arquivo = join(pasta, 'carga.sql');
    await writeFile(arquivo, 'SELECT perf.transacao(:client_id);\n');
    await docker('cp', arquivo, `${container}:/tmp/carga.sql`);
    for (const clientes of apenasOito ? [8] : [8, 32]) {
      console.log(`Aquecimento 10s; medição 60s; ${clientes} conexões; sem outros benchmarks.`);
      const base = [
        'exec',
        container,
        'pgbench',
        '-U',
        'postgres',
        '-n',
        '-c',
        String(clientes),
        '-j',
        '2',
        '-f',
        '/tmp/carga.sql',
      ];
      await docker(...base, '-T', '10', 'postgres');
      const r = await docker(
        ...base,
        '-T',
        '60',
        '-l',
        '--log-prefix',
        `/tmp/perf-${clientes}`,
        'postgres',
      );
      if (!/number of failed transactions: 0 \(/.test(r.stdout))
        throw new Error('Transação falhou durante o benchmark');
      const arquivos = (
        await docker('exec', container, 'find', '/tmp', '-name', `perf-${clientes}.*`)
      ).stdout
        .trim()
        .split('\n');
      const latencias = [];
      for (const arq of arquivos) {
        const log = (await docker('exec', container, 'cat', arq)).stdout;
        for (const linha of log.trim().split('\n')) {
          const campos = linha.split(/\s+/);
          const n = Number(campos[2]);
          if (Number.isFinite(n)) latencias.push(n / 1000);
        }
      }
      latencias.sort((a, b) => a - b);
      relatorio.cenarios[clientes] = {
        conexoes: clientes,
        aquecimento_segundos: 10,
        duracao_segundos: 60,
        transacoes: latencias.length,
        p50_ms: latencias[Math.floor(latencias.length * 0.5)],
        p95_ms: latencias[Math.floor(latencias.length * 0.95)],
        pgbench: r.stdout,
      };
      console.log(JSON.stringify(relatorio.cenarios[clientes]));
    }
  }
  const saida = join(pasta, 'resultado.json');
  await writeFile(saida, JSON.stringify(relatorio, null, 2));
  console.log(
    `PERF_METRICS_START\n${JSON.stringify(relatorio)}\nPERF_METRICS_END\nRelatório: ${saida}`,
  );
  if (
    modo === 'atual' &&
    (relatorio.contratos.ia.aceitos !== 2 ||
      relatorio.contratos.email.reservados !== 1 ||
      relatorio.contratos.email.duplicados !== 0 ||
      relatorio.contratos.finalizacao.respostas !== 1 ||
      relatorio.contratos.finalizacao.tokens !== 100 ||
      relatorio.contratos.enriquecimento.aceitos !== 2 ||
      relatorio.contratos.estorno.saldo !== 1000 ||
      relatorio.contratos.estorno.estornos !== 2 ||
      !relatorio.contratos.retomadaIA.retomou ||
      !relatorio.contratos.retomadaIA.workerAntigoRecusado ||
      !relatorio.contratos.resultadoAtrasadoRecusado ||
      !relatorio.contratos.retomadaEmail.mesmoId ||
      !relatorio.contratos.retomadaEmail.expirado)
  )
    throw new Error('Contrato de concorrência violado');
} finally {
  // Alvo exato criado nesta execução, sem volumes persistentes nem dados reais.
  await docker('rm', '-f', '-v', container);
}
