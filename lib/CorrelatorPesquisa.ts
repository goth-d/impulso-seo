import { AnáliseSEO, RelaçãoPesquisa } from "../src/types";

export default class CorrelatorPesquisa {
  constructor() {}
  static correlacionarTitulos(
    metadados: RelaçãoPesquisa["registrosPesquisa"],
    eficiencia: AnáliseSEO["posicaoEficiencia"]
  ): AnáliseSEO["correlacaoTermos"] {
    throw new Error("Método não implementado");
  }
  static calcularEficiencia(
    metadados: RelaçãoPesquisa["registrosPesquisa"]
  ): AnáliseSEO["posicaoEficiencia"] {
    throw new Error("Método não implementado");
  }
  static analisarPesquisas(metadados: RelaçãoPesquisa["registrosPesquisa"]) {
    throw new Error("Método não implementado");
  }
}
