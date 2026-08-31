'use client';

import { useActionState } from 'react';
import { ArrowUpRight, Check, LifeBuoy, ShieldCheck } from 'lucide-react';
import type { EstadoProjetoExecucao } from '@/lib/projetos-execucao/actions';
import { salvarEncerramentoProjeto } from '@/lib/projetos-execucao/encerramento-actions';
import {
  formatarGarantia,
  type EncerramentoProjeto as Encerramento,
} from '@/lib/projetos-execucao/encerramento';
import styles from './EncerramentoProjeto.module.css';

const INICIAL: EstadoProjetoExecucao = {};

export function EncerramentoProjeto({
  projetoId,
  encerramento,
  evidenciaInicial,
}: {
  projetoId: string;
  encerramento: Encerramento | null;
  evidenciaInicial: string | null;
}) {
  const [estado, acao, pendente] = useActionState(salvarEncerramentoProjeto, INICIAL);
  const editavel = !encerramento || encerramento.status === 'rascunho';

  if (!editavel && encerramento) {
    return (
      <section className={styles.encerramento} data-status={encerramento.status}>
        <header>
          <span className={styles.icone}>
            <Check size={18} aria-hidden="true" />
          </span>
          <div>
            <p>Encerramento preparado</p>
            <h2>
              {encerramento.status === 'encerrado'
                ? 'Projeto encerrado com clareza'
                : 'Termo enviado para o cliente'}
            </h2>
          </div>
          <span className={styles.selo}>
            {encerramento.status === 'encerrado' ? 'Aceito' : 'Aguardando aceite'}
          </span>
        </header>
        <div className={styles.resumoFinal}>
          <div>
            <span>Resultado registrado</span>
            <strong>{encerramento.resultadoPrincipal}</strong>
          </div>
          <div>
            <span>Garantia</span>
            <strong>{formatarGarantia(encerramento)}</strong>
          </div>
          <div>
            <span>Continuidade</span>
            <strong>{encerramento.responsavelContinuidade}</strong>
          </div>
          {encerramento.evidenciaResultadoUrl && (
            <a href={encerramento.evidenciaResultadoUrl} target="_blank" rel="noreferrer">
              Ver evidência <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.encerramento}>
      <header>
        <span className={styles.icone}>
          <ShieldCheck size={18} aria-hidden="true" />
        </span>
        <div>
          <p>Antes do aceite final</p>
          <h2>Deixe o pós-entrega combinado.</h2>
        </div>
        <span className={styles.selo}>{encerramento ? 'Rascunho salvo' : 'Obrigatório'}</span>
      </header>

      <form action={acao}>
        <input type="hidden" name="projeto" value={projetoId} />
        <div className={styles.introducao}>
          <div>
            <strong>O cliente precisa saber o que recebeu.</strong>
            <span>Registre o resultado real, sem promessas ou números inventados.</span>
          </div>
          <LifeBuoy size={18} aria-hidden="true" />
        </div>

        <div className={styles.gradePrincipal}>
          <label>
            <span>Resumo da entrega</span>
            <textarea
              name="resumo"
              defaultValue={encerramento?.resumoEntrega ?? ''}
              maxLength={4000}
              required
              placeholder="O que foi construído, configurado e entregue ao cliente."
            />
          </label>
          <label>
            <span>Principal resultado observado</span>
            <textarea
              name="resultado"
              defaultValue={encerramento?.resultadoPrincipal ?? evidenciaInicial ?? ''}
              maxLength={4000}
              required
              placeholder="Ex.: atendimento testado em produção e equipe preparada para operar."
            />
          </label>
        </div>

        <label>
          <span>Link da evidência do resultado</span>
          <input
            type="url"
            name="evidenciaUrl"
            defaultValue={encerramento?.evidenciaResultadoUrl ?? ''}
            maxLength={2048}
            placeholder="https://"
          />
        </label>

        <div className={styles.gradeGarantia}>
          <label className={styles.dias}>
            <span>Garantia após o aceite</span>
            <select name="garantiaDias" defaultValue={encerramento?.garantiaDias ?? 30}>
              <option value="0">Sem período adicional</option>
              <option value="7">7 dias</option>
              <option value="15">15 dias</option>
              <option value="30">30 dias</option>
              <option value="60">60 dias</option>
              <option value="90">90 dias</option>
            </select>
          </label>
          <label>
            <span>O que a garantia cobre</span>
            <input
              name="garantiaCobre"
              defaultValue={encerramento?.garantiaCobre ?? ''}
              maxLength={3000}
              required
              placeholder="Correções do que foi entregue e aprovado."
            />
          </label>
          <label>
            <span>O que fica fora da garantia</span>
            <input
              name="garantiaNaoCobre"
              defaultValue={encerramento?.garantiaNaoCobre ?? ''}
              maxLength={3000}
              required
              placeholder="Novas funcionalidades ou mudanças de escopo."
            />
          </label>
        </div>

        <div className={styles.gradeContinuidade}>
          <label>
            <span>Canal de suporte</span>
            <input
              name="canalSuporte"
              defaultValue={encerramento?.canalSuporte ?? ''}
              maxLength={500}
              required
              placeholder="E-mail, WhatsApp ou canal combinado."
            />
          </label>
          <label>
            <span>Responsável pela continuidade</span>
            <input
              name="responsavel"
              defaultValue={encerramento?.responsavelContinuidade ?? ''}
              maxLength={300}
              required
              placeholder="Nome e papel de quem assume a operação."
            />
          </label>
        </div>

        <label>
          <span>Como a operação continua daqui para frente</span>
          <textarea
            name="continuidade"
            defaultValue={encerramento?.orientacaoContinuidade ?? ''}
            maxLength={4000}
            required
            placeholder="Explique a rotina, os cuidados e onde encontrar os materiais finais."
          />
        </label>

        {estado.erro && (
          <p className={styles.erro} role="alert">
            {estado.erro}
          </p>
        )}
        {estado.sucesso && (
          <p className={styles.sucesso} role="status">
            {estado.sucesso}
          </p>
        )}

        <footer>
          <span>Depois de salvar, revise a mensagem e envie o aceite final logo abaixo.</span>
          <button type="submit" disabled={pendente}>
            <Check size={15} aria-hidden="true" />
            {pendente
              ? 'Salvando…'
              : encerramento
                ? 'Atualizar encerramento'
                : 'Salvar encerramento'}
          </button>
        </footer>
      </form>
    </section>
  );
}
