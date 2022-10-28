import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { usePacote } from "../context/usarPacote";
import { FormEvent, useCallback, useRef, useState } from "react";

const Home: NextPage = () => {
  const {
    name: titulo,
    description: descricao,
    author: autor,
    repository: repo,
    license: licenca,
  } = usePacote();
  const urlInput = useRef<HTMLInputElement>(null);
  const [url, defUrl] = useState("");
  const [estaEnviando, defEstaEnviando] = useState(false);

  const aoEnviarForm = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!estaEnviando) {
        defEstaEnviando(true);
        const anchor = document.createElement("a");
        anchor.href = url;
        console.log(anchor.protocol, anchor.hostname, anchor.href);
        anchor.remove();

        setTimeout(() => defEstaEnviando(false), 2000);
      }
    },
    [estaEnviando, url]
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

        <div className="flex justify-center items-center flex-wrap max-w-4xl w-full">
          <div className="flex-1 m-4 p-6 text-left text-inherit no-underline border border-slate-400 rounded-xl">
            <form onSubmit={aoEnviarForm} className="w-full flex flex-col">
              <div className="flex">
                <code className="p-2 rounded-l-md font-mono text-neutral-600 bg-slate-100 border-y border-l border-slate-500">
                  {url ? "🔗" : "https://"}
                </code>
                <input
                  disabled={estaEnviando}
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
                  disabled={estaEnviando}
                >
                  ▶
                </button>
              </div>
            </form>
          </div>
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
