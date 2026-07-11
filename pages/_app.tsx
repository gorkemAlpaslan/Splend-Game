import "@/styles/globals.sass";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";

export default function App({ Component, pageProps }: AppProps) {
  const [showChild, setShowChild] = useState(false);
  useEffect(() => {
    setShowChild(true);
  }, []);

  if (!showChild) {
    return null;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
