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
      etiqueta="Caminho não encontrado"
      titulo="Esse conteúdo mudou de lugar."
      descricao="O endereço pode ter mudado ou o conteúdo não está mais publicado. Seus projetos e sua jornada continuam disponíveis."
      acoes={
        <>
          <Link href="/solucoes" className="via-btn via-btn--primary via-btn--md">
            Ver projetos
          </Link>
          <Link href="/inicio" className="via-btn via-btn--secondary via-btn--md">
            Ir para o início
          </Link>
        </>
      }
      passos={[
        { rotulo: 'Quer executar', valor: 'Abra a biblioteca de Projetos.' },
        { rotulo: 'Quer se orientar', valor: 'Retome pelo Mapa da Jornada.' },
      ]}
    />
  );
}
