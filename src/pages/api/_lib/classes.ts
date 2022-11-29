import {
  FerramentasNomes,
  IDocRaspavel,
  IFerramentaPesquisa,
  IPagina,
  IPesquisa,
  IRaspadorCliente,
  RaspadorClienteOpções,
  RaspadorClienteRequisição,
} from "../../../types";
import { Dispatcher, request as undiciRequisitar } from "undici";

const RaspadorClienteOpcoes: RaspadorClienteOpções = {
  method: "GET",
  throwOnError: true,
  headersTimeout: 15 * 1000,
  bodyTimeout: 15 * 1000,
  headers: {
    "user-agent": "ImpulsoSeoBot (https://github.com/goth-d/impulso-seo)",
    accept: "text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8",
  },
};
function agregarClienteOpcoes(
  opcoesEntrada: Partial<Dispatcher.RequestOptions> | undefined,
  opcoesPredefinidas = RaspadorClienteOpcoes
) {
  return {
    ...opcoesPredefinidas,
    ...opcoesEntrada,
    headers: { ...opcoesPredefinidas.headers, ...opcoesEntrada?.headers },
  };
}

export class RaspadorCliente<
  Nome extends string = "ImpulsoSeo",
  Link extends string = "https://github.com/goth-d/impulso-seo"
> implements IRaspadorCliente<Nome, Link>
{
  readonly opcoes: RaspadorClienteOpções<Nome, Link>;

  constructor(opcoes?: RaspadorClienteOpções<Nome, Link>) {
    this.opcoes = agregarClienteOpcoes(opcoes);
  }

  public async requisitar<BotNome extends string = Nome, FonteLink extends string = Link>(
    url: string | URL,
    opcoes?: RaspadorClienteRequisição<BotNome, FonteLink>
  ): Promise<string> {
    const clienteOpcoes = { ...this.opcoes };

    if (this.opcoes.origin) {
      // adiciona origin caso não tenha no url
      url = new URL(url, this.opcoes.origin);
      // previne erro no undici de argumento invalido
      delete clienteOpcoes.origin;
    }

    return undiciRequisitar(url, agregarClienteOpcoes(opcoes, clienteOpcoes)).then((res) =>
      res.body.text()
    );
  }
}

export class DocRaspavel implements IDocRaspavel {
  readonly endereco: URL | string;

  private _doc?: string;
  constructor(endereco: string | URL) {
    this.endereco = endereco;
  }
  public async obterDocumento(cliente?: RaspadorCliente): Promise<this> {
    cliente = cliente || new RaspadorCliente();

    return cliente.requisitar(this.endereco).then((doc) => {
      this._doc = doc;
      return this;
    });
  }
  get doc() {
    return this._doc;
  }
}

export class Pagina extends DocRaspavel implements IPagina {
  private _titulos: Array<[HTMLHeadingElement["tagName"], HTMLElement["innerHTML"]]>;

  constructor(url: string | URL) {
    super(new URL(url));
    this._titulos = [];
  }

  get titulos() {
    // TODO: ordenar por tag
    return this._titulos.map(([_, t]) => t);
  }
  public async rasparTitulos() {
    // TODO: usar cheerio
    // validar texto html safe
    // resumir titulo
    return this;
  }
}

export class FerramentaPesquisa implements IFerramentaPesquisa {
  readonly nome: FerramentasNomes;
  readonly origem: string | URL;
  readonly paramConsulta: string;
  readonly paramPosicaoDeslocada: string;
  readonly conteudoSeletor: string;
  readonly relacionadosSeletor?: string;

  constructor(
    nome: FerramentasNomes,
    origem: string | URL,
    paramConsulta: string,
    paramPosicaoDeslocada: string,
    conteudoSeletor: string,
    relacionadosSeletor?: string
  );
  constructor(
    nome: FerramentasNomes,
    origem: string | URL,
    paramConsulta: string,
    paramPosicaoDeslocada: string,
    conteudoSeletor: string,
    relacionadosSeletor: string
  ) {
    this.nome = nome;
    this.origem = new URL(origem);
    this.paramConsulta = paramConsulta;
    this.paramPosicaoDeslocada = paramPosicaoDeslocada;
    this.conteudoSeletor = conteudoSeletor;
    if (relacionadosSeletor) this.relacionadosSeletor = relacionadosSeletor;
  }

  public novaPesquisa(consulta: string, fonte: string | URL): Pesquisa {
    let caminho = "/" + consulta;
    // TODO: gerar url
    return new Pesquisa(this, caminho, consulta, fonte);
  }
}

export class Pesquisa extends DocRaspavel implements IPesquisa {
  readonly ferramenta: FerramentaPesquisa["nome"];
  readonly consulta: string;
  readonly fonte: URL;
  private _posicao?: number;
  private _pagina?: number;
  public obterRelacionados: () => Promise<string[]>;
  constructor(
    ferramenta: FerramentaPesquisa,
    consulta: string,
    consultaURI: string,
    fonte: string | URL
  );
  constructor(
    ferramenta: FerramentaPesquisa,
    consulta: string,
    consultaCaminho: string,
    fonte: string | URL
  ) {
    super(consultaCaminho);
    this.consulta = consulta;
    this.fonte = new URL(fonte);
    if (ferramenta.relacionadosSeletor)
      this.obterRelacionados = async () => {
        return [];
      };
    else this.obterRelacionados = async () => [];
    this.ferramenta = ferramenta.nome;
  }
  get posicao() {
    return this._posicao || NaN;
  }
  get pagina() {
    return this._pagina || NaN;
  }
  public async rasparCorrespondente() {
    // TODO: usar cheerio
    // veirificar se a correspendencia está contina na página
    // obter posicao e definir pagina
    return this;
  }
}
