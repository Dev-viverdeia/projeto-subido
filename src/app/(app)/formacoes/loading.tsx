import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/design-system/via';
import pagina from './pagina.module.css';
import trilha from './_components/TrilhaFormacoes.module.css';
import cartao from './_components/CartaoFormacao.module.css';

/** Mesma geometria do catálogo: o conteúdo chega sem um segundo hero no caminho. */
export default function CarregandoFormacoes() {
  return (
    <div className={pagina.pagina} aria-busy="true">
      <header className={pagina.hero}>
        <div className={pagina.heroTexto}>
          <h1 className={pagina.titulo}>Formações</h1>
          <p className={pagina.descricao}>Aprenda as ferramentas para trabalhar com IA.</p>
        </div>
        <Link href="/solucoes" className={pagina.atalhoProjetos}>
          Ver projetos <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </header>
      <div className={trilha.raiz} role="status" aria-label="Carregando formações">
        <span className={trilha.contagem}>Carregando formações…</span>
        <div className={trilha.grade} aria-hidden="true">
          {Array.from({ length: 4 }, (_, indice) => (
            <div key={indice} className={cartao.cartao}>
              <div className={cartao.topo}>
                <Skeleton variant="rect" width={52} height={52} />
                <Skeleton width="30%" />
              </div>
              <div className={cartao.corpo}>
                <Skeleton variant="rect" width="78%" height={32} />
                <Skeleton width="92%" />
                <Skeleton width="40%" />
              </div>
              <div className={cartao.acao}>
                <Skeleton width="42%" />
                <Skeleton variant="rect" width={36} height={36} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
