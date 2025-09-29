import Sidebar from "../components/layout/sidebar";
import Header from "../components/layout/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row w-dvw h-dvh">
      <Sidebar />
      <main className="flex flex-1 justify-center items-center w-full h-dvh flex-col">
        <Header />
        <article className="flex flex-1 flex-col p-8 w-full max-w-224 h-full">{children}</article>
      </main>
    </div>
  );
}