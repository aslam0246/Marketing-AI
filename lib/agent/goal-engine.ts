/**
 * goal-engine.ts
 * GoalEngine — Manages agent goals, sub-goals, and progress tracking.
 *
 * Goals flow:
 *   pending → in_progress → completed | failed | cancelled
 *
 * Firestore Layout:
 *   agent_goals/{userId}/goals/{goalId}
 */

import { adminDb } from "@/lib/firebase-admin";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GoalStatus = "pending" | "in_progress" | "completed" | "failed" | "cancelled";
export type GoalPriority = "critical" | "high" | "medium" | "low";

export interface AgentGoal {
  id?: string;
  userId: string;
  title: string;
  description: string;
  priority: GoalPriority;
  status: GoalStatus;
  progress: number;             // 0–100
  subGoals: SubGoal[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deadline?: string;
  metadata?: Record<string, unknown>;
  blockedBy?: string[];         // IDs of blocking goals
  parentGoalId?: string;        // for nested goals
}

export interface SubGoal {
  id: string;
  title: string;
  status: GoalStatus;
  completedAt?: string;
}

// ─── Firestore Helpers ────────────────────────────────────────────────────────

const goalsCol = (userId: string) =>
  adminDb.collection("agent_goals").doc(userId).collection("goals");

// ─── Goal CRUD ────────────────────────────────────────────────────────────────

/**
 * Creates a new goal for the user.
 */
export async function createGoal(
  userId: string,
  input: Omit<AgentGoal, "id" | "userId" | "createdAt" | "updatedAt" | "status" | "progress">
): Promise<AgentGoal> {
  const now = new Date().toISOString();
  const goal: AgentGoal = {
    ...input,
    userId,
    status: "pending",
    progress: 0,
    subGoals: input.subGoals ?? [],
    createdAt: now,
    updatedAt: now,
  };
  const ref = await goalsCol(userId).add(goal);
  return { id: ref.id, ...goal };
}

/**
 * Retrieves all goals for a user, optionally filtered by status.
 */
export async function getGoals(
  userId: string,
  statusFilter?: GoalStatus
): Promise<AgentGoal[]> {
  let query = goalsCol(userId).orderBy("createdAt", "desc");
  const snap = await query.get();
  const goals = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgentGoal));
  if (statusFilter) return goals.filter(g => g.status === statusFilter);
  return goals;
}

/**
 * Updates goal status, progress, and sub-goal state.
 * Auto-marks parent goal completed when all sub-goals done.
 */
export async function updateGoalProgress(
  userId: string,
  goalId: string,
  updates: Partial<Pick<AgentGoal, "status" | "progress" | "subGoals" | "metadata">>
): Promise<AgentGoal> {
  const ref = goalsCol(userId).doc(goalId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Goal ${goalId} not found`);

  const current = snap.data() as AgentGoal;
  const now = new Date().toISOString();

  // Auto-compute progress from sub-goals if they exist
  let progress = updates.progress ?? current.progress;
  const subGoals = updates.subGoals ?? current.subGoals;

  if (subGoals.length > 0) {
    const completed = subGoals.filter(s => s.status === "completed").length;
    progress = Math.round((completed / subGoals.length) * 100);
  }

  // Auto-complete when progress reaches 100
  let status = updates.status ?? current.status;
  if (progress >= 100 && status === "in_progress") status = "completed";

  const patch: Partial<AgentGoal> = {
    ...updates,
    progress,
    status,
    updatedAt: now,
    ...(status === "completed" ? { completedAt: now } : {}),
    subGoals,
  };

  await ref.update(patch);
  return { id: goalId, ...current, ...patch };
}

/**
 * Marks a specific sub-goal as completed within a goal.
 */
export async function completeSubGoal(
  userId: string,
  goalId: string,
  subGoalId: string
): Promise<AgentGoal> {
  const ref = goalsCol(userId).doc(goalId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Goal ${goalId} not found`);

  const current = snap.data() as AgentGoal;
  const subGoals = current.subGoals.map(sg =>
    sg.id === subGoalId
      ? { ...sg, status: "completed" as GoalStatus, completedAt: new Date().toISOString() }
      : sg
  );

  return updateGoalProgress(userId, goalId, { subGoals });
}

/**
 * Seeds default weekly goals for a new agent cycle.
 */
export async function seedWeeklyGoals(userId: string): Promise<AgentGoal[]> {
  const existingActive = await getGoals(userId, "in_progress");
  if (existingActive.length > 0) return existingActive; // don't re-seed

  const weeklyGoals: Parameters<typeof createGoal>[1][] = [
    {
      title: "Observe & Enrich Posts",
      description: "Scan all published posts and compute engagement scores, categories, and hashtags.",
      priority: "critical",
      subGoals: [
        { id: "obs-1", title: "Fetch published posts", status: "pending" },
        { id: "obs-2", title: "Compute engagement scores", status: "pending" },
        { id: "obs-3", title: "Detect content categories", status: "pending" },
        { id: "obs-4", title: "Extract hashtags", status: "pending" },
      ],
    },
    {
      title: "Analyze Engagement Patterns",
      description: "Find best posting hour, tone, platform, and content category.",
      priority: "high",
      subGoals: [
        { id: "ana-1", title: "Group by hour & compute averages", status: "pending" },
        { id: "ana-2", title: "Detect engagement trend", status: "pending" },
        { id: "ana-3", title: "Rank top hashtags", status: "pending" },
        { id: "ana-4", title: "Write insights to Firestore", status: "pending" },
      ],
    },
    {
      title: "Generate Weekly Strategy",
      description: "Plan optimal post times, content mix, tone, and hashtags for the week.",
      priority: "high",
      subGoals: [
        { id: "pln-1", title: "Load adaptive weights", status: "pending" },
        { id: "pln-2", title: "Compute weighted best times", status: "pending" },
        { id: "pln-3", title: "Build content mix ratios", status: "pending" },
        { id: "pln-4", title: "Write strategy to Firestore", status: "pending" },
      ],
    },
    {
      title: "Evaluate Last Week Strategy",
      description: "Compare predicted vs actual performance and update adaptive weights.",
      priority: "medium",
      subGoals: [
        { id: "eva-1", title: "Fetch active strategy", status: "pending" },
        { id: "eva-2", title: "Aggregate actual metrics", status: "pending" },
        { id: "eva-3", title: "Compute performance delta", status: "pending" },
        { id: "eva-4", title: "Update adaptive weights", status: "pending" },
      ],
    },
    {
      title: "Update Agent Memory",
      description: "Distill new semantic memories and prune stale episodic data.",
      priority: "low",
      subGoals: [
        { id: "mem-1", title: "Record cycle episodes", status: "pending" },
        { id: "mem-2", title: "Distill semantic facts", status: "pending" },
        { id: "mem-3", title: "Decay old episodes", status: "pending" },
      ],
    },
  ];

  const created = await Promise.all(
    weeklyGoals.map(g => createGoal(userId, g))
  );
  return created;
}

/**
 * Returns a summary of goal progress for dashboards.
 */
export async function getGoalSummary(userId: string): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  failed: number;
  overallProgress: number;
}> {
  const goals = await getGoals(userId);
  const total = goals.length;
  const completed = goals.filter(g => g.status === "completed").length;
  const inProgress = goals.filter(g => g.status === "in_progress").length;
  const pending = goals.filter(g => g.status === "pending").length;
  const failed = goals.filter(g => g.status === "failed").length;
  const overallProgress = total > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / total) : 0;
  return { total, completed, inProgress, pending, failed, overallProgress };
}
