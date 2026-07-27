'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Alert, Button, Input } from '@/design-system/via';
import { gerarSlug } from '@/lib/conteudo/schemas';
import { salvarFormacao, salvarSolucao, type EstadoConteudo } from '@/lib/conteudo/actions';
import { CapaUpload } from './CapaUpload';
import styles from './formulario.module.css';

const INICIAL: EstadoConteudo = {};

export type ValoresConteudo = {
  id?: string;
  titulo?: string;
  slug?: string;
  resumo?: string;
  categoria?: string | null;
  video_url?: string | null;
  capa_url?: string | null;
  status?: string;
};

function Salvar({ novo }: { novo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" loading={pending}>
      {novo ? 'Criar' : 'Salvar alterações'}
    </Button>
  );
}

/**
 * Editor de solução e de formação.
 *
 * UM COMPONENTE PARA OS DOIS. As duas entidades só divergem em dois campos
 * (categoria e vídeo, que são de solução); todo o resto é idêntico, e duplicar o
 * formulário significaria corrigir cada ajuste de validação em dois lugares até
 * que um deles fosse esquecido.
 *
 * TODOS OS CAMPOS SÃO CONTROLADOS, e isso não é preferência de estilo.
 * Com `defaultValue`, um erro de validação faz o React remontar o formulário e
 * cada campo não-controlado volta ao valor inicial — ou seja, a pessoa escreve um
 * resumo de 400 caracteres, erra o endereço do vídeo, e perde o resumo inteiro.
 * Medido: depois do primeiro submit reprovado, título, resumo, categoria e vídeo
 * voltavam vazios enquanto slug e capa sobreviviam, porque só esses dois tinham
 * estado. Com o objeto único abaixo, nada se perde e o erro aponta o campo certo
 * com o texto ainda lá.
 */
export function FormularioConteudo({
  tipo,
  valores = {},
}: {
  tipo: 'solucao' | 'formacao';
  valores?: ValoresConteudo;
}) {
  const acaoServidor = tipo === 'solucao' ? salvarSolucao : salvarFormacao;
  const [estado, acao] = useActionState(acaoServidor, INICIAL);

  const novo = !valores.id;
  const [campos, setCampos] = useState({
    titulo: valores.titulo ?? '',
    slug: valores.slug ?? '',
    resumo: valores.resumo ?? '',
    categoria: valores.categoria ?? '',
    video_url: valores.video_url ?? '',
    capa_url: valores.capa_url ?? '',
    status: valores.status ?? 'rascunho',
  });

  /* O slug só acompanha o título enquanto ninguém o editou à mão — e nunca em
     conteúdo já criado: reescrever o endereço de algo publicado quebraria todo
     link que já circula. */
  const [slugManual, setSlugManual] = useState(!novo);

  function mudar(campo: keyof typeof campos, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
  }

  const voltar = tipo === 'solucao' ? '/admin/solucoes' : '/admin/formacoes';
  const prefixo = tipo === 'solucao' ? 'solucoes' : 'formacoes';

  return (
    <form action={acao} className={styles.form} noValidate>
      {valores.id && <input type="hidden" name="id" value={valores.id} />}
      <input type="hidden" name="capa_url" value={campos.capa_url} />

      {estado.erro && (
        <Alert tone="danger" size="compact">
          {estado.erro}
        </Alert>
      )}

      <div className={styles.campos}>
        <Input
          id="titulo"
          name="titulo"
          label="Título"
          value={campos.titulo}
          error={estado.porCampo?.titulo}
          onChange={(e) => {
            mudar('titulo', e.target.value);
            if (!slugManual) mudar('slug', gerarSlug(e.target.value));
          }}
          required
        />

        <Input
          id="slug"
          name="slug"
          label="Endereço"
          hint={`Vai aparecer como /${prefixo}/${campos.slug || '...'}`}
          value={campos.slug}
          error={estado.porCampo?.slug}
          onChange={(e) => {
            setSlugManual(true);
            mudar('slug', e.target.value);
          }}
          required
        />

        <div className={styles.campo}>
          <label htmlFor="resumo" className={styles.rotulo}>
            Resumo
          </label>
          <textarea
            id="resumo"
            name="resumo"
            className={styles.textarea}
            rows={3}
            maxLength={400}
            value={campos.resumo}
            onChange={(e) => mudar('resumo', e.target.value)}
            aria-invalid={!!estado.porCampo?.resumo}
          />
          {estado.porCampo?.resumo && <p className={styles.erro}>{estado.porCampo.resumo}</p>}
        </div>

        {tipo === 'solucao' && (
          <>
            <Input
              id="categoria"
              name="categoria"
              label="Categoria"
              hint="Opcional. Agrupa a solução no catálogo."
              value={campos.categoria}
              error={estado.porCampo?.categoria}
              onChange={(e) => mudar('categoria', e.target.value)}
            />
            <Input
              id="video_url"
              name="video_url"
              label="Vídeo"
              hint="Endereço do player (Mux ou Panda). Não hospedamos vídeo no Storage."
              value={campos.video_url}
              error={estado.porCampo?.video_url}
              onChange={(e) => mudar('video_url', e.target.value)}
            />
          </>
        )}

        <CapaUpload
          valor={campos.capa_url}
          aoMudar={(url) => mudar('capa_url', url)}
          erro={estado.porCampo?.capa_url}
        />

        <div className={styles.campo}>
          <label htmlFor="status" className={styles.rotulo}>
            Status
          </label>
          <select
            id="status"
            name="status"
            className={styles.select}
            value={campos.status}
            onChange={(e) => mudar('status', e.target.value)}
          >
            <option value="rascunho">Rascunho — só admins veem</option>
            <option value="publicado">Publicado — visível para assinantes</option>
            <option value="arquivado">Arquivado — sai do catálogo</option>
          </select>
        </div>
      </div>

      <div className={styles.acoes}>
        <Salvar novo={novo} />
        <Link href={voltar} className={styles.cancelar}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
