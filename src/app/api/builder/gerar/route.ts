import { createClient } from '@/lib/supabase/server';
import { handleError } from '@/lib/errors';
import { ErroDoBuilder, MODELO, gerarDocumento } from '@/lib/builder/gerar';
import { respostaDeErro } from '@/lib/builder/http';
import { PedidoGeracao } from '@/lib/builder/schema';

/**
 * PASSO 2 DO BUILDER — o projeto.
 *
 * `maxDuration` de 300s: é o teto da plataforma e a geração é a operação mais
 * longa do produto. Um teto apertado não deixa a geração mais rápida — só a
 * interrompe no meio, e uma solução truncada é pior que uma que demorou.
 */
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ erro: 'Faça login para usar o Builder.' }, { status: 401 });
  }

  const corpo = PedidoGeracao.safeParse(await request.json());
  if (!corpo.success) {
    return Response.json({ erro: 'Pedido inválido.', tipo: 'falha' }, { status: 400 });
  }

  const { id, respostas } = corpo.data;

  /* A ideia vem do BANCO, não do corpo do pedido. É o que impede alguém de
     gravar um rascunho curto e mandar gerar com outro texto — e é o que garante
     que o documento corresponde à ideia que ficou registrada. A RLS já limita a
     linha ao dono; `maybeSingle()` devolve `null` para id alheio ou inexistente,
     sem distinguir os dois casos. */
  const { data: linha, error: erroLeitura } = await supabase
    .from('builder_solucoes')
    .select('ideia_original')
    .eq('id', id)
    .maybeSingle();

  if (erroLeitura) return respostaDeErro(handleError(erroLeitura, 'builder:gerar:ler'));
  if (!linha) {
    return Response.json({ erro: 'Solução não encontrada.', tipo: 'falha' }, { status: 404 });
  }

  /* `gerando` fica gravado ANTES da chamada. É o que permite a tela dizer a
     verdade se a função morrer no meio: sem este estado, uma geração interrompida
     ficaria indistinguível de um rascunho que ninguém mandou gerar. */
  const { error: erroStatus } = await supabase
    .from('builder_solucoes')
    .update({ status: 'gerando', respostas, erro: null })
    .eq('id', id);

  if (erroStatus) return respostaDeErro(handleError(erroStatus, 'builder:gerar:status'));

  try {
    const documento = await gerarDocumento(linha.ideia_original, respostas);

    const { error } = await supabase
      .from('builder_solucoes')
      .update({
        status: 'pronta',
        documento,
        titulo: documento.titulo,
        modelo: MODELO,
        erro: null,
      })
      .eq('id', id);

    if (error) throw handleError(error, 'builder:gerar:gravar');

    return Response.json({ id });
  } catch (erro) {
    /* A falha é GRAVADA, não só devolvida. O usuário pode ter fechado a aba antes
       da resposta chegar; sem isto a solução ficaria presa em `gerando` para
       sempre, e a tela mostraria um spinner que nunca termina. */
    const mensagem =
      erro instanceof ErroDoBuilder ? erro.message : 'A geração falhou. Tente de novo.';

    await supabase
      .from('builder_solucoes')
      .update({ status: 'falhou', erro: mensagem })
      .eq('id', id);

    return respostaDeErro(erro);
  }
}
