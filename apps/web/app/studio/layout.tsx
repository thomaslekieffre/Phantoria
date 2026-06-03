import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStudioAdmin } from "@/lib/studio/admin";
import "./studio.css";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const auth = await requireStudioAdmin(supabase);

  if (!auth.ok) {
    if (auth.status === 401) redirect("/login?next=/studio");
    redirect("/");
  }

  return (
    <div className="studio">
      <header className="studio__header">
        <div>
          <p className="studio__kicker">Phantoria Studio</p>
          <h1 className="studio__title">Dashboard dev</h1>
        </div>
        <Link href="/" className="studio__back">
          ← Jeu
        </Link>
      </header>
      <nav className="studio__nav" aria-label="Studio">
        <Link href="/studio" className="studio__nav-link">
          Accueil
        </Link>
        <Link href="/studio/events" className="studio__nav-link">
          Events hub
        </Link>
      </nav>
      <main className="studio__main">{children}</main>
    </div>
  );
}
