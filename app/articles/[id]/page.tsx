// app/articles/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { createClient } from "../../../src/utils/supabase/server";
import Web3Comments from "../../components/Web3Comments";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: Props) {
  const resolvedParams = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("id, title, description, content, image_url, published, created_at")
    .eq("id", resolvedParams.id)
    .eq("published", true)
    .single();

  if (!article) notFound();

  const date = article.created_at
    ? new Date(article.created_at).toISOString().split("T")[0]
    : "—";

  const { data: comments } = await supabase
    .from("comments")
    .select(
      "id, article_id, wallet_address, chain_id, content, signature, signed_message, created_at"
    )
    .eq("article_id", resolvedParams.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&family=Inter:wght@300;400;500&display=swap');

        :root {
          --green:  #00ff88;
          --green2: #00cc66;
          --dim:    #00ff8833;
          --border: #1a2a1a;
          --bg:     #050a05;
          --panel:  #070f07;
          --text:   #c8d8c8;
          --muted:  #4a6a4a;
        }

        body {
          background: var(--bg);
          color: var(--text);
        }

        .grid-bg {
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .cursor::after {
          content: '█';
          color: var(--green);
          animation: blink 1s step-end infinite;
          margin-left: 2px;
          font-size: 0.8em;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      <div className="min-h-screen grid-bg relative">
        {/* NAV */}
        <nav
          className="sticky top-0 z-50 border-b"
          style={{
            borderColor: "var(--border)",
            background: "rgba(5,10,5,0.92)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontWeight: 900,
                  fontSize: "0.85rem",
                  letterSpacing: "0.15em",
                  color: "var(--green)",
                }}
              >
                ← BACK TO DASHBOARD
              </span>
            </Link>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-12">
          {/* ARTICLE HEADER */}
          <header className="mb-12">
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "0.7rem",
                color: "var(--green)",
                letterSpacing: "0.12em",
                marginBottom: "1rem",
              }}
            >
              TRANSMISSION DATE: {date}
            </div>

            <h1
              style={{
                fontFamily: "'Orbitron', monospace",
                fontWeight: 900,
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                color: "#e8f4e8",
                lineHeight: 1.1,
                marginBottom: "1.5rem",
              }}
            >
              {article.title}
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "1.1rem",
                color: "var(--muted)",
                lineHeight: 1.6,
                borderLeft: "2px solid var(--green)",
                paddingLeft: "1rem",
              }}
            >
              {article.description}
            </p>
          </header>

          {/* COVER IMAGE */}
          {article.image_url && (
            <div className="mb-12 border border-neutral-800 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.image_url}
                alt={article.title}
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "cover",
                  display: "block",
                  filter: "brightness(0.85) contrast(1.05)",
                }}
              />
            </div>
          )}

          {/* MARKDOWN CONTENT */}
          <article
            className="prose prose-invert prose-neutral max-w-none"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </article>

          {/* WEB3 COMMENTS */}
          <Web3Comments
            articleId={resolvedParams.id}
            initialComments={comments ?? []}
          />
        </main>
      </div>
    </>
  );
}