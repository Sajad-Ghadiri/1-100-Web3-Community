"use client";

import { FormEvent, useMemo, useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useSignMessage } from "wagmi";
import { createClient } from "../../src/utils/supabase/client";

type CommentRow = {
  id: string;
  article_id: string;
  wallet_address: string;
  chain_id: number | null;
  content: string;
  signature: string | null;
  signed_message: string | null;
  created_at: string;
};

export default function Web3Comments({
  articleId,
  initialComments = [],
}: {
  articleId: string;
  initialComments?: CommentRow[];
}) {
  const supabase = useMemo(() => createClient(), []);

  const { address, isConnected, chainId } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();

  const [comments, setComments] = useState<CommentRow[]>(initialComments);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!isConnected || !address) {
      setStatus("CONNECT_WALLET_REQUIRED");
      return;
    }

    if (!trimmed) {
      setStatus("EMPTY_COMMENT_REJECTED");
      return;
    }

    if (trimmed.length > 1200) {
      setStatus("COMMENT_TOO_LONG_MAX_1200");
      return;
    }

    setIsSubmitting(true);
    setStatus("AWAITING_SIGNATURE");

    try {
      const signedMessage = [
        "On-Chain Entropy Comment",
        `Article: ${articleId}`,
        `Wallet: ${address}`,
        `Chain ID: ${chainId ?? "unknown"}`,
        `Content: ${trimmed}`,
        `Timestamp: ${new Date().toISOString()}`,
      ].join("\n");

      const signature = await signMessageAsync({
        message: signedMessage,
      });

      setStatus("BROADCASTING_TO_DATABASE");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          article_id: articleId,
          wallet_address: address.toLowerCase(),
          chain_id: chainId ?? null,
          content: trimmed,
          signature,
          signed_message: signedMessage,
        })
        .select(
          "id, article_id, wallet_address, chain_id, content, signature, signed_message, created_at"
        )
        .single();

      if (error) throw error;

      setComments((current) => [data as CommentRow, ...current]);
      setContent("");
      setStatus("COMMENT_COMMITTED");
    } catch (error) {
      console.error(error);
      setStatus("TRANSACTION_FAILED_OR_REJECTED");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="web3-comments-shell" dir="ltr">
      <div className="web3-comments-header">
        <div>
          <p className="terminal-kicker">[03] WEB3_COMMENT_MODULE</p>
          <h2 className="terminal-title">IMMUTABLE COMMENT LOG</h2>
          <p className="terminal-subtitle">
            Connect wallet, sign your comment, and commit it to the article log.
          </p>
        </div>

        <ConnectKitButton.Custom>
          {({ show, isConnected, truncatedAddress, ensName }) => (
            <button
              type="button"
              onClick={show}
              className="terminal-wallet-button"
            >
              {isConnected
                ? `CONNECTED: ${ensName ?? truncatedAddress}`
                : "CONNECT_WALLET"}
            </button>
          )}
        </ConnectKitButton.Custom>
      </div>

      <form onSubmit={handleSubmit} className="web3-comment-form">
        <label className="terminal-label" htmlFor="comment">
          $ comment.new
        </label>

        <textarea
          id="comment"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={!isConnected || isSubmitting || isSigning}
          placeholder={
            isConnected
              ? "Write a signed wallet comment..."
              : "Connect wallet to unlock comment input..."
          }
          className="terminal-textarea"
          maxLength={1200}
        />

        <div className="web3-comment-actions">
          <span className="terminal-status">
            STATUS: {status ?? (isConnected ? "WALLET_READY" : "DISCONNECTED")}
          </span>

          <button
            type="submit"
            disabled={!isConnected || isSubmitting || isSigning}
            className="terminal-submit-button"
          >
            {isSubmitting || isSigning ? "SIGNING..." : "SIGN_AND_COMMIT"}
          </button>
        </div>
      </form>

      <div className="web3-comment-list">
        {comments.length === 0 ? (
          <div className="terminal-empty">$ NO_COMMENTS_INDEXED</div>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="terminal-comment-card">
              <div className="terminal-comment-meta">
                <span>
                  WALLET: {comment.wallet_address.slice(0, 6)}...
                  {comment.wallet_address.slice(-4)}
                </span>
                <span>{new Date(comment.created_at).toISOString()}</span>
              </div>

              <p className="terminal-comment-content">{comment.content}</p>

              {comment.signature && (
                <details className="terminal-proof">
                  <summary>VIEW_SIGNATURE_PROOF</summary>
                  <code>{comment.signature}</code>
                </details>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}