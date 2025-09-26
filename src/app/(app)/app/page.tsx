import Image from "next/image";
import "./page.module.css";
import Sidebar from "../../components/layout/sidebar";
import Header from "../../components/layout/header";

export default function App() {
  return (
    <>
      <div className="flex flex-row w-dvw h-dvh">
        <Sidebar />
        <main className="flex flex-1 w-full h-dvh">
          <Header />
        </main>
      </div>
    </>
  );
}
