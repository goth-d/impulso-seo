import type { NextApiRequest, NextApiResponse } from "next";
import { RelaçãoPagina } from "../../../types";
import { Pagina, Pesquisa, RaspadorCliente } from "../_lib/classes";
import { Google } from "../_lib/ferramentas";

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
    let cliente = new RaspadorCliente();

    await pagina.obterDocumento();
    try {
      await pagina.rasparTitulos();
    } catch (e) {
      if (e instanceof Error) console.log(e.message);
    }

    const consultasRelacionadas: RelaçãoPagina["consultasRelacionadas"] = [];
    if (pagina.titulos.length) {
      /** obtenção relacionados */
      cliente = new RaspadorCliente({ origin: Google.origem });
      let pesquisa: Pesquisa;
      for (let i = 0; i < pagina.titulos.length; i++) {
        pesquisa = Google.novaPesquisa(pagina.titulos[i], pagina.endereco);
        await pesquisa.obterDocumento(cliente);
        consultasRelacionadas[i] = [pagina.titulos[i], ...(await pesquisa.obterRelacionados())];
      }
    }

    return res
      .status(200)
      .json({ consultasRelacionadas, data: Date.now(), fonte: pagina.endereco });
  } catch (erro) {
    return res.status(500).end();
  }
}
