import { Cheerio, Element as CheerioElemento } from "cheerio";
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
> = Omit<Dispatcher.RequestOptions, "path" | "origin" | "method" | "headers"> & {
  method?: Dispatcher.RequestOptions["method"];
  headers?: RaspadorClienteCabeçalhos<RaspadorNome, FonteLink>;
};

export interface IRaspadorCliente<Nome extends string = any, Link extends string = any> {
  opcoes: RaspadorClienteOpções<Nome, Link>;
  requisitar(url: string | URL, opcoes: RaspadorClienteRequisição): Promise<string>;
}

export interface IRaspadorSEO {
  pagina: {
    /** Endereço da página */
    0: string | undefined;
    /** Define o endereço da página */
    1: (url: string | URL | HTMLAnchorElement | undefined) => void;
  };
  /** Estado raspando */
  estaRaspando: boolean | undefined;
  /** Se a página é acessível no servidor */
  paginaValida: string | undefined;
  /** Agregado de títulos */
  paginaMetadados: RelaçãoPagina | undefined;
  /** Agregado de consultas */
  pesquisasMetadados: RelaçãoPesquisas | undefined;
  /** Resultado dos cálculos */
  analiseSEO: AnáliseSEO | undefined;
}
/** Texto da página web */
export type DocumentoTexto = string;
/** Contexto do texto da página */
export type ContextoConteudo = string;
/** Obtém o documento e/ou checa a disponibilidade */
export type RequisitarPagina = (url: string) => DocumentoTexto;

export interface IDocRaspavel {
  /** Endereço na web */
  endereco: URL | string;
  doc?: DocumentoTexto;
  conteudo?: ContextoConteudo;
  /** Requisita o endereço e define o texto do documento se recebido */
  obterDocumento(cliente?: IRaspadorCliente): Promise<this>;
  /** Se com o documento definido, determina um contexto do conteúdo principal */
  determinarConteudoPrincipal(seletorIndicacao?: string): this;
}

export interface IPagina {
  titulos: string[];
  rasparTitulos(): this;
}

/** Ferramentas de pesquisa utilizadas no app */
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
}

export interface IPesquisa {
  ferramenta: IFerramentaPesquisa;
  consulta: string;
  /** Origem da consulta, para qual deve corresponder a pesquisa */
  fonte: URL;
  posicao: number;
  pagina: number;
  rasparCorrespondente(): Promise<this>;
  obterPesquisasRelacionadas(): string[];
}

export type RelaçãoPagina = {
  consultasRelacionadas: Array<string[]>;
  data: Date | number;
  fonte: string | URL;
};

export type RelaçãoPesquisas = {
  registrosPesquisas: Record<FerramentasNomes, Array<Pick<IPesquisa, "posicao" | "pagina">[]>>;
  data: Date | number;
};

export type AnáliseSEO = {
  correlacaoTermos: any;
  posicaoEficiencia: any;
};
