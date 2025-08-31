// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "./lib/authContext";
import NotificationContainer from "./components/NotificationContainer";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <NotificationContainer />
    </AuthProvider>
  );
}
