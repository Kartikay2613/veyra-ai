'use client';

import type { Task } from '@/app/lib/data';

interface TaskCardProps {
  task: Task;
  isDone: boolean;
}

export default function TaskCard({ task, isDone }: TaskCardProps) {
  return (
    <div
      id="task-card"
      className={`task-card${isDone ? ' task-card--done' : ''}`}
      style={isDone ? { animation: 'win-flash 500ms ease forwards' } : undefined}
    >
      <div className="task-card__meta">
        <div className="task-card__category-badge">
          <span className="eyebrow">{task.category}</span>
        </div>
        <div className="task-card__duration">
          <span className="text-sm">{task.duration}</span>
        </div>
      </div>

      <h2 className="text-h1">{task.title}</h2>
      <p className="task-card__description">{task.description}</p>
    </div>
  );
}
