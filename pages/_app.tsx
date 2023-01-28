import "@/styles/globals.sass";
import type { AppProps } from "next/app";
import Header from "../components/UI/header";
import Footer from "../components/UI/footer";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </>
  );
}
