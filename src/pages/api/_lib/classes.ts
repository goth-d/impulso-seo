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
import { Cheerio, load as carregar, Element as ElementoCheerio, AnyNode } from "cheerio";
import { stringify as codificar } from "node:querystring";
import { escanearTextoCorrespondente } from "../../../../lib/Raspagem";
import { StringDecoder } from "node:string_decoder";

const RaspadorClienteOpcoes: RaspadorClienteOpções = {
  method: "GET",
  throwOnError: true,
  headersTimeout: 15 * 1000,
  bodyTimeout: 15 * 1000,
  maxRedirections: 1,
  headers: {
    "user-agent": "ImpulsoSeoBot (https://github.com/goth-d/impulso-seo)",
    accept: "text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8",
    "content-language": "pt-BR",
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

    if (clienteOpcoes.origin) {
      // adiciona origin caso não tenha no url
      url = new URL(url, clienteOpcoes.origin);
      // previne erro no undici de argumento invalido
      delete clienteOpcoes.origin;
    }

    return undiciRequisitar(url, agregarClienteOpcoes(opcoes, clienteOpcoes)).then(async (res) => {
      if (res.headers["content-type"] && /ISO-8859-1/i.test(res.headers["content-type"])) {
        let doc = "";
        const d = new StringDecoder("latin1");
        for await (let chunk of res.body) {
          doc += d.write(chunk);
        }
        return doc;
      }

      return res.body.text();
    });
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
  public determinarConteudoPrincipal(seletorIndicacao?: string): this {
    if (this.doc) {
      const $ = carregar(this.doc);

      // tenta definir pelo argumento
      let conteudo: Cheerio<ElementoCheerio | AnyNode> | undefined = seletorIndicacao
        ? $(seletorIndicacao)
        : undefined;

      if (!conteudo?.length && $("body").children().length) {
        // determina o elemento com conteudo principal
        conteudo = $("main");
        conteudo = conteudo.length ? conteudo : $("#main");
        if (!conteudo.length) {
          // tenta predizer o elemento com conteudo principal

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
              // itera sobre irmaos de cabecalho e dos elementos pai ate body
              let pais = maisRazo.parentsUntil("body").addBack(),
                i = pais.length - 2;
              if (pais[i]) {
                for (; i >= 0; i--) {
                  for (let irmao = $(pais.get(i)).next(); irmao.length; irmao = irmao.next()) {
                    // captura o proximo elemento irmao que tiver mais conteudo
                    if (!conteudo.length) conteudo = irmao;
                    else if (irmao.contents().length > conteudo.text().length) conteudo = irmao;
                  }
                }
              } else {
                // itera sobre irmaos de rodape e dos elementos pai ate body
                let pais = maisRazo.parentsUntil("body").addBack(),
                  i = pais.length - 2;
                if (pais[i]) {
                  for (; i >= 0; i--) {
                    for (let irmao = $(pais.get(i)).prev(); irmao.length; irmao = irmao.prev()) {
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
              for (let irmao = maisRazo.next(); irmao.length; irmao = irmao.next()) {
                // captura o proximo elemento irmao que tiver mais conteudo
                if (!conteudo.length) conteudo = irmao;
                else if (irmao.contents().length > conteudo.text().length) conteudo = irmao;
              }
            } else {
              for (let irmao = maisRazo.prev(); irmao.length; irmao = irmao.prev()) {
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
                  !conteudo?.length || $(el).text().length > conteudo.text().length
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

  constructor(
    nome: FerramentasNomes,
    origem: string | URL,
    paramConsulta: string,
    paramPosicaoDeslocada: string,
    conteudoSeletor: string
  ) {
    this.nome = nome;
    this.origem = new URL(origem);
    this.paramConsulta = paramConsulta;
    this.paramPosicaoDeslocada = paramPosicaoDeslocada;
    this.conteudoSeletor = conteudoSeletor;
  }

  public novaPesquisa(consulta: string, fonte: string | URL): Pesquisa {
    const caminho = `?${codificar({ [this.paramConsulta]: consulta })}`;

    return new Pesquisa(this, consulta, caminho, fonte);
  }
}

export class Pesquisa extends DocRaspavel implements IPesquisa {
  readonly ferramenta: FerramentaPesquisa;
  readonly consulta: string;
  readonly fonte: URL;
  private _posicao?: number;
  private _pagina?: number;

  constructor(
    ferramenta: FerramentaPesquisa,
    consulta: string,
    consultaCaminho: string,
    fonte: string | URL
  ) {
    super(consultaCaminho);
    this.consulta = consulta;
    this.fonte = new URL(fonte);
    this.ferramenta = ferramenta;
  }

  get posicao() {
    return this._posicao || NaN;
  }
  get pagina() {
    return this._pagina || NaN;
  }
  public async rasparCorrespondente(): Promise<this> {
    // TODO:
    // raspar a correspendencia no conteudo
    // obter posicao e definir pagina
    return this;
  }
  public obterPesquisasRelacionadas(): string[] {
    const relacionados: string[] = [];

    if (this.doc) {
      let tituloRgxIntl = [
        /^(Pesquisas|Buscas)\s(Relacionadas|)/gi,
        /^(Related|Searches)\s(Searches|Related)/gi,
      ];

      let correspondentes = escanearTextoCorrespondente(
        this.doc,
        (t) => tituloRgxIntl[0].test(t) || tituloRgxIntl[1].test(t)
      );

      if (correspondentes.length) {
        let $ = carregar(this.doc, { scriptingEnabled: false });

        // relacionados está por último na pesquisa
        let predicao = correspondentes[correspondentes.length - 1];

        if (predicao) {
          let contido = $(predicao.primeiro),
            titulo = $(predicao.ultimo);

          // TODO: extrair para funcao
          _relacionadosContainer: for (let pai of titulo.parentsUntil(contido).addBack()) {
            // procura links, do titulo acima, sobre os nodos irmaos

            _irmaosPaiTitulo: for (
              let irmao = $(pai).next(), linkRelacionados: Cheerio<ElementoCheerio>;
              irmao.length;
              irmao = irmao.next()
            ) {
              linkRelacionados = irmao.is("a") ? irmao : irmao.find("a");

              linkRelacionados.each((_, link) => {
                relacionados.push($(link).text());
              });
            }

            // só contidos do nodo pai mais proximo de titulo
            if (relacionados.length) break _relacionadosContainer;
          }
        }
 
      }
    }
    // até os 4 primeiros
    return relacionados.slice(0, 4);
  }
}
