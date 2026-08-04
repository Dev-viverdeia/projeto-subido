import { zipSync, strToU8 } from 'fflate';
import { obterSolucaoDoBuilder } from '@/lib/builder/queries';
import { montarKit, nomeDoArquivo } from '@/lib/builder/kit';

/**
 * Baixar o kit do projeto em ZIP.
 *
 * POR QUE ROTA E NÃO SERVER ACTION: Server Action devolve dado serializável para
 * o React, não um arquivo binário com `Content-Disposition`. Download é resposta
 * HTTP, e é isto que uma rota faz.
 *
 * A AUTORIZAÇÃO É A RLS, e não há verificação extra aqui de propósito.
 * `obterSolucaoDoBuilder` lê com o cliente do usuário; um id alheio simplesmente
 * não casa linha e a função devolve `null`. O 404 daqui é o mesmo para "não
 * existe" e "não é seu" — que é o comportamento certo, porque distinguir os dois
 * revelaria a existência do projeto de outra pessoa.
 *
 * `zipSync` E NÃO A VERSÃO ASSÍNCRONA: o kit são cinco arquivos de texto, dezenas
 * de KB. A versão assíncrona do fflate existe para não travar o event loop com
 * arquivos grandes; aqui o custo é sub-milissegundo e o `await` traria só
 * cerimônia. Se um dia entrar binário no kit, isto muda.
 *
 * SEM CACHE. O documento muda quando a pessoa regera, e um kit em cache
 * entregaria o plano antigo — silenciosamente, que é o pior modo de errar.
 */
export async function GET(_req: Request, { params }: RouteContext<'/api/builder/[id]/kit'>) {
  const { id } = await params;
  const solucao = await obterSolucaoDoBuilder(id);

  if (!solucao?.documento) {
    return new Response('Projeto não encontrado ou ainda sem plano gerado.', { status: 404 });
  }

  const arquivos = montarKit(solucao.documento);
  const zip = zipSync(
    Object.fromEntries(arquivos.map((a) => [a.nome, strToU8(a.conteudo)])),
    /* `level: 6` é o padrão do deflate. Texto comprime bem; subir para 9 dobraria
       o tempo por ganho de poucos KB. */
    { level: 6 },
  );

  return new Response(new Uint8Array(zip), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${nomeDoArquivo(solucao.documento.titulo)}"`,
      'Cache-Control': 'no-store',
    },
  });
}
