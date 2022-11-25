import "../styles/globals.css";
import type { AppProps } from "next/app";
import { PacoteProvedor } from "../context/usarPacote";
import { RaspadorProvedor } from "../context/usarRaspador";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PacoteProvedor>
      <RaspadorProvedor>
        <Component {...pageProps} />
      </RaspadorProvedor>
    </PacoteProvedor>
  );
}

export default MyApp;
