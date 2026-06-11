/**
 * memory.ts
 * AgentMemoryManager — Episodic & Semantic Memory for the Marketing AI Agent.
 *
 * Memory Types:
 *   - episodic:  Individual events (post published, strategy run, evaluation)
 *   - semantic:  Distilled facts/patterns about the user's account
 *   - working:   Short-lived context for the current agent cycle (in-memory only)
 *
 * Firestore Layout:
 *   agent_memory/{userId}/episodes/{episodeId}
 *   agent_memory/{userId}/semantic/{factId}
 */

import { adminDb } from "@/lib/firebase-admin";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MemoryType = "episodic" | "semantic";

export interface EpisodicMemory {
  id?: string;
  type: "episodic";
  event: string;                   // e.g. "post_published", "strategy_generated"
  data: Record<string, unknown>;   // payload of the event
  timestamp: string;
  importance: number;              // 0–10; higher = keep longer
  decayScore?: number;             // auto-computed: importance / age_days
}

export interface SemanticMemory {
  id?: string;
  type: "semantic";
  fact: string;                    // e.g. "best_platform"
  value: unknown;
  confidence: number;              // 0–100
  updatedAt: string;
  sourceEpisodes: string[];        // IDs of episodes that support this fact
}

export type AgentMemory = EpisodicMemory | SemanticMemory;

/** Short-lived, in-process context for one agent cycle */
export interface WorkingMemory {
  userId: string;
  cycleStartedAt: string;
  observations: string[];
  decisions: string[];
  pendingActions: string[];
}

// ─── Episodic Memory ─────────────────────────────────────────────────────────

const episodesCol = (userId: string) =>
  adminDb.collection("agent_memory").doc(userId).collection("episodes");

const semanticCol = (userId: string) =>
  adminDb.collection("agent_memory").doc(userId).collection("semantic");

/**
 * Records an episodic memory event for a user.
 */
export async function recordEpisode(
  userId: string,
  event: string,
  data: Record<string, unknown>,
  importance = 5
): Promise<string> {
  const episode: EpisodicMemory = {
    type: "episodic",
    event,
    data,
    timestamp: new Date().toISOString(),
    importance,
  };
  const ref = await episodesCol(userId).add(episode);
  return ref.id;
}

/**
 * Retrieves recent episodic memories, newest first.
 * Optionally filter by event type.
 */
export async function getRecentEpisodes(
  userId: string,
  limit = 20,
  eventFilter?: string
): Promise<EpisodicMemory[]> {
  let query = episodesCol(userId)
    .orderBy("timestamp", "desc")
    .limit(limit);

  const snap = await query.get();
  const episodes = snap.docs.map(d => ({ id: d.id, ...d.data() } as EpisodicMemory));

  if (eventFilter) {
    return episodes.filter(e => e.event === eventFilter);
  }
  return episodes;
}

/**
 * Applies memory decay: removes episodes older than maxAgeDays with low importance.
 * importance < threshold AND age > maxAgeDays → deleted.
 */
export async function decayEpisodes(
  userId: string,
  maxAgeDays = 30,
  importanceThreshold = 3
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);

  const snap = await episodesCol(userId)
    .where("timestamp", "<=", cutoff.toISOString())
    .where("importance", "<=", importanceThreshold)
    .get();

  const batch = adminDb.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  return snap.size;
}

// ─── Semantic Memory ─────────────────────────────────────────────────────────

/**
 * Upserts a semantic memory fact.
 * Uses the `fact` string as the document ID (normalized).
 */
export async function upsertSemanticFact(
  userId: string,
  fact: string,
  value: unknown,
  confidence: number,
  sourceEpisodeIds: string[] = []
): Promise<void> {
  const docId = fact.replace(/\s+/g, "_").toLowerCase();
  const mem: SemanticMemory = {
    type: "semantic",
    fact,
    value,
    confidence,
    updatedAt: new Date().toISOString(),
    sourceEpisodes: sourceEpisodeIds,
  };
  await semanticCol(userId).doc(docId).set(mem, { merge: true });
}

/**
 * Retrieves all semantic memories for a user.
 */
export async function getSemanticMemory(
  userId: string
): Promise<Record<string, SemanticMemory>> {
  const snap = await semanticCol(userId).get();
  const result: Record<string, SemanticMemory> = {};
  snap.docs.forEach(d => {
    result[d.id] = { id: d.id, ...d.data() } as SemanticMemory;
  });
  return result;
}

/**
 * Distills recent episodes into semantic memory facts.
 * Called after each Agent cycle to keep semantic memory fresh.
 */
export async function distillSemanticMemory(userId: string): Promise<void> {
  const episodes = await getRecentEpisodes(userId, 50);

  // --- Distill: best platform ---
  const platformEps = episodes.filter(e => e.data?.platform);
  if (platformEps.length >= 3) {
    const counts: Record<string, number> = {};
    platformEps.forEach(e => {
      const p = String(e.data.platform);
      counts[p] = (counts[p] || 0) + 1;
    });
    const bestPlatform = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (bestPlatform) {
      await upsertSemanticFact(userId, "best_platform", bestPlatform, Math.min((platformEps.length / 50) * 100, 100), platformEps.map(e => e.id!).filter(Boolean));
    }
  }

  // --- Distill: strategy count ---
  const stratEps = episodes.filter(e => e.event === "strategy_generated");
  await upsertSemanticFact(userId, "strategies_run", stratEps.length, 100, stratEps.map(e => e.id!).filter(Boolean));

  // --- Distill: avg performance delta ---
  const evalEps = episodes.filter(e => e.event === "strategy_evaluated" && typeof e.data?.performanceDelta === "number");
  if (evalEps.length > 0) {
    const avgDelta = evalEps.reduce((s, e) => s + (e.data.performanceDelta as number), 0) / evalEps.length;
    await upsertSemanticFact(userId, "avg_performance_delta", parseFloat(avgDelta.toFixed(2)), Math.min((evalEps.length / 10) * 100, 100), evalEps.map(e => e.id!).filter(Boolean));
  }
}

// ─── Working Memory ───────────────────────────────────────────────────────────

/**
 * Creates a fresh working memory context for an agent cycle.
 */
export function createWorkingMemory(userId: string): WorkingMemory {
  return {
    userId,
    cycleStartedAt: new Date().toISOString(),
    observations: [],
    decisions: [],
    pendingActions: [],
  };
}
