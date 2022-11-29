import type { NextApiRequest, NextApiResponse } from "next";
import Matriz from "../../../../lib/Matriz";
import { FerramentasNomes, IPesquisa, RelaçãoPagina, RelaçãoPesquisas } from "../../../types";
import { Pesquisa, RaspadorCliente } from "../_lib/classes";
import ferramentas from "../_lib/ferramentas";

export type Dados = RelaçãoPesquisas;

export default async function genreciador(req: NextApiRequest, res: NextApiResponse<Dados>) {
  const metadados: RelaçãoPagina = req.body.titulos;

  if (
    Array.isArray(metadados.consultasRelacionadas) &&
    metadados.consultasRelacionadas.every(
      (titulos) =>
        Array.isArray(titulos) &&
        titulos.length <= 10 &&
        titulos.every((titulo) => typeof titulo == "string" && titulo.length <= 100)
    )
  ) {
    const mLargura = metadados.consultasRelacionadas.reduce(
        (tMax, t) => (tMax > t.length ? tMax : t.length),
        0
      ),
      mAltura = metadados.consultasRelacionadas.length;

    const pesquisas = Object.entries(ferramentas).reduce((obj, [fNome, ferramenta]) => {
      obj[fNome] = new Matriz(
        mLargura,
        mAltura,
        (x, y) =>
          ferramenta
            .novaPesquisa(metadados.consultasRelacionadas[y][x], metadados.fonte)
            ?.obterDocumento(),
        false,
        2000,
        4000
      );
      return obj;
    }, {} as { [c: string]: Matriz<Promise<Pesquisa> | undefined> });

    let registrosPesquisas = {} as Record<
      FerramentasNomes,
      Array<Pick<IPesquisa, "posicao" | "pagina">[]>
    >;
    let cliente: RaspadorCliente;
    let registrosPesquisaFerramenta: Matriz<Pick<IPesquisa, "pagina" | "posicao">>;

    for (const [fNome, matrizPesquisas] of Object.entries(pesquisas)) {
      cliente = new RaspadorCliente({ origin: ferramentas[fNome].origem });
      registrosPesquisaFerramenta = new Matriz(mLargura, mAltura);

      for await (const { n, m, valor: pesquisa } of matrizPesquisas) {
        if (pesquisa) {
          await pesquisa.rasparCorrespondente();
          registrosPesquisaFerramenta.definir(n, m, {
            pagina: pesquisa.pagina,
            posicao: pesquisa.posicao,
          });
        }
      }

      registrosPesquisas[fNome as FerramentasNomes] = registrosPesquisaFerramenta.array2D;
    }

    return res.status(200).json({ registrosPesquisas, data: Date.now() });
  } else return res.status(400).end();
}
