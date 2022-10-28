import {
  FerramentasNomes,
  IDocRaspavel,
  IFerramentaPesquisa,
  IPagina,
  IPesquisa,
} from "../../../types";
import { request as requisitar } from "undici";

export class RaspadorClient {
  constructor() {}

  public async requisitarPagina(url: string) {
    return requisitar(url, {
      method: "GET",
      throwOnError: true,
      bodyTimeout: 5000,
      headers: {
        accept: "text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8",
      },
    }).then((res) => res.body.text());
  }
}

export class Pagina implements IDocRaspavel, IPagina {
  readonly url: string;
  readonly _titulos: Array<[HTMLHeadingElement["tagName"], HTMLElement["innerHTML"]]>;

  constructor(url: string) {
    this.url = url;
    this._titulos = [];
  }
  get titulos() {
    // TODO: ordenar por tag
    return this._titulos.map(([_, t]) => t);
  }
  static obterConsultasSemelhantes() {
    // TODO: requisitar api externa
    throw new Error("Método não implementado");
  }
  public async rasparDados() {
    // TODO: usar cheerio
    // validar texto html safe
    // resumir titulo
    throw new Error("Método não implementado");
  }
}

export class FerramentaPesquisa implements IFerramentaPesquisa {
  readonly nome: FerramentasNomes;
  readonly urlBase: string | URL;
  readonly paramConsulta: string;
  readonly paramPosicaoDeslocada: string;
  readonly conteudoSeletor: string;

  constructor(
    nome: FerramentasNomes,
    urlBase: string | URL,
    paramConsulta: string,
    paramPosicaoDeslocada: string,
    conteudoSeletor: string
  ) {
    this.nome = nome;
    this.urlBase = new URL(urlBase);
    this.paramConsulta = paramConsulta;
    this.paramPosicaoDeslocada = paramPosicaoDeslocada;
    this.conteudoSeletor = conteudoSeletor;
  }

  public novaPesquisa(consulta: string, correspondencia: string): Pesquisa {
    let url = "/" + consulta;
    // TODO: gerar url
    return new Pesquisa(this.nome, url, correspondencia);
  }
}

export class Pesquisa implements IDocRaspavel, IPesquisa {
  readonly url: string;
  readonly ferramenta: FerramentasNomes;
  readonly correspondencia: string;
  private _posicao?: number;
  private _pagina?: number;
  constructor(
    ferramenta: IFerramentaPesquisa["nome"],
    consultaUrl: string,
    correspondencia: string
  ) {
    this.ferramenta = ferramenta;
    this.url = consultaUrl;
    this.correspondencia = correspondencia;
  }
  get posicao() {
    return this._posicao || NaN;
  }
  get pagina() {
    return this._pagina || NaN;
  }
  public async rasparDados() {
    // TODO: usar cheerio
    // veirificar se a correspendencia está contina na página
    // obter posicao e definir pagina
    throw new Error("Método não implementado");
  }
}
