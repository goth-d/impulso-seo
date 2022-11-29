import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Dados as DadosPagina } from "../pages/api/pagina";
import { Dados as DadosPaginaRaspada } from "../pages/api/pagina/raspar";
import { Dados as DadosPesquisasRaspada } from "../pages/api/pesquisa";
import { AnáliseSEO, IRaspadorSEO, RelaçãoPagina } from "../types";

const RaspadorContexto = createContext<IRaspadorSEO>({} as IRaspadorSEO);

interface RaspadorContextoProps {
  children: ReactNode;
  // titulosTags?: HTMLHeadingElement["tagName"][]
  // posicaoReferencia?: number;
}

export function RaspadorProvedor({ children }: RaspadorContextoProps) {
  const [paginaUrl, _defPaginaUrl] = useState<IRaspadorSEO["pagina"][0]>();
  const [estaRaspando, _defEstaRaspando] = useState<IRaspadorSEO["estaRaspando"]>();
  const [paginaValida, _defPaginaValida] = useState<IRaspadorSEO["paginaValida"]>();
  const [paginaMetadados, _defPaginaMetadados] = useState<IRaspadorSEO["paginaMetadados"]>();
  const [pesquisasMetadados, _defPesquisasMetadados] =
    useState<IRaspadorSEO["pesquisasMetadados"]>();
  const [analiseSEO, _defAnaliseSEO] = useState<IRaspadorSEO["analiseSEO"]>();

  const defPaginaUrl = useCallback<IRaspadorSEO["pagina"][1]>(
    (url) => {
      if (url) {
        if (url instanceof HTMLElement) url = url.href;
        else if (url instanceof URL) url = url.toString();
      }
      // ultimo cache checagem xP
      if (url !== paginaUrl) {
        _defPaginaUrl(url);
        _defEstaRaspando(true);
      }
    },
    [paginaUrl]
  );

  // GATILHO PAGINA VALIDA
  useEffect(() => {
    const podeComecarARaspar = estaRaspando;
    if (paginaUrl && podeComecarARaspar) {
      async function checarPagina(url: string) {
        await fetch(`api/pagina?url=${encodeURIComponent(url)}`)
          .then((res) => res.json())
          .then((dados: DadosPagina) => {
            if (dados.valido) _defPaginaValida(url);
            else throw new Error();
          })
          .catch(() => {
            _defPaginaValida("");
            _defEstaRaspando(false);
          });
      }

      checarPagina(paginaUrl);
    }
  }, [paginaUrl, estaRaspando]);

  // GATILHO PAGINA METADADOS
  useEffect(() => {
    if (paginaValida) {
      async function rasparPagina(url: string) {
        await fetch(`api/pagina/raspar?url=${url}`)
          .then((res) => res.json())
          .then((dados: DadosPaginaRaspada) => _defPaginaMetadados(dados))
          .catch(() => {
            _defPaginaMetadados(undefined);
            _defEstaRaspando(false);
          });
      }

      rasparPagina(paginaValida);
    }
  }, [paginaValida]);

  // GATILHO PESQUISAS METADADOS
  useEffect(() => {
    _defEstaRaspando(false);
    /* if (paginaMetadados) {
      async function rasparPesquisas(metadados: RelaçãoPagina) {
        await fetch("api/pesquisa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadados }),
        })
          .then((res) => res.json())
          .then((dados: DadosPesquisasRaspada) => _defPesquisasMetadados(dados))
          .catch(() => {
            _defPesquisasMetadados(undefined);
            _defEstaRaspando(false);
          });
      }

      rasparPesquisas(paginaMetadados);
    } */
  }, [paginaMetadados]);

  // GATILHO ANÁLISE SEO
  useEffect(() => {
    if (pesquisasMetadados) {
      _defAnaliseSEO({} as AnáliseSEO);
      _defEstaRaspando(false);
    }
  }, [pesquisasMetadados]);

  return (
    <RaspadorContexto.Provider
      value={{
        pagina: [paginaUrl, defPaginaUrl],
        estaRaspando,
        paginaValida,
        paginaMetadados,
        pesquisasMetadados,
        analiseSEO,
      }}
    >
      {children}
    </RaspadorContexto.Provider>
  );
}

export const useRaspador = () => useContext(RaspadorContexto);
