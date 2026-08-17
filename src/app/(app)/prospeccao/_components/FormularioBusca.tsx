'use client';

import { useActionState, useState } from 'react';
import { ArrowRight, Building2, Coins, MapPin, Search } from 'lucide-react';
import { Alert, Button, Input } from '@/design-system/via';
import { criarListaProspeccao, type EstadoBuscaProspeccao } from '@/lib/prospeccao/actions';
import { QUANTIDADES_PROSPECCAO } from '@/lib/prospeccao/schema';
import styles from '../pagina.module.css';

const INICIAL: EstadoBuscaProspeccao = {};

export function FormularioBusca({ saldo, pronto }: { saldo: number; pronto: boolean }) {
  const [estado, acao, buscando] = useActionState(criarListaProspeccao, INICIAL);
  const [quantidade, setQuantidade] = useState(
    Number(estado.campos?.quantidade) || QUANTIDADES_PROSPECCAO[0],
  );
  const semSaldo = saldo < quantidade;

  return (
    <form action={acao} className={styles.formulario} noValidate aria-busy={buscando}>
      <div className={styles.formularioTopo}>
        <div>
          <p className={styles.sobretituloClaro}>Nova lista</p>
          <h2>O que você quer encontrar?</h2>
          <p>Faça uma busca simples. Você escolhe depois quais empresas entram no CRM.</p>
        </div>
        <span className={styles.custoBusca}>
          <Coins size={15} aria-hidden="true" /> 1 empresa encontrada = 1 crédito
        </span>
      </div>

      {!pronto && (
        <div className={styles.alertaFormulario}>
          <Alert tone="attn" size="compact">
            A busca está temporariamente indisponível. Nenhum crédito será usado.
          </Alert>
        </div>
      )}
      {estado.erro && (
        <div className={styles.alertaFormulario} role="alert">
          <Alert tone="danger" size="compact">
            {estado.erro}
          </Alert>
        </div>
      )}

      <div className={styles.buscaDireta}>
        <div className={styles.campoBusca}>
          <span className={styles.iconeCampo} aria-hidden="true">
            <Building2 size={18} strokeWidth={1.7} />
          </span>
          <Input
            id="prospeccao-segmento"
            name="segmento"
            label="Tipo de empresa"
            placeholder="Ex.: clínicas odontológicas"
            defaultValue={estado.campos?.segmento ?? ''}
            error={estado.porCampo?.segmento}
            autoComplete="off"
            disabled={buscando}
            required
          />
        </div>

        <span className={styles.conectorBusca} aria-hidden="true">
          em
        </span>

        <div className={styles.campoBusca}>
          <span className={styles.iconeCampo} aria-hidden="true">
            <MapPin size={18} strokeWidth={1.7} />
          </span>
          <Input
            id="prospeccao-localizacao"
            name="localizacao"
            label="Cidade ou região"
            placeholder="Ex.: Belo Horizonte, MG"
            defaultValue={estado.campos?.localizacao ?? ''}
            error={estado.porCampo?.localizacao}
            autoComplete="address-level2"
            disabled={buscando}
            required
          />
        </div>
      </div>

      <div className={styles.rodapeBusca}>
        <fieldset className={styles.quantidade} disabled={buscando}>
          <legend>Quantidade de empresas</legend>
          <input type="hidden" name="quantidade" value={quantidade} />
          <div>
            {QUANTIDADES_PROSPECCAO.map((opcao) => (
              <button
                type="button"
                key={opcao}
                data-ativo={quantidade === opcao || undefined}
                aria-pressed={quantidade === opcao}
                disabled={saldo < opcao}
                onClick={() => setQuantidade(opcao)}
              >
                {opcao}
              </button>
            ))}
          </div>
          {estado.porCampo?.quantidade && <small>{estado.porCampo.quantidade}</small>}
        </fieldset>

        <div className={styles.reservaBusca}>
          <span>
            <strong>{quantidade}</strong> créditos reservados
          </span>
          <small>
            Você paga apenas pelas empresas encontradas. O restante volta para seu saldo.
          </small>
        </div>

        <div className={styles.acaoBusca}>
          <span>
            Saldo atual <strong>{saldo}</strong>
          </span>
          <Button
            type="submit"
            variant="accent"
            size="lg"
            loading={buscando}
            disabled={!pronto || semSaldo}
            iconLeft={<Search size={17} aria-hidden="true" />}
            iconRight={!buscando ? <ArrowRight size={17} aria-hidden="true" /> : undefined}
          >
            {buscando ? 'Buscando empresas…' : 'Buscar empresas'}
          </Button>
        </div>
      </div>

      {buscando && (
        <p className={styles.andamentoBusca} role="status" aria-live="polite">
          Consultando empresas públicas e organizando a lista. Isso pode levar até um minuto.
        </p>
      )}
    </form>
  );
}
