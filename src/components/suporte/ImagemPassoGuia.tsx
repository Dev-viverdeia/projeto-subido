import conectar from '../../../public/ajuda/agenda-desconectado.png';
import conectado from '../../../public/ajuda/agenda-conectado.png';
import agendar from '../../../public/ajuda/agendar-reuniao.png';
import proposta from '../../../public/ajuda/proposta-sem-reuniao.png';
import tipo from '../../../public/ajuda/entrega-tipo.png';
import gestao from '../../../public/ajuda/entrega-gestao.png';
import pedir from '../../../public/ajuda/pedir-ajuda.png';
import acompanhar from '../../../public/ajuda/acompanhar-resposta.png';
import { capturaDoPasso } from '@/lib/suporte/capturas-guia';
import { CapturaGuia } from './CapturaGuia';

const imagens = {
  'agenda-desconectado': conectar,
  'agenda-conectado': conectado,
  'agendar-reuniao': agendar,
  'proposta-sem-reuniao': proposta,
  'entrega-tipo': tipo,
  'entrega-gestao': gestao,
};
export function ImagemPassoGuia({
  slug,
  texto,
  indice,
}: {
  slug: string;
  texto: string;
  indice: number;
}) {
  if (slug === 'pedir-e-acompanhar-ajuda' && indice < 2) {
    return (
      <CapturaGuia
        imagem={indice === 0 ? pedir : acompanhar}
        alt={
          indice === 0
            ? 'Formulário com assunto, descrição e opção de anexar um arquivo.'
            : 'Conversa com a pergunta do cliente e a resposta da equipe.'
        }
      />
    );
  }
  const captura = capturaDoPasso(slug, texto);
  if (!captura || !(captura.arquivo in imagens)) return null;
  return (
    <CapturaGuia imagem={imagens[captura.arquivo as keyof typeof imagens]} alt={captura.alt} />
  );
}
