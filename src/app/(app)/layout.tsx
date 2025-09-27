import Sidebar from "../components/layout/sidebar";
import Header from "../components/layout/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row w-dvw h-dvh">
      <Sidebar />
      <main className="flex flex-1 w-full h-dvh flex-col">
        <Header />
        <article className="relative flex flex-1 p-4">{children}</article>
      </main>
    </div>
  );
}