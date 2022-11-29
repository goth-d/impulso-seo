import { AnáliseSEO, RelaçãoPesquisas } from "../src/types";

export default class CorrelatorPesquisa {
  constructor() {}
  static correlacionarTitulos(
    metadados: RelaçãoPesquisas["registrosPesquisas"],
    eficiencia: AnáliseSEO["posicaoEficiencia"]
  ): AnáliseSEO["correlacaoTermos"] {
    throw new Error("Método não implementado");
  }
  static calcularEficiencia(
    metadados: RelaçãoPesquisas["registrosPesquisas"]
  ): AnáliseSEO["posicaoEficiencia"] {
    throw new Error("Método não implementado");
  }
  static analisarPesquisas(metadados: RelaçãoPesquisas["registrosPesquisas"]) {
    throw new Error("Método não implementado");
  }
}
