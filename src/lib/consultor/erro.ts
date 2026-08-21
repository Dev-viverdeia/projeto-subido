export class ErroSobral extends Error {
  constructor(
    message: string,
    readonly tipo: 'sem-chave' | 'limite' | 'recusa' | 'falha',
  ) {
    super(message);
    this.name = 'ErroSobral';
  }
}
