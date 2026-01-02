/* src\app\template.tsx */
import Transient from "@/components/layout/transient";

export default function Template({ children }: { children: React.ReactNode }) {
	return <Transient>{children}</Transient>;
}
