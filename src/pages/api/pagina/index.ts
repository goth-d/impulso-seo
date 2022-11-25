import type { NextApiRequest, NextApiResponse } from "next";
import { Pagina, RaspadorCliente } from "../_lib/classes";

export type Dados = {
  valido: boolean;
};

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

  const cliente = new RaspadorCliente();
  return await pagina
    .obterDocumento(cliente)
    .then(() => res.status(200).json({ valido: true }))
    .catch(() => res.status(406).json({ valido: false }));
}
