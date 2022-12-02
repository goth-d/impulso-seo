import type { NextApiRequest, NextApiResponse } from "next";
import Matriz from "../../../../lib/Matriz";
import { RelaçãoPagina } from "../../../types";
import { Pagina, Pesquisa, RaspadorCliente } from "../_lib/classes";
import { Bing, Google, Yahoo } from "../_lib/ferramentas";

export type Dados = RelaçãoPagina;

export default async function genreciador(req: NextApiRequest, res: NextApiResponse<Dados>) {
  let url: string | URL | undefined = Array.isArray(req.query.url)
      ? req.query.url[0]
      : req.query.url,
    pagina: Pagina;
  try {
    pagina = new Pagina(url as string);
  } catch {
    return res.status(400).end();
  }

  try {
    await pagina.obterDocumento();

    pagina.rasparTitulos();
    if (!pagina.titulos.length) throw new Error();

    const consultasRelacionadas: RelaçãoPagina["consultasRelacionadas"] = pagina.titulos.map(
      (t) => [t]
    );

    for (let ferramenta of [Google, Bing, Yahoo]) {
      // obtenção titulos relacionados por ordem de ferramenta de pesquisa
      let cliente = new RaspadorCliente({ origin: ferramenta.origem });

      const pesquisasMatriz = new Matriz(
        1,
        consultasRelacionadas.length,
        (_, linha) =>
          // tenta buscar relacionados para os que ainda não há
          consultasRelacionadas[linha].length == 1
            ? ferramenta
                .novaPesquisa(consultasRelacionadas[linha][_], pagina.endereco)
                .obterDocumento(cliente)
            : undefined,
        false,
        2000
      );

      for await (let { valor: pesquisa, m: i } of pesquisasMatriz) {
        if (pesquisa) {
          consultasRelacionadas[i] = consultasRelacionadas[i].concat(
            pesquisa.obterPesquisasRelacionadas()
          );
        }
      }

      // checa se obteve todos relacionados
      if (consultasRelacionadas.every((titulosRelacionados) => titulosRelacionados.length > 1))
        break;
    }

    return res
      .status(200)
      .json({ consultasRelacionadas, data: Date.now(), fonte: pagina.endereco });
  } catch (erro) {
    console.error(erro);
    return res.status(500).end();
  }
}
