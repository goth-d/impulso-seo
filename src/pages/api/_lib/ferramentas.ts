import { FerramentasNomes } from "../../../types";
import { FerramentaPesquisa } from "./classes";

export const Google = new FerramentaPesquisa(
  "Google",
  new URL("search", "https://google.com"),
  "q",
  "start",
  "#search"
);

export const Bing = new FerramentaPesquisa(
  "Bing",
  new URL("search", "https://bing.com"),
  "q",
  "first",
  "#main"
);

export const Yahoo = new FerramentaPesquisa(
  "Yahoo",
  new URL("search", "https://search.yahoo.com"),
  "p",
  "b",
  "#main"
);

const Ferramentas: Record<FerramentasNomes, FerramentaPesquisa> & {
  [c: string]: FerramentaPesquisa;
} = {
  Google,
  Bing,
  Yahoo,
};

export default Ferramentas;
