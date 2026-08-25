'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert, Button, Input } from '@/design-system/via';
import { ESTADO_MENTORIA_ADMIN, salvarMentoriaAdmin } from '@/lib/mentorias/admin-actions';
import styles from './FormularioMentoria.module.css';

export type MentorDoFormulario = {
  id: string;
  nome: string;
  headline: string;
  ativo: boolean;
};

export type ValoresMentoria = {
  id?: string;
  titulo?: string;
  descricao?: string;
  mentor_id?: string;
  inicio?: string;
  fim?: string;
  vagas?: number;
  custo_creditos?: number;
  sala_url?: string | null;
  status?: string;
};

function Salvar({ nova }: { nova: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      {nova ? 'Criar sessão' : 'Salvar alterações'}
    </Button>
  );
}

export function FormularioMentoria({
  mentores,
  valores = {},
}: {
  mentores: MentorDoFormulario[];
  valores?: ValoresMentoria;
}) {
  const [estado, acao] = useActionState(salvarMentoriaAdmin, ESTADO_MENTORIA_ADMIN);
  const nova = !valores.id;
  const [campos, setCampos] = useState({
    titulo: valores.titulo ?? '',
    descricao: valores.descricao ?? '',
    mentor_id: valores.mentor_id ?? mentores.find((mentor) => mentor.ativo)?.id ?? '',
    inicio: valores.inicio ?? '',
    fim: valores.fim ?? '',
    vagas: String(valores.vagas ?? 30),
    custo_creditos: String(valores.custo_creditos ?? 1),
    sala_url: valores.sala_url ?? '',
    status: valores.status ?? 'rascunho',
  });

  function mudar(campo: keyof typeof campos, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <form action={acao} className={styles.form} noValidate>
      {valores.id ? <input type="hidden" name="id" value={valores.id} /> : null}

      {estado.erro ? (
        <Alert tone="danger" size="compact" title="A sessão não foi salva">
          {estado.erro}
        </Alert>
      ) : null}

      <section className={styles.bloco} aria-labelledby="dados-sessao">
        <div className={styles.blocoCabecalho}>
          <div>
            <p className={styles.sobretitulo}>Sessão</p>
            <h2 id="dados-sessao">O que o membro vai encontrar</h2>
          </div>
          <p>Use uma promessa concreta: o problema que será trabalhado e o resultado esperado.</p>
        </div>

        <div className={styles.campos}>
          <Input
            id="titulo"
            name="titulo"
            label="Título"
            placeholder="Ex.: Como vender o primeiro projeto de atendimento com IA"
            value={campos.titulo}
            error={estado.porCampo?.titulo}
            onChange={(evento) => mudar('titulo', evento.target.value)}
            required
          />

          <div className={styles.campo}>
            <label htmlFor="descricao" className={styles.rotulo}>
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              className={styles.textarea}
              rows={4}
              maxLength={2000}
              placeholder="Explique em poucas linhas para quem é a sessão e o que levar para a conversa."
              value={campos.descricao}
              onChange={(evento) => mudar('descricao', evento.target.value)}
              aria-invalid={!!estado.porCampo?.descricao}
            />
            {estado.porCampo?.descricao ? (
              <p className={styles.erro}>{estado.porCampo.descricao}</p>
            ) : null}
          </div>

          <div className={styles.campo}>
            <label htmlFor="mentor_id" className={styles.rotulo}>
              Mentor
            </label>
            <select
              id="mentor_id"
              name="mentor_id"
              className={styles.select}
              value={campos.mentor_id}
              onChange={(evento) => mudar('mentor_id', evento.target.value)}
              aria-invalid={!!estado.porCampo?.mentor_id}
            >
              <option value="">Escolha um mentor</option>
              {mentores.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.nome}
                  {!mentor.ativo ? ' · inativo' : ''}
                </option>
              ))}
            </select>
            {estado.porCampo?.mentor_id ? (
              <p className={styles.erro}>{estado.porCampo.mentor_id}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.bloco} aria-labelledby="agenda-sessao">
        <div className={styles.blocoCabecalho}>
          <div>
            <p className={styles.sobretitulo}>Agenda e acesso</p>
            <h2 id="agenda-sessao">Quando e como a sessão acontece</h2>
          </div>
          <p>Datas e horários usam o fuso de Brasília (UTC−3).</p>
        </div>

        <div className={styles.gradeDupla}>
          <Input
            id="inicio"
            name="inicio"
            type="datetime-local"
            label="Início"
            value={campos.inicio}
            error={estado.porCampo?.inicio}
            onChange={(evento) => mudar('inicio', evento.target.value)}
            required
          />
          <Input
            id="fim"
            name="fim"
            type="datetime-local"
            label="Encerramento"
            value={campos.fim}
            error={estado.porCampo?.fim}
            onChange={(evento) => mudar('fim', evento.target.value)}
            required
          />
          <Input
            id="vagas"
            name="vagas"
            type="number"
            min="1"
            max="1000"
            label="Vagas"
            value={campos.vagas}
            error={estado.porCampo?.vagas}
            onChange={(evento) => mudar('vagas', evento.target.value)}
            required
          />
          <Input
            id="custo_creditos"
            name="custo_creditos"
            type="number"
            min="0"
            max="100"
            label="Custo em créditos"
            hint="Zero deixa a sessão gratuita."
            value={campos.custo_creditos}
            error={estado.porCampo?.custo_creditos}
            onChange={(evento) => mudar('custo_creditos', evento.target.value)}
            required
          />
        </div>

        <Input
          id="sala_url"
          name="sala_url"
          type="url"
          label="Link da sala"
          hint="Opcional. Você pode incluir depois; ele só aparece para quem fez check-in."
          placeholder="https://"
          value={campos.sala_url}
          error={estado.porCampo?.sala_url}
          onChange={(evento) => mudar('sala_url', evento.target.value)}
        />
      </section>

      <section className={styles.bloco} aria-labelledby="publicacao-sessao">
        <div className={styles.blocoCabecalho}>
          <div>
            <p className={styles.sobretitulo}>Visibilidade</p>
            <h2 id="publicacao-sessao">Quem já pode fazer check-in</h2>
          </div>
        </div>

        <div className={styles.campo}>
          <label htmlFor="status" className={styles.rotulo}>
            Status
          </label>
          <select
            id="status"
            name="status"
            className={styles.select}
            value={campos.status}
            onChange={(evento) => mudar('status', evento.target.value)}
          >
            <option value="rascunho">Rascunho — somente administradores veem</option>
            <option value="publicado">Publicado — membros podem fazer check-in</option>
            <option value="arquivado">Arquivado — sai da agenda</option>
          </select>
        </div>
      </section>

      <div className={styles.acoes}>
        <Salvar nova={nova} />
        <Link href="/admin/mentorias" className={styles.cancelar}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
