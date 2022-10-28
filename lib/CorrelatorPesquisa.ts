import { AnáliseSEO } from "../src/types";

export default class CorrelatorPesquisa {
  constructor() {}
  static correlacionarTitulos(metadados: any): AnáliseSEO["correlacaoTermos"] {
    throw new Error("Método não implementado");
  }
  static calcularEficiencia(metadados: any): AnáliseSEO["posicaoEficiencia"] {
    throw new Error("Método não implementado");
  }
}
