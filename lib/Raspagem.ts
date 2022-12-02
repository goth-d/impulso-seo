import { Element as ElementoCheerio, load as carregar } from "cheerio";
import { Text as TextoDOM, Element as ElementoDOM } from "domhandler";

type NodoEscaneavel = ElementoDOM | TextoDOM;
type NodosCorrespondentes = { primeiro: ElementoCheerio; ultimo: ElementoCheerio };

/** Procura elementos pais com texto acertivo ao teste */
export function escanearTextoCorrespondente(documento: string, teste: (texto: string) => boolean) {
  const $ = carregar(documento);
  const correspondentes: NodosCorrespondentes[] = [];

  /** Varre todo documento */
  function escanearCorrespondentes(
    nodo: NodoEscaneavel,
    correspondenteAtual?: Partial<NodosCorrespondentes>
  ) {
    if (nodo.type == "tag") {
      // Elemento
      if (teste($(nodo).text()) && !correspondenteAtual?.primeiro) {
        correspondenteAtual = { primeiro: nodo };
      }

      for (let filho of $(nodo).contents()) {
        if (filho.type == "tag" || filho.type == "text") {
          if (escanearCorrespondentes(filho, correspondenteAtual)) {
            // é texto correspondente, mantem ultimo elemento pai
            if (!correspondenteAtual) correspondenteAtual = { primeiro: nodo, ultimo: nodo };
            else correspondenteAtual.ultimo = nodo;

            correspondentes.push(correspondenteAtual as NodosCorrespondentes);
          }
        }
      }
    } else if (nodo.type == "text") {
      // Texto
      return teste($(nodo).text());
    }
  }

  escanearCorrespondentes($("body").toArray()[0]);

  return correspondentes;
}
