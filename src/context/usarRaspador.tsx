import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { IRaspadorSEO } from "../types";

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

  const paginaValida = useMemo(() => true, []);
  const paginaMetadados = useMemo(() => undefined, []);
  const pesquisaMetadados = useMemo(() => undefined, []);
  const analiseSEO = useMemo(() => undefined, []);

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
