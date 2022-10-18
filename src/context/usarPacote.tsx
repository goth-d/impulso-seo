import { createContext, ReactNode, useContext, useState } from "react";
import Pacote from "../../package.json";

type PacoteContextoDados = Partial<typeof Pacote>;

const PacoteContexto = createContext<PacoteContextoDados>({});

interface PacoteProvedorProps {
  children: ReactNode;
}

export function PacoteProvedor({ children }: PacoteProvedorProps) {
  const [dados, _setDados] = useState<PacoteContextoDados>(() => ({
    ...Pacote,
    name: "Impulso SEO",
  }));

  return <PacoteContexto.Provider value={dados}>{children}</PacoteContexto.Provider>;
}

export const usePacote = () => useContext(PacoteContexto);
