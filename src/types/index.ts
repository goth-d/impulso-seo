import Dispatcher from "undici/types/dispatcher";

export type RaspadorClienteCabeçalhos<
  RaspadorNome extends string = any,
  FonteLink extends string = any
> = Dispatcher.RequestOptions["headers"] & {
  "user-agent"?: `${RaspadorNome}Bot (${FonteLink})`;
};
export type RaspadorClienteOpções<
  RaspadorNome extends string = any,
  FonteLink extends string = any
> = Omit<Dispatcher.RequestOptions, "path" | "method" | "headers"> & {
  method?: Dispatcher.RequestOptions["method"];
  headers?: RaspadorClienteCabeçalhos<RaspadorNome, FonteLink>;
};
export type RaspadorClienteRequisição<
  RaspadorNome extends string = any,
  FonteLink extends string = any
> = Omit<Dispatcher.RequestOptions, "method" | "headers"> & {
  method?: Dispatcher.RequestOptions["method"];
  headers?: RaspadorClienteCabeçalhos<RaspadorNome, FonteLink>;
};

export interface IRaspadorCliente<Nome extends string = any, Link extends string = any> {
  opcoes: RaspadorClienteOpções<Nome, Link>;
  dispatcher: Dispatcher;
  requisitar(opcoes: RaspadorClienteRequisição): Promise<string>;
}

export interface IRaspadorSEO {
  pagina: {
    /** Endereço da página */
    0: string | undefined;
    /** Define o endereço da página */
    1: (url: string | URL | HTMLAnchorElement | undefined) => void;
  };
  /** Se a página é acessível no servidor */
  paginaValida: Promise<string | void>;
  /** Agregado de títulos */
  paginaMetadados: Promise<RelaçãoPagina | void>;
  /** Agregado de consultas */
  pesquisaMetadados: Promise<RelaçãoPesquisa | void>;
  /** Resultado dos cálculos */
  analiseSEO: Promise<AnáliseSEO | void>;
}
/** Texto da página web */
export type DocumentoTexto = string;
/** Obtém o documento e/ou checa a disponibilidade */
export type RequisitarPagina = (url: string) => DocumentoTexto;

export interface IDocRaspavel {
  /** Endereço na web */
  endereco: URL | string;
  doc?: DocumentoTexto;
  obterDocumento(cliente?: IRaspadorCliente): Promise<this>;
}

export interface IPagina {
  titulos: string[];
  rasparTitulos(): Promise<this>;
}

/** Ferramentas de pesquisa utilizadas de fonte */
export type FerramentasNomes = "Google" | "Bing" | "Yahoo";

export interface IFerramentaPesquisa {
  nome: FerramentasNomes;
  origem: string | URL;
  // Bing, first; Google, start; Yahoo, b;
  paramPosicaoDeslocada: string;
  // q; q; p;
  paramConsulta: string;
  // #main; #search; #main;
  conteudoSeletor: string;

  relacionadosSeletor?: string;
}

export interface IPesquisa {
  ferramenta: IFerramentaPesquisa["nome"];
  consulta: string;
  /** Origem da consulta, para qual deve corresponder a pesquisa */
  fonte: URL;
  posicao: number;
  pagina: number;
  rasparCorrespondente(): Promise<this>;
  obterRelacionados(): Promise<string[]>;
}

export type RelaçãoPagina = {
  consultasRelacionadas: Array<string[]>;
  data: Date | number;
  fonte: string | URL;
};

export type RelaçãoPesquisa = {
  registrosPesquisa: Record<FerramentasNomes, Array<Pick<IPesquisa, "posicao" | "pagina">[]>>;
  data: Date | number;
};

export type AnáliseSEO = {
  correlacaoTermos: any;
  posicaoEficiencia: any;
};
