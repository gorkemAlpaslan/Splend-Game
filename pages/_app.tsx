import "@/styles/globals.sass";
import type { AppProps } from "next/app";
import Header from "../components/UI/header";
import Footer from "../components/UI/footer";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [showChild, setShowChild] = useState(false);
  useEffect(() => {
    setShowChild(true);
  }, []);

  if (!showChild) {
    return null;
  }

  if (typeof window === "undefined") {
    return <></>;
  } else {
    return (
      <>
        <Header />
        <Component {...pageProps} />
        <Footer />
      </>
    );
  }
}
