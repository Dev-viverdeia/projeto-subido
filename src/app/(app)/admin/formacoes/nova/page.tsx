import type { Metadata } from 'next';
import { CabecalhoPagina } from '../../../_components/CabecalhoPagina';
import { FormularioConteudo } from '../../_components/FormularioConteudo';

export const metadata: Metadata = { title: 'Nova formação · Administração' };

export default function NovaFormaçõesPage() {
  return (
    <>
      <CabecalhoPagina
        titulo="Nova formação"
        descricao="Nasce como rascunho. Nada aparece para assinante até o status virar publicado."
      />
      <FormularioConteudo tipo="formacao" />
    </>
  );
}
