import "../styles/globals.css";
import type { AppProps } from "next/app";
import { PacoteProvedor } from "../context/usarPacote";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PacoteProvedor>
      <Component {...pageProps} />
    </PacoteProvedor>
  );
}

export default MyApp;
