import { Cheerio, CheerioAPI, Element as ElementoCheerio } from "cheerio";
import { Text as TextoDOM, Element as ElementoDOM } from "domhandler";

type NodoEscaneavel = ElementoDOM | TextoDOM;
type NodosCorrespondentes = {
  primeiro: Cheerio<ElementoCheerio>;
  ultimo: Cheerio<ElementoCheerio>;
};

/** Procura elementos pais com texto acertivo ao teste */
export function escanearTextoCorrespondente(ctx: CheerioAPI, teste: (texto: string) => boolean) {
  const correspondentes: NodosCorrespondentes[][] = [];

  /** Varre todo documento */
  function escanearCorrespondentes(
    nodo: NodoEscaneavel,
    correspondenteAtual?: NodosCorrespondentes,
    correspondenteIndex?: number
  ) {
    if (nodo.type == "tag") {
      // Elemento
      if (teste(ctx(nodo).text())) {
        let nodoCheerio = ctx(nodo);
        if (!correspondenteAtual) {
          // cria novo array para o primeiro match
          correspondenteIndex = correspondentes.length;
          correspondentes[correspondenteIndex] = [];

          correspondenteAtual = { primeiro: nodoCheerio, ultimo: nodoCheerio };
        }
        // atualiza o ultimo
        else correspondenteAtual.ultimo = nodoCheerio;
      }

      for (let filho of ctx(nodo).contents()) {
        if (filho.type == "tag" || filho.type == "text") {
          escanearCorrespondentes(filho, correspondenteAtual, correspondenteIndex);
        }
      }
    } else if (nodo.type == "text") {
      // Texto
      if (teste(ctx(nodo).text())) {
        let paiTexto = ctx(nodo).parent();
        // texto nodos são sempre folhas

        if (correspondenteAtual && typeof correspondenteIndex == "number") {
          if (!correspondentes[correspondenteIndex].some((nodos) => paiTexto.is(nodos.ultimo)))
            correspondentes[correspondenteIndex].push({ ...correspondenteAtual, ultimo: paiTexto });
        } else {
          // deu match unicamente no texto
          correspondentes.push([{ primeiro: paiTexto, ultimo: paiTexto }]);
        }
      } else if (correspondenteAtual && typeof correspondenteIndex == "number") {
        // há um correspondente previo testado em elemento pai
        if (
          !correspondentes[correspondenteIndex].some((nodos) =>
            correspondenteAtual?.ultimo.is(nodos.ultimo)
          )
        )
          correspondentes[correspondenteIndex].push(correspondenteAtual);
      }
    }
  }

  escanearCorrespondentes(ctx("body")[0]);

  return correspondentes;
}

export function insinuarListasCongruentes(ctx: CheerioAPI, conteudo: ElementoCheerio) {
  let conjuntoConteudo = ctx(conteudo),
    listas: Array<Cheerio<ElementoCheerio>[]> = [];

  // raspa lista de conjuntos com mesmo parent para cada conteudo
  let itemIndex = 0;
  for (let item of conjuntoConteudo) {
    // define o nodo que contém o item, e seletores especificos do item
    let container = ctx(item),
      tag = item.tagName,
      classes = container.attr("class")?.trim().split(" "),
      role = container.attr("role"),
      dataProps = Object.keys(container.data()),
      seletorClasses = classes ? "." + classes.join(".") : "",
      seletorProps = `${tag}${role ? `[${role}]` : ""}${
        dataProps.length ? dataProps.map((d) => `[data-${d}]`).join("") : ""
      }`,
      seletorEspecifico = "";

    for (
      let pai = container.parent(), lista: Cheerio<ElementoCheerio>;
      pai.length;
      container = pai, pai = pai.parent()
    ) {
      // checa se cada pai tem filhos que contem o mesmo item

      if (seletorEspecifico) {
        if ((lista = pai.filter(`:has(${seletorEspecifico})`).not(container)) && lista.length) {
          // adiciona a lista o conjunto
          listas[itemIndex].push(lista);
        }
      } else {
        // inicia uma lista de conjuntos no index do item
        // define um seletor a ser usado por seguinte
        if (
          seletorClasses &&
          (lista = pai.filter(`:has(${seletorClasses})`).not(container)) &&
          lista.length
        ) {
          if (!listas[itemIndex]) listas[itemIndex] = [];
          seletorEspecifico = seletorClasses;
          listas[itemIndex].push(lista);
        } else if ((lista = pai.filter(`:has(${seletorProps})`).not(container)) && lista.length) {
          if (!listas[itemIndex]) listas[itemIndex] = [];
          seletorEspecifico = seletorProps;
          listas[itemIndex].push(lista);
        }
      }
    }

    // um dos itens não está contido em outro nodo
    if (!listas[itemIndex]) return [];

    itemIndex++;
  }

  // reduz todas listas para conjuntos com pai comum
  let listaIndex = 0;
  let listaIntersecaoUniao: Array<[Cheerio<ElementoCheerio>, Cheerio<ElementoCheerio>]> = [];

  for (let conjunto of listas[0]) {
    let paiConjunto = conjunto.parent();
    // procura pai comum entre as listas
    caudaListas: for (let listasCauda of listas.slice(1)) {
      // cria interseção e união de conjuntos com as listas restantes (obtidas de cada conteudo)
      let conjuntoIntersecaoUniao:
        | [Cheerio<ElementoCheerio>, Cheerio<ElementoCheerio>]
        | undefined = undefined;

      caudaConjuntos: for (let conjuntoCauda of listasCauda) {
        if (conjuntoCauda.parent().is(paiConjunto)) {
          conjuntoIntersecaoUniao = [
            // interseção conjunto congruente (itens contendo todo conteudo)
            conjunto.filter(conjuntoCauda),
            // união conjunto parcial (com conteudo parcial junto)
            conjunto.add(conjuntoCauda),
          ];
          // não há outro parent identico, continua às listas
          break caudaConjuntos;
        }
      }
      if (!conjuntoIntersecaoUniao) {
        // se não tiver encontrado pai comum entre os conjuntos então cancela união do mesmo parent
        delete listaIntersecaoUniao[listaIndex];
        break caudaListas;
      } else {
        if (!listaIntersecaoUniao[listaIndex])
          listaIntersecaoUniao[listaIndex] = conjuntoIntersecaoUniao;
        else
          listaIntersecaoUniao[listaIndex] = [
            listaIntersecaoUniao[listaIndex][0].filter(conjuntoIntersecaoUniao[0]),
            listaIntersecaoUniao[listaIndex][1].add(conjuntoIntersecaoUniao[1]),
          ];
      }
    }

    listaIndex++;
  }

  // remove listas cancelada <empty>
  return listas.filter((lista) => !!lista);
}
