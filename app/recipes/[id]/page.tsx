import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let recipe;
  try {
    recipe = await prisma.recipe.findUnique({ where: { id }, include: {
      parent_recipe: { select: { id: true, title: true, author_alias: true, commit_message: true } },
      forks: { select: { id: true, title: true, author_alias: true, commit_message: true, version_tag: true, created_at: true }, orderBy: { created_at: "desc" } },
    } });
  } catch { return <main className="detail-page"><p>Recipe service is unavailable. Start PostgreSQL and retry.</p><Link href="/">Back to recipes</Link></main>; }
  if (!recipe) notFound();
  const pours = Array.isArray(recipe.pour_steps) ? recipe.pour_steps as { step: number; water_g: number; time_s: number; note: string }[] : [];
  return <main className="detail-page"><header className="detail-top"><Link href="/" className="detail-brand">← GitBean</Link><span>Recipe repository / {recipe.version_tag}</span></header><article className="detail-card"><div className="detail-kicker">{recipe.brew_method} · {recipe.roast_level} roast · @{recipe.author_alias}</div><h1>{recipe.title}</h1><p className="detail-origin">{recipe.bean_origin}</p>{recipe.parent_recipe && <p className="detail-parent">Forked from <Link href={`/recipes/${recipe.parent_recipe.id}`}>{recipe.parent_recipe.title}</Link> by @{recipe.parent_recipe.author_alias}</p>}<div className="detail-metrics"><div><small>COFFEE</small><strong>{recipe.coffee_grams} g</strong></div><div><small>WATER</small><strong>{recipe.water_grams} g</strong></div><div><small>RATIO</small><strong>{recipe.ratio}</strong></div><div><small>TEMPERATURE</small><strong>{recipe.water_temp_celsius} °C</strong></div><div><small>GRIND</small><strong>{recipe.grind_size_microns} μm</strong></div></div><h2>Pour sequence</h2><ol className="pour-list">{pours.map((pour, index) => <li key={`${pour.step}-${index}`}><b>{pour.note || `Step ${index + 1}`}</b><span>{pour.water_g} g · {pour.time_s}s</span></li>)}</ol><section className="commit-history"><h2>Commit history</h2>{recipe.parent_recipe && <div className="history-entry"><small>PARENT · @{recipe.parent_recipe.author_alias}</small><p>{recipe.parent_recipe.commit_message}</p></div>}<div className="history-entry"><small>{recipe.version_tag} · @{recipe.author_alias}</small><p>{recipe.commit_message}</p></div></section><section className="forks-section"><h2>Forks <span>{recipe.forks.length}</span></h2>{recipe.forks.length ? <div className="fork-list">{recipe.forks.map(fork => <Link href={`/recipes/${fork.id}`} key={fork.id} className="fork-link"><span><b>{fork.title}</b><small>@{fork.author_alias} · {fork.commit_message}</small></span><span className="version-pill">{fork.version_tag} →</span></Link>)}</div> : <p className="no-forks">No one has forked this recipe yet. Start a branch from the recipe browser.</p>}</section><Link href={`/?fork=${recipe.id}`} className="primary-button detail-fork">⑂ Fork this recipe</Link></article></main>;
}
