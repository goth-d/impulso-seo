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
import { Cheerio, load as carregar, Element as ElementoCheerio } from "cheerio";

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
  public conteudo?: string;

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
  public determinarConteudoPrincipal(): this {
    if (this.doc) {
      const $ = carregar(this.doc);
      let conteudo: Cheerio<ElementoCheerio>;
      if ($("body").children().length) {
        conteudo = $("main");
        conteudo = conteudo.length ? conteudo : $("#main");
        if (!conteudo.length) {
          // determina o elemento com conteudo principal

          let cabecalho = $("#header");
          if (!cabecalho.length) cabecalho = $("header");
          let rodape = $("#footer");
          if (!rodape.length) rodape = $("footer");

          // teste de ser um page header ou page footer
          const maisRazo =
            cabecalho?.parentsUntil("body").length >= rodape?.parentsUntil("body").length
              ? rodape
              : cabecalho;

          if (maisRazo?.parentsUntil("body").length > 1) {
            if (maisRazo === cabecalho) {
              // itera desde abaixo o body sobre os elementos pai do header
              let pais = maisRazo.parentsUntil("body"),
                i = pais.length - 2;
              if (pais[i]) {
                for (; i >= 0; i--) {
                  for (let irmao = $(pais.get(i)).next(); irmao; irmao = irmao.next()) {
                    // captura o proximo elemento irmao que tiver mais conteudo
                    if (!conteudo.length) conteudo = irmao;
                    else if (irmao.contents().length > conteudo.text().length) conteudo = irmao;
                  }
                }
              } else {
                // itera desde abaixo o body sobre os elementos pai do rodape
                let pais = maisRazo.parentsUntil("body"),
                  i = pais.length - 2;
                if (pais[i]) {
                  for (; i >= 0; i--) {
                    for (let irmao = $(pais.get(i)).prev(); irmao; irmao = irmao.prev()) {
                      // captura o elemento irmao anterior que tiver mais conteudo
                      if (!conteudo.length) conteudo = irmao;
                      else if (irmao.contents().length >= conteudo.text().length) conteudo = irmao;
                    }
                  }
                }
              }
            }
          } else if (maisRazo) {
            // cabecalho ou rodape é filho direto do body
            if (maisRazo === cabecalho) {
              for (let irmao = maisRazo.next(); irmao; irmao = irmao.next()) {
                // captura o proximo elemento irmao que tiver mais conteudo
                if (!conteudo.length) conteudo = irmao;
                else if (irmao.contents().length > conteudo.text().length) conteudo = irmao;
              }
            } else {
              for (let irmao = maisRazo.prev(); irmao; irmao = irmao.prev()) {
                // captura o elemento irmao anterior que tiver mais conteudo
                if (!conteudo.length) conteudo = irmao;
                else if (irmao.contents().length >= conteudo.text().length) conteudo = irmao;
              }
            }
          } else {
            // determina algum filho direto do body (titulos raspados podem não referir totalmente ao conteudo)
            $("body")
              .children()
              .each((_, el) => {
                conteudo =
                  !conteudo.length || $(el).text().length > conteudo.text().length
                    ? $(el)
                    : conteudo;
              });
          }
        }

        this.conteudo = conteudo.html() ?? undefined;
      }
    }

    return this;
  }
}

export class Pagina extends DocRaspavel implements IPagina {
  private _titulos: Array<[HTMLHeadingElement["tagName"], HTMLElement["innerHTML"]]>;

  constructor(url: string | URL) {
    super(new URL(url));
    this._titulos = [];
  }

  get titulos() {
    return (
      this._titulos
        // valor unicode é crescente, ordena [h1, h2, etc]
        .sort(([tagA], [tagB]) => (tagA < tagB ? -1 : tagA > tagB ? 1 : 0))
        .map(([_, t]) => t)
    );
  }
  public rasparTitulos() {
    if (!this.conteudo) this.determinarConteudoPrincipal();
    if (this.conteudo) {
      // Google considera até 32 palavras chave
      const palavraChaveRgx = /(\b\w+)/g;

      const $ = carregar(this.conteudo);

      this._titulos = [
        ...$("h1")
          .toArray()
          .slice(0, 1)
          // text() já escapa html chamando DOM<createTextNode()>;
          .map<[string, string]>((el) => [el.tagName, $(el).text()]),
        ...$("h2")
          .toArray()
          .slice(0, 4)
          .map<[string, string]>((el) => [el.tagName, $(el).text()]),
        ...$("h3")
          .toArray()
          .slice(0, 3)
          .map<[string, string]>((el) => [el.tagName, $(el).text()]),
      ].reduce<typeof this._titulos>((raspados, [tag, texto]) => {
        if (!palavraChaveRgx.test(texto)) return raspados;

        texto = texto.match(palavraChaveRgx)?.slice(0, 32).join(" ") as string;
        // limite a 100 caracteres
        texto = texto.slice(0, 100);

        raspados.push([tag, texto]);
        return raspados;
      }, []);
    }

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
