export interface IRaspadorSEO {
  pagina: {
    /** Endereço da página */
    0: string | undefined;
    /** Define o endereço da página */
    1: (url: string | URL | HTMLAnchorElement | undefined) => void;
  };
  /** Se a página é acessível no servidor */
  paginaValida?: boolean;
  /** Agregado de títulos */
  paginaMetadados?: Record<string, any>;
  /** Agregado de consultas */
  pesquisaMetadados?: Record<string, any>;
  /** Resultado dos cálculos */
  analiseSEO?: AnáliseSEO;
}
/** Texto da página */
export type IDocumento = string;
/** Obtém o documento e/ou checa a disponibilidade */
export type RequisitarPagina = (url: string) => IDocumento;

export type RaspadorCliente = {};

export interface IDocRaspavel {
  /** Endereço absoluto na web */
  url: string;
  /** Define propriedades do objeto raspável */
  rasparDados(): Promise<void>;
}

export interface IPagina {
  titulos: string[];
}

/** Ferramentas de pesquisa utilizadas de fonte */
export type FerramentasNomes = "Google" | "Bing" | "Yahoo";

export interface IFerramentaPesquisa {
  nome: FerramentasNomes;
  urlBase: string | URL;
  // Bing, first; Google, start; Yahoo, b;
  paramPosicaoDeslocada: string;
  // q; q; p;
  paramConsulta: string;
  // #main; #search; #main;
  conteudoSeletor: string;
}

export interface IPesquisa {
  ferramenta: IFerramentaPesquisa["nome"];
  correspondencia: string;
  posicao: number;
  pagina: number;
}

export type RelaçãoPagina = {
  consultasSemelhantes: Record<string, string[]>;
  data: Date | number;
};

export type RelaçãoPesquisa = {
  registrosPesquisa: Record<string, Pick<IPesquisa, "posicao" | "pagina">>;
  data: Date | number;
};

export type AnáliseSEO = {
  correlacaoTermos: any;
  posicaoEficiencia: any;
};
