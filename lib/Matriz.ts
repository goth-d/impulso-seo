/** Valor produto de uma iteração */
type MatrizIteração<T> = { valor: T; n: number; m: number };
/** Propriedades utilizadas numa iteração assíncrona */
interface MatrizIteraçãoIntervalos {
  intervaloColuna?: number;
  intervaloLinha?: number;
}
/**
 * Define um valor para o elemento numa posição da matriz
 * @param n - Índice da coluna, vulgo X no eixo horizontal
 * @param m - Índice da linha, vulgo Y no eixo vertical
 */
type DefiniçãoElementoMatriz<T = any> = (n: number, m: number) => T | undefined;

/** Semelhante a um vetor bidimensional, mas de um só nível, com tamanhos predefinidos e otimizado para iteração */
export default class Matriz<T = any>
  implements
    Iterable<MatrizIteração<T>>,
    AsyncIterable<MatrizIteração<T>>,
    MatrizIteraçãoIntervalos
{
  readonly largura: number;
  readonly altura: number;
  private readonly conteudo: Array<T | undefined>;
  readonly intervaloLinha?: number;
  readonly intervaloColuna?: number;

  /**
   *
   * @param largura - Tamanho horizontal do vetor
   * @param altura - Tamanho vertical do vetor
   * @param elemento - Função que popula os elementos durante a criação
   * @param iteracaoIntervaloLinha - Intervalo entre linhas durante uma iteração assíncrona
   * @param iteracaoIntervaloColuna - Intervalo entre colunas durante uma iteração assíncrona
   */
  constructor(
    largura: number,
    altura: number,
    elemento: DefiniçãoElementoMatriz<T> = () => undefined,
    iteracaoIntervaloLinha?: number,
    iteracaoIntervaloColuna?: number
  ) {
    this.largura = largura;
    this.altura = altura;
    this.conteudo = [];
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
    return new MatrizIteradorAssincrono<T>(this, this.intervaloLinha, this.intervaloColuna);
  }
  obter(n: number, m: number) {
    return this.conteudo[m * this.largura + n];
  }
  definir(n: number, m: number, valor: any) {
    this.conteudo[m * this.largura + n] = valor;
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
  readonly intervaloColuna?: number;
  readonly intervaloLinha?: number;

  constructor(matriz: Matriz, intervaloLinha?: number, intervaloColuna?: number) {
    this.matriz = matriz;
    this.intervaloLinha = intervaloLinha;
    this.intervaloColuna = intervaloColuna;
  }
  /** Implementa lógica do intervalo entre a obtenção dos elementos */
  private async obterElemento(): Promise<MatrizIteração<T>["valor"]> {
    // nova coluna e intervalo coluna
    if (this.m === 0 && this.n !== 0 && typeof this.intervaloColuna == "number") {
      return new Promise((res) =>
        setTimeout(() => res(this.matriz.obter(this.n, this.m)), this.intervaloColuna)
      );
    }
    // intervalo linha
    return typeof this.intervaloLinha == "number"
      ? new Promise((res) =>
          setTimeout(() => res(this.matriz.obter(this.n, this.m)), this.intervaloLinha)
        )
      : this.matriz.obter(this.n, this.m);
  }
  async next(): Promise<IteratorResult<MatrizIteração<T>>> {
    let value: MatrizIteração<T> | undefined;
    if (this.n == this.matriz.largura) return { value, done: true };

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
