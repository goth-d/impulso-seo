import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { usePacote } from "../context/usarPacote";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRaspador } from "../context/usarRaspador";

const Home: NextPage = () => {
  const {
    name: titulo,
    description: descricao,
    author: autor,
    repository: repo,
    license: licenca,
  } = usePacote();
  const Raspador = useRaspador();

  const urlInput = useRef<HTMLInputElement>(null);
  const [url, defUrl] = useState("");

  const aoEnviarForm = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!Raspador.estaRaspando) {
        const anchor = document.createElement("a");
        anchor.href = url;

        Raspador.pagina[1](anchor.href);
        // o estado do contexto é atualizado primeiro que do component, em estaEnviando

        anchor.remove();
      }
    },
    [url, Raspador]
  );

  return (
    <div className="px-8">
      <Head>
        <title>{titulo}</title>
        <meta name="description" content={descricao} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen py-16 flex-1 flex flex-col justify-center items-center">
        <h1 className="text-xl leading-tight font-bold m-0 text-center text-transparent bg-clip-text from-sky-500 to-emerald-400 bg-gradient-to-l">
          <Link href="/" passHref>
            <a
              tabIndex={-1}
              className="no-underline hover:underline active:underline focus:underline"
            >
              {titulo}
            </a>
          </Link>
        </h1>

        <div className="flex justify-center flex-col max-w-4xl w-full">
          <div className="flex-1 m-4 p-6 text-left text-inherit no-underline border border-slate-400 rounded-xl">
            <form onSubmit={aoEnviarForm} className="w-full flex flex-col">
              <div className="flex">
                <code className="p-2 rounded-l-md font-mono text-neutral-600 bg-slate-100 border-y border-l border-slate-500">
                  {url ? "🔗" : "https://"}
                </code>
                <input
                  disabled={!!Raspador.estaRaspando}
                  ref={urlInput}
                  className="w-full px-2 font-mono border-y border-slate-500 focus-visible:outline-non disabled:bg-slate-100 disabled:text-neutral-600"
                  type="url"
                  title="Insira um endereço da web"
                  placeholder="URL"
                  value={url}
                  onChange={(e) => defUrl(e.currentTarget.value)}
                  pattern="^(http|https)://.*$"
                  required
                />
                <button
                  className="px-3 border-y border-r rounded-r-md border-slate-500 bg-slate-300 hover:bg-slate-400 active:bg-slate-500 text-neutral-700 active:text-neutral-800
                  disabled:bg-slate-300 disabled:text-neutral-400"
                  type="submit"
                  disabled={!!Raspador.estaRaspando}
                >
                  ▶
                </button>
              </div>
            </form>
          </div>
          {!!Raspador.paginaValida && (
            <div className="flex-1 flex flex-col-reverse m-4 p-6 text-left text-inherit no-underline border border-slate-400 rounded-xl">
              <div className="mx-auto">{Raspador.paginaValida}</div>
              <div className="mx-auto">✔</div>
              {Raspador.paginaMetadados && (
                <>
                  <div className="mx-auto">
                    {Raspador.paginaMetadados.consultasRelacionadas.map((titulo, i) => (
                      <div key={titulo[0] + i} className="mx-auto">
                        ◼
                        {titulo.map((relacionado, j) => (
                          <span
                            key={relacionado + i + j}
                            className={j ? "italic" : "font-semibold"}
                          >{`${j ? " " : ""}${relacionado}${
                            j == titulo.length - 1 ? "" : " ▪"
                          }`}</span>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="mx-auto">
                    {new Date(Raspador.paginaMetadados.data).toLocaleString()}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="flex justify-center items-center flex-1 py-8 border-t border-t-slate-400">
        <div>📜 {licenca}</div>

        <div className="flex justify-center items-center flex-grow">
          <a href={repo?.url} target="_blank" rel="noopener noreferrer">
            📓 {repo?.type}
          </a>
        </div>

        <a href={autor?.url} target="_blank" rel="noopener noreferrer">
          🖤 {autor?.name}
        </a>
      </footer>
    </div>
  );
};

export default Home;
