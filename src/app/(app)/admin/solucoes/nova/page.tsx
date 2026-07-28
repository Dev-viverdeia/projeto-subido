import type { Metadata } from 'next';
import { CabecalhoPagina } from '../../../_components/CabecalhoPagina';
import { FormularioConteudo } from '../../_components/FormularioConteudo';

export const metadata: Metadata = { title: 'Nova solução · Administração' };

export default function NovaSoluçõesPage() {
  return (
    <>
      <CabecalhoPagina titulo="Nova solução" oculto />
      <FormularioConteudo tipo="solucao" />
    </>
  );
}
