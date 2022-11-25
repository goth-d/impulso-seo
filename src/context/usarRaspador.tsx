import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { Dados as DadosPagina } from "../pages/api/pagina";
import { Dados as DadosPaginaRaspada } from "../pages/api/pagina/raspar";
import { Dados as DadosPesquisaRaspada } from "../pages/api/pesquisa";
import { AnáliseSEO, IRaspadorSEO } from "../types";

const RaspadorContexto = createContext<IRaspadorSEO>({} as IRaspadorSEO);

interface RaspadorContextoProps {
  children: ReactNode;
  // titulosTags?: HTMLHeadingElement["tagName"][]
  // posicaoReferencia?: number;
}

export function RaspadorProvedor({ children }: RaspadorContextoProps) {
  const [paginaUrl, _defPaginaUrl] = useState<string | undefined>();

  const defPaginaUrl = useCallback<IRaspadorSEO["pagina"][1]>(
    (url) => {
      if (url) {
        if (url instanceof HTMLElement) url = url.href;
        else if (url instanceof URL) url = url.toString();
      }
      if (url !== paginaUrl) _defPaginaUrl(url);
    },
    [paginaUrl]
  );

  const paginaValida: IRaspadorSEO["paginaValida"] = useMemo(
    async () =>
      paginaUrl
        ? await fetch(`api/pagina?url=${encodeURIComponent(paginaUrl)}`)
            .then((res) => res.json())
            .then((dados: DadosPagina) => (dados.valido ? paginaUrl : ""))
            .catch(() => "")
        : undefined,
    [paginaUrl]
  );

  const paginaMetadados: IRaspadorSEO["paginaMetadados"] = useMemo(async () => {
    const paginaFonte = await paginaValida;
    return paginaFonte
      ? await fetch(`api/pagina/raspar?url=${paginaValida}`)
          .then((res) => res.json())
          .then((dados: DadosPaginaRaspada) => dados)
          .catch(() => undefined)
      : undefined;
  }, [paginaValida]);

  const pesquisaMetadados: IRaspadorSEO["pesquisaMetadados"] = useMemo(async () => {
    const metadados = await paginaMetadados;
    return metadados
      ? await fetch("api/pesquisa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadados }),
        })
          .then((res) => res.json())
          .then((dados: DadosPesquisaRaspada) => dados)
          .catch(() => undefined)
      : undefined;
  }, [paginaMetadados]);

  const analiseSEO: IRaspadorSEO["analiseSEO"] = useMemo(async () => {
    const metadados = await pesquisaMetadados;
    return metadados ?
    {} as AnáliseSEO : undefined
  }, [pesquisaMetadados]);

  return (
    <RaspadorContexto.Provider
      value={{
        pagina: [paginaUrl, defPaginaUrl],
        paginaValida,
        paginaMetadados,
        pesquisaMetadados,
        analiseSEO,
      }}
    >
      {children}
    </RaspadorContexto.Provider>
  );
}

export const useRaspador = () => useContext(RaspadorContexto);
