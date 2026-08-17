'use client';

import { useActionState, useState } from 'react';
import { ArrowRight, Coins, Search } from 'lucide-react';
import { Alert, Button, Input, Switch } from '@/design-system/via';
import { criarListaProspeccao, type EstadoBuscaProspeccao } from '@/lib/prospeccao/actions';
import { QUANTIDADES_PROSPECCAO } from '@/lib/prospeccao/schema';
import styles from '../pagina.module.css';

const INICIAL: EstadoBuscaProspeccao = {};

export function FormularioBusca({ saldo, pronto }: { saldo: number; pronto: boolean }) {
  const [estado, acao, buscando] = useActionState(criarListaProspeccao, INICIAL);
  const [quantidade, setQuantidade] = useState(
    Number(estado.campos?.quantidade) || QUANTIDADES_PROSPECCAO[1],
  );

  return (
    <form action={acao} className={styles.formulario} noValidate>
      <div className={styles.formularioTopo}>
        <div>
          <p className={styles.sobretituloClaro}>Novo recorte</p>
          <h2>Quem você quer encontrar?</h2>
          <p>Defina o mercado. A plataforma transforma esse briefing em uma lista utilizável.</p>
        </div>
        <span className={styles.custoBusca}>
          <Coins size={15} aria-hidden="true" /> 1 crédito por lead salvo
        </span>
      </div>

      {!pronto && (
        <Alert tone="attn" size="compact">
          As fontes de busca estão sendo configuradas. Você pode preparar o recorte; nenhum crédito
          será usado enquanto a integração não estiver pronta.
        </Alert>
      )}
      {estado.erro && (
        <div role="alert">
          <Alert tone="danger" size="compact">
            {estado.erro}
          </Alert>
        </div>
      )}

      <div className={styles.camposPrincipais}>
        <div className={styles.campoNumerado}>
          <span>01</span>
          <Input
            id="prospeccao-segmento"
            name="segmento"
            label="Tipo de empresa"
            placeholder="Ex.: clínicas odontológicas"
            defaultValue={estado.campos?.segmento ?? ''}
            error={estado.porCampo?.segmento}
            autoComplete="off"
            required
          />
        </div>
        <div className={styles.campoNumerado}>
          <span>02</span>
          <Input
            id="prospeccao-localizacao"
            name="localizacao"
            label="Cidade ou região"
            placeholder="Ex.: Belo Horizonte, MG"
            defaultValue={estado.campos?.localizacao ?? ''}
            error={estado.porCampo?.localizacao}
            autoComplete="address-level2"
            required
          />
        </div>
        <div className={styles.campoNumerado}>
          <span>03</span>
          <Input
            id="prospeccao-termos"
            name="termos"
            label="Sinais que ajudam a filtrar"
            hint="Opcional. Separe por vírgulas."
            placeholder="Ex.: WhatsApp, agendamento, atendimento"
            defaultValue={estado.campos?.termos ?? ''}
            error={estado.porCampo?.termos}
            autoComplete="off"
          />
        </div>
      </div>

      <div className={styles.opcoesBusca}>
        <fieldset className={styles.quantidade}>
          <legend>Tamanho da lista</legend>
          <input type="hidden" name="quantidade" value={quantidade} />
          <div>
            {QUANTIDADES_PROSPECCAO.map((opcao) => (
              <button
                type="button"
                key={opcao}
                data-ativo={quantidade === opcao || undefined}
                aria-pressed={quantidade === opcao}
                onClick={() => setQuantidade(opcao)}
              >
                {opcao}
              </button>
            ))}
          </div>
          {estado.porCampo?.quantidade && <small>{estado.porCampo.quantidade}</small>}
        </fieldset>

        <Switch
          name="somenteComSite"
          defaultChecked={estado.campos?.somenteComSite ?? false}
          label="Somente empresas com site"
          description="Melhor para preparar uma abordagem com contexto."
        />

        <div className={styles.acaoBusca}>
          <span>
            Saldo após a reserva: <strong>{Math.max(saldo - quantidade, 0)}</strong>
          </span>
          <Button
            type="submit"
            variant="accent"
            size="lg"
            loading={buscando}
            disabled={!pronto || saldo < quantidade}
            iconLeft={<Search size={17} aria-hidden="true" />}
            iconRight={!buscando ? <ArrowRight size={17} aria-hidden="true" /> : undefined}
          >
            {buscando ? 'Montando sua lista…' : 'Criar lista'}
          </Button>
        </div>
      </div>
    </form>
  );
}
