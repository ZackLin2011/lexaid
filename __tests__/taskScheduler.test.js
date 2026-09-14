import taskScheduler from '../utils/taskScheduler';

describe('formatDateTime / toDateString', () => {
  test('formatDateTime returns empty string for falsy input', () => {
    expect(taskScheduler.formatDateTime(null)).toBe('');
    expect(taskScheduler.formatDateTime('')).toBe('');
  });

  test('toDateString returns empty string for falsy input', () => {
    expect(taskScheduler.toDateString(null)).toBe('');
  });
});

describe('isOverdue', () => {
  const now = new Date('2024-06-15T12:00:00');

  test('a past, incomplete, non-long-term task is overdue', () => {
    const task = { dueDate: '2024-06-10T09:00:00', completed: false, isLongTerm: false };
    expect(taskScheduler.isOverdue(task, now)).toBe(true);
  });

  test('a completed task is never overdue', () => {
    const task = { dueDate: '2024-06-10T09:00:00', completed: true, isLongTerm: false };
    expect(taskScheduler.isOverdue(task, now)).toBe(false);
  });

  test('a future task is not overdue', () => {
    const task = { dueDate: '2024-06-20T09:00:00', completed: false, isLongTerm: false };
    expect(taskScheduler.isOverdue(task, now)).toBe(false);
  });

  test('a long-term task is never overdue', () => {
    const task = { dueDate: '2020-01-01T09:00:00', completed: false, isLongTerm: true };
    expect(taskScheduler.isOverdue(task, now)).toBe(false);
  });
});

describe('isDueToday', () => {
  test('matches a task scheduled today', () => {
    const now = new Date(2024, 5, 15, 10, 0, 0);
    const task = { dueDate: '2024-06-15T09:00:00', isLongTerm: false };
    expect(taskScheduler.isDueToday(task, now)).toBe(true);
  });

  test('long-term tasks are never due today', () => {
    const now = new Date(2024, 5, 15, 10, 0, 0);
    const task = { dueDate: '2024-06-15T09:00:00', isLongTerm: true };
    expect(taskScheduler.isDueToday(task, now)).toBe(false);
  });
});

describe('filterTasks', () => {
  const tasks = [
    { title: 'Draft witness statement', completed: false, isLongTerm: false, dueDate: '2024-06-10T09:00:00' }, // overdue
    { title: 'File defence', completed: false, isLongTerm: false, dueDate: '2030-01-01T09:00:00' }, // upcoming
    { title: 'Review report', completed: true, isLongTerm: false, dueDate: '2024-01-01T09:00:00' }, // completed
    { title: 'CPD planning', completed: false, isLongTerm: true }, // long-term
  ];

  test('no filter returns all normal tasks plus long-term', () => {
    const result = taskScheduler.filterTasks(tasks, { query: '', status: 'all', date: null });
    expect(result).toHaveLength(4);
  });

  test('status=completed returns only completed tasks', () => {
    const result = taskScheduler.filterTasks(tasks, { query: '', status: 'completed', date: null });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Review report');
  });

  test('status=overdue returns only overdue tasks', () => {
    const result = taskScheduler.filterTasks(tasks, { query: '', status: 'overdue', date: null });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Draft witness statement');
  });

  test('query filters by title (case-insensitive)', () => {
    const result = taskScheduler.filterTasks(tasks, { query: 'defence', status: 'all', date: null });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('File defence');
  });

  test('date filter excludes long-term tasks', () => {
    const result = taskScheduler.filterTasks(tasks, { query: '', status: 'all', date: '2030-01-01' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('File defence');
  });
});

describe('getTasksForDate', () => {
  const tasks = [
    { dueDate: '2024-06-10T09:00:00', isLongTerm: false },
    { dueDate: '2024-06-10T15:00:00', isLongTerm: false },
    { dueDate: '2024-06-11T09:00:00', isLongTerm: false },
    { dueDate: '2024-06-10T09:00:00', isLongTerm: true },
  ];

  test('returns all tasks on a date, excluding long-term ones', () => {
    const result = taskScheduler.getTasksForDate(tasks, '2024-06-10');
    expect(result).toHaveLength(2);
  });
});

describe('getMarkedDates', () => {
  test('marks due dates blue and overdue dates red', () => {
    const today = new Date('2024-06-15T12:00:00');
    const tasks = [
      { dueDate: '2024-06-10T09:00:00', isLongTerm: false }, // overdue -> red
      { dueDate: '2030-01-01T09:00:00', isLongTerm: false }, // future -> blue
      { dueDate: '2024-06-10T15:00:00', isLongTerm: false }, // same overdue day
      { isLongTerm: true }, // ignored
    ];
    const marked = taskScheduler.getMarkedDates(tasks, today);
    expect(marked['2024-06-10'].dotColor).toBe('#FF453A');
    expect(marked['2030-01-01'].dotColor).toBe('#007AFF');
  });
});
