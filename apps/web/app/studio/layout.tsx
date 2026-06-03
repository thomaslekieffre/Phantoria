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
          <h1 className="studio__title">Game Content Manager</h1>
        </div>
        <Link href="/" className="studio__back">
          ← Retour au jeu
        </Link>
      </header>
      <nav className="studio__nav" aria-label="Studio">
        <Link href="/studio" className="studio__nav-link">
          🏠 Accueil
        </Link>
        <Link href="/studio/events" className="studio__nav-link">
          🎉 Events
        </Link>
        <Link href="/studio/spirits" className="studio__nav-link">
          👻 Esprits
        </Link>
        <Link href="/studio/story" className="studio__nav-link">
          📖 Histoire
        </Link>
        <Link href="/studio/gacha" className="studio__nav-link">
          🎰 Gacha
        </Link>
        <Link href="/studio/rewards" className="studio__nav-link">
          ✨ Reliques
        </Link>
      </nav>
      <main className="studio__main">{children}</main>
    </div>
  );
}
