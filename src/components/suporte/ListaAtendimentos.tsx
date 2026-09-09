import { LinkAcao } from '@/components/suporte/LinkAcao';
import Link from 'next/link';
import { Check, ChevronRight, MessageSquare } from 'lucide-react';
import { CATEGORIAS, ESTADOS, temRespostaNova, type CasoSuporte } from '@/lib/suporte/contrato';
import s from './suporte.module.css';

export function EstadoAtendimento({ estado }: { estado: CasoSuporte['status'] }) {
  return (
    <span className={s.estado} data-estado={estado}>
      {estado === 'resolvido' && <Check size={14} />}
      {ESTADOS[estado]}
    </span>
  );
}
export function ListaAtendimentos({
  casos,
  equipe = false,
  total,
  pagina = 0,
  status = '',
  busca = '',
  responsavel = '',
}: {
  casos: CasoSuporte[];
  equipe?: boolean;
  total: number;
  pagina?: number;
  status?: string;
  busca?: string;
  responsavel?: string;
}) {
  const base = equipe ? '/suporte/equipe' : '/suporte/atendimentos';
  const href = (p: number, e: string) =>
    `${base}?${new URLSearchParams({ pagina: String(p), status: e, busca, responsavel })}`;
  return (
    <div className={s.lista}>
      <form action={base} className={s.filtroFila}>
        <input
          className={s.input}
          name="busca"
          aria-label="Buscar por título ou número do atendimento"
          placeholder="Buscar por título ou número"
          defaultValue={busca}
          maxLength={120}
        />
        <input type="hidden" name="status" value={status} />
        {equipe && (
          <select
            className={s.select}
            aria-label="Filtrar por responsável"
            name="responsavel"
            defaultValue={responsavel}
          >
            <option value="">Toda a equipe</option>
            <option value="meus">Meus atendimentos</option>
            <option value="sem">Sem responsável</option>
          </select>
        )}
        <button type="submit" className={s.chip}>
          Filtrar
        </button>
        {(busca || responsavel) && (
          <Link className={s.atalho} href={base}>
            Limpar
          </Link>
        )}
      </form>
      <nav className={s.categorias} aria-label="Filtrar atendimentos">
        {equipe && (
          <Link
            className={s.chip}
            aria-current={status === 'pendentes' ? 'page' : undefined}
            href={href(0, 'pendentes')}
          >
            Precisa de resposta
          </Link>
        )}
        <Link className={s.chip} aria-current={!status ? 'page' : undefined} href={href(0, '')}>
          Todos
        </Link>
        {Object.entries(ESTADOS).map(([id, rotulo]) => (
          <Link
            key={id}
            className={s.chip}
            aria-current={status === id ? 'page' : undefined}
            href={href(0, id)}
          >
            {rotulo}
          </Link>
        ))}
      </nav>
      {!casos.length ? (
        <div className={s.vazio}>
          <MessageSquare size={24} />
          <p>
            {status || busca || responsavel
              ? 'Nenhum atendimento com esses filtros.'
              : equipe
                ? 'Nenhum pedido na fila. Novos atendimentos aparecerão aqui.'
                : 'Você ainda não tem atendimentos. Quando precisar de ajuda, acompanhe a resposta por aqui.'}
          </p>
          {!equipe && <LinkAcao href="/suporte/novo">Pedir ajuda</LinkAcao>}
        </div>
      ) : (
        casos.map((c) => (
          <Link
            className={s.linha}
            data-novo={!equipe && temRespostaNova(c)}
            href={`${equipe ? '/suporte/equipe' : '/suporte'}/${c.id}`}
            key={c.id}
          >
            <div>
              <strong>{c.assunto}</strong>
              {equipe && (
                <span className={s.meta}>
                  {c.email}
                  {c.prioridade === 'alta' ? ' · Prioridade alta' : ''}
                </span>
              )}
              {c.ultima_mensagem_resumo && (
                <p className={s.previaMensagem}>{c.ultima_mensagem_resumo}</p>
              )}
              <span className={s.meta}>
                #{c.numero} · {CATEGORIAS[c.categoria]} ·{' '}
                {new Date(c.atualizado_em).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  timeZone: 'America/Sao_Paulo',
                })}
                {equipe && !c.responsavel ? ' · Sem responsável' : ''}
              </span>
            </div>
            <div className={s.acoes}>
              {!equipe && temRespostaNova(c) && <span className={s.estado}>Nova resposta</span>}
              {equipe && c.aguardando_equipe_desde && (
                <span className={s.meta}>
                  Aguarda desde{' '}
                  {new Date(c.aguardando_equipe_desde).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo',
                  })}
                </span>
              )}
              <EstadoAtendimento estado={c.status} />
              <ChevronRight size={18} />
            </div>
          </Link>
        ))
      )}
      {total > 30 && (
        <nav className={s.acoes} aria-label="Páginas de atendimentos">
          {pagina > 0 && (
            <Link className={s.chip} href={href(pagina - 1, status)}>
              Anterior
            </Link>
          )}
          <span className={s.meta}>
            Página {pagina + 1} de {Math.ceil(total / 30)}
          </span>
          {(pagina + 1) * 30 < total && (
            <Link className={s.chip} href={href(pagina + 1, status)}>
              Próxima
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
