import { catalog } from '../../content/catalog.ts';
import type { ProblemSolvingConfig, ChecklistTask } from '../../data/architecture/entities';
import type { ProblemProgress } from '../../data/model';

export function problemRoute(
  task: ChecklistTask,
  config: ProblemSolvingConfig = catalog.problemSolving,
) {
  return (task.problemSolving ?? config?.default ?? []).map((id) => ({
    id,
    ...config.stages[id],
  }));
}
export function problemStatus(task: ChecklistTask, progress?: ProblemProgress) {
  if (!progress) return 'Проблема?';
  if (progress.resolved) return 'Решено · История';
  if (progress.waiting) return 'Ожидается ответ';
  const last = problemRoute(task)
    .filter((step) => progress.completed.includes(step.id))
    .at(-1);
  return last ? 'В процессе · ' + last.completedLabel : 'В процессе · Решение проблемы';
}

/** Undo one navigation or completion without touching notes or complaint drafts. */
export function previousProblemProgress(progress: ProblemProgress): ProblemProgress {
  if (progress.resolved) return { ...progress, resolved: false };
  if (progress.waiting) return { ...progress, waiting: false };
  if (progress.reviewing)
    return { ...progress, completed: progress.completed.slice(0, -1), reviewing: false };
  return { ...progress, reviewing: progress.completed.length > 0 };
}
