import "@/styles/globals.sass";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
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
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}
