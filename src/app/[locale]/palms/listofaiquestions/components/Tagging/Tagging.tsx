"use client";

import React from "react";

type Props = {
  paperId: string; // can be a paper_id or a job_id when coming from LeftRail tagging batch
  searchQuery?: string;
};

type TagRow = {
  id: number;
  question_id: string;
  paper_id: string;
  job_id?: number | null;
  question?: string | null;
  direction?: string | null;
  passage?: string | null;
  notes?: string | null;
  area: string | null;
  sub_area: string | null;
  topic: string | null;
  sub_topic: string | null;
  updated_at?: string | null;
};

type TagStats = {
  total: number;
  tagged: number;
  untagged: number;
};

export default function TaggingPage({ paperId, searchQuery }: Props) {
  const [rows, setRows] = React.useState<TagRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<TagStats | null>(null);
  const [questionTexts, setQuestionTexts] = React.useState<
    Record<
      string,
      {
        question: string | null;
        direction: string | null;
        passage: string | null;
        notes: string | null;
      }
    >
  >({});

  React.useEffect(() => {
    if (!paperId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    // Heuristic: if paperId looks like a numeric id (or prefixed as extractor:<id>:tagging already trimmed by parent), use job_id
    // Always query by paper_id to show what's in tagging_questions
    const params = new URLSearchParams();
    params.set("paper_id", paperId);

    fetch(`/api/palms/tagged-questions?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const json = await r.json();
        const arr = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        const mapped = arr.map((it: any) => ({
          id: Number(it.id ?? 0),
          question_id: String(it.question_id ?? ""),
          paper_id: String(it.paper_id ?? paperId),
          job_id: typeof it.job_id === "number" ? it.job_id : it.job_id ? Number(it.job_id) : null,
          question: it.question || null,
          area: it.area ?? null,
          sub_area: it.sub_area ?? null,
          topic: it.topic ?? null,
          sub_topic: it.sub_topic ?? null,
          updated_at: it.updated_at ?? it.created_at ?? null,
          direction: it.direction ?? null,
          passage: it.passage ?? null,
          notes: it.notes ?? null,
        }));
        setRows(mapped);
        if (json?.stats) {
          setStats({
            total: json.stats.total ?? mapped.length,
            tagged: json.stats.tagged ?? 0,
            untagged: json.stats.untagged ?? 0,
          });
        } else {
          const tagged = mapped.filter(
            (it: any) => it.area && it.sub_area && it.topic && it.sub_topic
          ).length;
          setStats({
            total: mapped.length,
            tagged,
            untagged: mapped.length - tagged,
          });
        }
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setError(e?.message || "Failed to load tagging");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [paperId]);

  const filtered = React.useMemo(() => {
    const q = (searchQuery || "").toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => {
      const questionText = r.question ?? questionTexts[r.question_id]?.question;
      return [r.question_id, questionText, r.area, r.sub_area, r.topic, r.sub_topic]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, searchQuery, questionTexts]);

  React.useEffect(() => {
    if (rows.length === 0) {
      setQuestionTexts({});
      return;
    }

    const uniquePaperIds = Array.from(
      new Set(
        rows
          .map((row) => row.paper_id)
          .filter((pid): pid is string => typeof pid === "string" && pid.trim().length > 0)
      )
    );

    if (uniquePaperIds.length === 0 && !paperId) {
      setQuestionTexts({});
      return;
    }

    const papersToQuery = uniquePaperIds.length > 0 ? uniquePaperIds : paperId ? [paperId] : [];

    let cancelled = false;
    const fetchAll = async () => {
      const map: Record<
        string,
        { question: string | null; direction: string | null; passage: string | null; notes: string | null }
      > = {};

      await Promise.all(
        papersToQuery.map(async (pid) => {
          try {
            const res = await fetch(`/api/palms/extractor-questions?paper_id=${encodeURIComponent(pid)}`, {
              cache: "no-store",
            });
            if (!res.ok) return;
            const data = await res.json();
            if (!Array.isArray(data)) return;
            data.forEach((entry: any) => {
              if (!entry?.question_id) return;
              map[String(entry.question_id)] = {
                question: entry.question ?? entry.question_text ?? null,
                direction: entry.direction ?? null,
                passage: entry.passage ?? null,
                notes: entry.notes ?? null,
              };
            });
          } catch (err) {
            console.warn(`Failed to load extractor data for paper ${pid}`, err);
          }
        })
      );

      if (!cancelled) {
        setQuestionTexts(map);
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [paperId, rows]);

  if (!paperId) return <div style={{ padding: 16 }}>Select a paper</div>;
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (error) return <div style={{ padding: 16, color: "#c00" }}>{error}</div>;

  const renderTag = (label: string, value: string | null, highlight = false) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "8px 10px",
        borderRadius: 8,
        backgroundColor: highlight ? "#f0f5ff" : "#f9f9f9",
        border: highlight ? "1px solid #adc6ff" : "1px solid #f0f0f0",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: "#3f3f3f", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: value ? "#262626" : "#8c8c8c" }}>
        {value || "—"}
      </span>
    </div>
  );

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      {stats && (
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            padding: "12px 16px",
            borderRadius: 12,
            background: "#f5f9ff",
            border: "1px solid #d6e4ff",
          }}
        >
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 12, color: "#5b8ff9", textTransform: "uppercase" }}>Total</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.total}</div>
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 12, color: "#52c41a", textTransform: "uppercase" }}>Tagged</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.tagged}</div>
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 12, color: "#faad14", textTransform: "uppercase" }}>Pending</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.untagged}</div>
          </div>
        </div>
      )}

      {filtered.map((r) => {
        const info = questionTexts[r.question_id];
        const displayQuestion = r.question ?? info?.question ?? null;
        const displayDirection = r.direction ?? info?.direction ?? null;
        const displayPassage = r.passage ?? info?.passage ?? null;
        const displayNotes = r.notes ?? info?.notes ?? null;

        return (
          <div
            key={`${r.id}-${r.question_id}`}
            style={{
              border: "1px solid #f0f0f0",
              borderRadius: 12,
              padding: 16,
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                {displayQuestion ?? "Untitled question"}
              </span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#fafafa",
                  border: "1px solid #e5e5e5",
                  fontSize: 12,
                  color: "#595959",
                }}
              >
                ID: {r.question_id}
              </span>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#f1f1f1",
                  fontSize: 12,
                  color: "#555",
                }}
              >
                Paper: {r.paper_id}
              </span>
              {r.job_id && (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    fontSize: 12,
                    color: "#389e0d",
                  }}
                >
                  Job #{r.job_id}
                </span>
              )}
              {r.updated_at && (
                <span style={{ fontSize: 12, color: "#8c8c8c" }}>
                  Updated {new Date(r.updated_at).toLocaleString()}
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#262626",
                background: "#fafafa",
                border: "1px solid #f0f0f0",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 14,
              }}
            >
              {displayQuestion ?? r.question_id}
            </div>

            {(displayDirection || displayPassage || displayNotes) && (
              <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
                {displayDirection && (
                  <div style={{ fontSize: 13, color: "#555" }}>
                    <strong>Direction:</strong> {displayDirection}
                  </div>
                )}
                {displayPassage && (
                  <div style={{ fontSize: 13, color: "#555" }}>
                    <strong>Passage:</strong> {displayPassage}
                  </div>
                )}
                {displayNotes && (
                  <div style={{ fontSize: 13, color: "#555" }}>
                    <strong>Notes:</strong> {displayNotes}
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
              }}
            >
              {renderTag("Area", r.area, true)}
              {renderTag("Sub Area", r.sub_area)}
              {renderTag("Topic", r.topic)}
              {renderTag("Sub Topic", r.sub_topic)}
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && <div style={{ color: "#666" }}>No tagged questions.</div>}
    </div>
  );
}


