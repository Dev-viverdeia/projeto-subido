import Link from 'next/link';
import { Compass } from 'lucide-react';
import { EstadoSistema } from './_components/EstadoSistema';

/**
 * 404 da área logada — dispara pelo `notFound()` das rotas dinâmicas (slug de
 * solução/formação inexistente ou em rascunho). Rascunho responde 404 e não
 * "sem acesso": confirmar que o conteúdo existe já é vazar informação.
 */
export default function NaoEncontrado() {
  return (
    <EstadoSistema
      icone={<Compass size={30} strokeWidth={1.6} />}
      etiqueta="Página não encontrada"
      titulo="Este conteúdo não está disponível."
      descricao="O endereço pode estar incorreto ou o conteúdo pode ter sido removido."
      acoes={
        <>
          <Link href="/solucoes">Ver projetos</Link>
          <Link href="/inicio">Ir para o início</Link>
        </>
      }
      passos={[
        { rotulo: 'Projetos', valor: 'Abra a lista de projetos disponíveis.' },
        { rotulo: 'Início', valor: 'Volte para ver sua próxima ação.' },
      ]}
    />
  );
}
