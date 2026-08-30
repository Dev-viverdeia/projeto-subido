export type ConteudoEmailEntrega = {
  assunto: string;
  html: string;
  texto: string;
};

type BaseEmail = {
  empresa: string;
  projeto: string;
  tarefa: string;
  link: string;
};

function escaparHtml(valor: string) {
  return valor
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function montarLayout({
  preCabecalho,
  titulo,
  mensagem,
  destaque,
  rotuloBotao,
  link,
  rodape,
}: {
  preCabecalho: string;
  titulo: string;
  mensagem: string;
  destaque?: string | null;
  rotuloBotao: string;
  link: string;
  rodape: string;
}) {
  const seguro = {
    preCabecalho: escaparHtml(preCabecalho),
    titulo: escaparHtml(titulo),
    mensagem: escaparHtml(mensagem),
    destaque: destaque ? escaparHtml(destaque) : null,
    rotuloBotao: escaparHtml(rotuloBotao),
    link: escaparHtml(link),
    rodape: escaparHtml(rodape),
  };

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>${seguro.titulo}</title>
  </head>
  <body style="margin:0;background:#f3f6f8;color:#0c1b3a;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${seguro.preCabecalho}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f6f8;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #dfe5ec;border-radius:22px;overflow:hidden;box-shadow:0 18px 45px rgba(12,27,58,.08);">
            <tr>
              <td style="padding:28px 32px;background:#071c35;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#9fdff7;">SUBIDO</div>
                <div style="margin-top:8px;font-size:18px;font-weight:700;">Projetos de IA, do combinado à entrega.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px;">
                <h1 style="margin:0;font-size:30px;line-height:1.15;letter-spacing:-.03em;color:#0c1b3a;">${seguro.titulo}</h1>
                <p style="margin:18px 0 0;font-size:16px;line-height:1.65;color:#516078;">${seguro.mensagem}</p>
                ${seguro.destaque ? `<div style="margin-top:22px;padding:16px 18px;border:1px solid #dfe5ec;border-radius:14px;background:#f8fafc;font-size:15px;line-height:1.55;color:#0c1b3a;">${seguro.destaque}</div>` : ''}
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                  <tr>
                    <td style="border-radius:12px;background:#071c35;">
                      <a href="${seguro.link}" style="display:inline-block;padding:14px 20px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${seguro.rotuloBotao}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#7b8799;">${seguro.rodape}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function emailValidacaoSolicitada({
  empresa,
  projeto,
  tarefa,
  link,
  profissional,
  nota,
}: BaseEmail & { profissional: string; nota: string | null }): ConteudoEmailEntrega {
  const assunto = `${empresa}: uma entrega está pronta para sua validação`;
  const mensagem = `${profissional} concluiu uma etapa de ${projeto}. Abra o portal para conferir o material e aprovar ou pedir um ajuste.`;
  const rodape = 'Este link abre somente o portal deste projeto. Você não precisa criar uma conta.';
  return {
    assunto,
    html: montarLayout({
      preCabecalho: `Valide a etapa ${tarefa} no Portal do Cliente.`,
      titulo: 'Uma entrega espera sua decisão.',
      mensagem,
      destaque: nota || `Etapa concluída: ${tarefa}`,
      rotuloBotao: 'Revisar entrega',
      link,
      rodape,
    }),
    texto: `${assunto}\n\n${mensagem}\n\n${nota || `Etapa concluída: ${tarefa}`}\n\nRevisar entrega: ${link}\n\n${rodape}`,
  };
}

export function emailDecisaoCliente({
  empresa,
  projeto,
  tarefa,
  link,
  decisao,
  comentario,
}: BaseEmail & {
  decisao: 'aprovada' | 'ajustes';
  comentario: string | null;
}): ConteudoEmailEntrega {
  const aprovada = decisao === 'aprovada';
  const assunto = aprovada
    ? `${empresa}: ${tarefa} foi aprovada`
    : `${empresa}: o cliente pediu um ajuste`;
  const titulo = aprovada ? 'O cliente aprovou a entrega.' : 'Há um ajuste para resolver.';
  const mensagem = aprovada
    ? `A validação de ${tarefa}, no projeto ${projeto}, foi registrada. A sala do projeto já mostra o próximo passo.`
    : `O cliente respondeu sobre ${tarefa}, no projeto ${projeto}. Veja o pedido, faça a correção e envie a nova versão.`;
  const destaque = aprovada ? `Etapa aprovada: ${tarefa}` : comentario;
  const rodape = 'A decisão já está salva no histórico do projeto.';
  return {
    assunto,
    html: montarLayout({
      preCabecalho: assunto,
      titulo,
      mensagem,
      destaque,
      rotuloBotao: aprovada ? 'Abrir sala do projeto' : 'Revisar ajuste',
      link,
      rodape,
    }),
    texto: `${assunto}\n\n${mensagem}${destaque ? `\n\n${destaque}` : ''}\n\nAbrir sala do projeto: ${link}\n\n${rodape}`,
  };
}
