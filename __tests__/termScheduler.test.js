import {
  getNextInterval,
  getDueDate,
  applyReview,
  getDueTerms,
  getStats,
} from '../utils/termScheduler';

describe('getNextInterval', () => {
  test('"again" always resets the interval to 1 day', () => {
    expect(getNextInterval(20, 'again')).toBe(1);
    expect(getNextInterval(0, 'again')).toBe(1);
  });

  test('first "good" review moves to 1 day', () => {
    expect(getNextInterval(0, 'good')).toBe(1);
  });

  test('"good" doubles the existing interval', () => {
    expect(getNextInterval(1, 'good')).toBe(2);
    expect(getNextInterval(2, 'good')).toBe(4);
    expect(getNextInterval(4, 'good')).toBe(8);
  });

  test('interval is capped at 30 days', () => {
    expect(getNextInterval(30, 'good')).toBe(30);
    expect(getNextInterval(16, 'good')).toBe(30); // 32 capped to 30
  });

  test('unknown performance leaves the interval unchanged', () => {
    expect(getNextInterval(5, 'maybe')).toBe(5);
  });
});

describe('getDueDate', () => {
  test('adds days within the same month', () => {
    expect(getDueDate(5, '2024-01-10')).toBe('2024-01-15');
  });

  test('rolls over to the next month', () => {
    expect(getDueDate(10, '2024-01-25')).toBe('2024-02-04');
  });

  test('handles leap year (Feb 2024)', () => {
    expect(getDueDate(29, '2024-01-31')).toBe('2024-02-29');
  });

  test('zero interval returns the same date', () => {
    expect(getDueDate(0, '2024-05-01')).toBe('2024-05-01');
  });
});

describe('applyReview', () => {
  const baseTerm = {
    id: '@term_1',
    term: 'Habeas Corpus',
    status: 'review',
    reviewCount: 2,
    intervalDays: 2,
    dueDate: '2024-01-01',
  };

  test('"good" marks the term mastered and doubles the interval', () => {
    const updated = applyReview(baseTerm, 'good', '2024-01-01');
    expect(updated.status).toBe('mastered');
    expect(updated.intervalDays).toBe(4);
    expect(updated.dueDate).toBe('2024-01-05');
    expect(updated.reviewCount).toBe(3);
    expect(updated.lastReviewedAt).toBe('2024-01-01');
  });

  test('"again" returns the term to review and resets the interval', () => {
    const updated = applyReview(baseTerm, 'again', '2024-01-01');
    expect(updated.status).toBe('review');
    expect(updated.intervalDays).toBe(1);
    expect(updated.dueDate).toBe('2024-01-02');
  });

  test('does not mutate the original term object', () => {
    applyReview(baseTerm, 'good', '2024-01-01');
    expect(baseTerm.status).toBe('review');
    expect(baseTerm.intervalDays).toBe(2);
  });
});

describe('getDueTerms', () => {
  const today = '2024-06-01';
  const terms = [
    { term: 'A', dueDate: '2024-06-01' }, // due today
    { term: 'B', dueDate: '2024-05-30' }, // overdue
    { term: 'C', dueDate: '2024-06-15' }, // future
    { term: 'D' }, // no due date
  ];

  test('returns terms due on or before today', () => {
    const due = getDueTerms(terms, today);
    expect(due.map(t => t.term)).toEqual(['A', 'B']);
  });
});

describe('getStats', () => {
  test('returns zeros for an empty list', () => {
    expect(getStats([], '2024-01-01')).toEqual({ total: 0, mastered: 0, dueToday: 0, masteredPct: 0 });
  });

  test('computes mastery percentage and due count', () => {
    const terms = [
      { status: 'mastered', dueDate: '2024-01-01' },
      { status: 'mastered', dueDate: '2024-01-01' },
      { status: 'review', dueDate: '2024-01-01' },
      { status: 'review', dueDate: '2024-12-31' },
    ];
    const stats = getStats(terms, '2024-01-01');
    expect(stats.total).toBe(4);
    expect(stats.mastered).toBe(2);
    expect(stats.dueToday).toBe(3);
    expect(stats.masteredPct).toBe(50);
  });
});
