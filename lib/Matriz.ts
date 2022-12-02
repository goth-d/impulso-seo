/** Valor produto de uma iteração */
type MatrizIteração<T> = {
  /** Valor computado do elemento */
  valor: Awaited<T>;
  /** Índice da coluna, X */
  n: number;
  /** Índice da linha, Y */
  m: number;
};
/** Propriedades utilizadas numa iteração assíncrona */
interface MatrizIteraçãoIntervalos {
  intervaloColuna?: number;
  intervaloLinha?: number;
}
type DefiniçãoElementoMatriz<T = any> =
  /**
   * Define um valor para o elemento numa posição da matriz
   * @param n - Índice da coluna, vulgo X no eixo horizontal
   * @param m - Índice da linha, vulgo Y no eixo vertical
   */
  (n: number, m: number) => T | undefined;

/** Semelhante a um vetor bidimensional, mas de um só nível, com tamanhos predefinidos e personalizado para iteração */
export default class Matriz<T = any>
  implements
    Iterable<MatrizIteração<T>>,
    AsyncIterable<MatrizIteração<T>>,
    MatrizIteraçãoIntervalos
{
  readonly largura: number;
  readonly altura: number;
  private readonly conteudo: Array<T | undefined>;
  readonly intervaloElementoUndefined: boolean;
  readonly intervaloLinha?: number;
  readonly intervaloColuna?: number;

  /**
   *
   * @param largura - Tamanho horizontal do vetor, o número de colunas
   * @param altura - Tamanho vertical do vetor, o número de linhas
   * @param elemento - Função que popula os valores iniciais dos elementos
   * @param iteracaoIntervaloElementoUndefined - Se aguarda o intervalo de iteração em elementos `undefined`
   * @param iteracaoIntervaloLinha - Intervalo, em **ms**, entre linhas durante uma iteração assíncrona
   * @param iteracaoIntervaloColuna - Intervalo, em **ms**, entre colunas durante uma iteração assíncrona
   */
  constructor(
    largura: number,
    altura: number,
    elemento: DefiniçãoElementoMatriz<T> = () => undefined,
    iteracaoIntervaloElementoUndefined = false,
    iteracaoIntervaloLinha?: number,
    iteracaoIntervaloColuna?: number
  ) {
    this.largura = largura;
    this.altura = altura;
    this.conteudo = [];
    this.intervaloElementoUndefined = iteracaoIntervaloElementoUndefined;
    this.intervaloLinha = iteracaoIntervaloLinha;
    this.intervaloColuna = iteracaoIntervaloColuna;

    for (let m = 0; m < altura; m++) {
      for (let n = 0; n < largura; n++) {
        this.conteudo[m * largura + n] = elemento(n, m);
      }
    }
  }
  [Symbol.iterator](): Iterator<MatrizIteração<T>> {
    return new MatrizIterador<T>(this);
  }
  [Symbol.asyncIterator](): AsyncIterator<MatrizIteração<T>> {
    return new MatrizIteradorAssincrono<T>(
      this,
      this.intervaloElementoUndefined,
      this.intervaloLinha,
      this.intervaloColuna
    );
  }
  obter(n: number, m: number) {
    return this.conteudo[m * this.largura + n];
  }
  definir(n: number, m: number, valor: T) {
    this.conteudo[m * this.largura + n] = valor;
  }
  /** @returns {Array<T[]>} Uma cópia do conteúdo definido da matriz */
  get array2D(): Array<T[]> {
    const array: T[][] = [];
    for (const { valor, m } of this) {
      if (typeof valor != "undefined") {
        if (!array[m]) array[m] = [];
        array[m].push(valor);
      }
    }
    return array;
  }
}

class MatrizIterador<T> implements Iterator<MatrizIteração<T>> {
  private n = 0;
  private m = 0;
  private matriz: Matriz;

  constructor(matriz: Matriz) {
    this.matriz = matriz;
  }

  next(): IteratorResult<MatrizIteração<T>> {
    let value: MatrizIteração<T> | undefined;
    if (this.n == this.matriz.largura) return { done: true, value };

    value = {
      valor: this.matriz.obter(this.n, this.m),
      n: this.n,
      m: this.m,
    };
    // é percorrido pela vertical (valores m)
    this.m++;
    if (this.m == this.matriz.altura) {
      this.m = 0;
      this.n++;
    }
    return { value, done: false };
  }

  return(): IteratorResult<MatrizIteração<T>> {
    return { value: undefined, done: true };
  }
}

class MatrizIteradorAssincrono<T>
  implements AsyncIterator<MatrizIteração<T>>, MatrizIteraçãoIntervalos
{
  private n = 0;
  private m = 0;
  private matriz: Matriz;
  readonly intervaloElementoUndefined: boolean;
  readonly intervaloColuna?: number;
  readonly intervaloLinha?: number;
  private novaColuna = false;
  private iterouPrimeiroElemento = false;

  constructor(
    matriz: Matriz,
    intervaloElementoUndefined: boolean,
    intervaloLinha?: number,
    intervaloColuna?: number
  ) {
    this.matriz = matriz;
    this.intervaloElementoUndefined = intervaloElementoUndefined;
    this.intervaloLinha = intervaloLinha;
    this.intervaloColuna = intervaloColuna;
  }
  /** Implementa lógica do intervalo entre a obtenção dos elementos */
  private async obterElemento(): Promise<MatrizIteração<T>["valor"]> {
    // nova coluna
    if (this.m === 0 && this.n !== 0) this.novaColuna = true;

    const valor = this.matriz.obter(this.n, this.m);
    // elemento indefinido
    if (typeof valor == "undefined" && !this.intervaloElementoUndefined)
      return this.matriz.obter(this.n, this.m);

    // intervalo coluna
    if (this.novaColuna && typeof this.intervaloColuna == "number") {
      this.novaColuna = false;
      if (!this.iterouPrimeiroElemento) {
        this.iterouPrimeiroElemento = true;
        return valor;
      }
      return await new Promise((res) => setTimeout(() => res(valor), this.intervaloColuna));
    }

    if (!this.iterouPrimeiroElemento) {
      this.iterouPrimeiroElemento = true;
      return valor;
    }
    // intervalo linha
    return typeof this.intervaloLinha == "number"
      ? await new Promise((res) => setTimeout(() => res(valor), this.intervaloLinha))
      : valor;
  }
  async next(): Promise<IteratorResult<MatrizIteração<T>>> {
    let value: MatrizIteração<T> | undefined;
    if (this.n == this.matriz.largura) return { value, done: true };

    // define value, produto da iteração
    value = {
      // também espera o valor da matriz caso seja uma Promise
      valor: await this.obterElemento(),
      n: this.n,
      m: this.m,
    };

    // é percorrido pela vertical (valores m)
    this.m++;
    if (this.m == this.matriz.altura) {
      this.m = 0;
      this.n++;
    }

    return { value, done: false };
  }

  async return(): Promise<IteratorResult<MatrizIteração<T>>> {
    return { value: undefined, done: true };
  }
}
