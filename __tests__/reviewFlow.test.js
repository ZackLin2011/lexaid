import { getDueTerms, applyReview } from '../utils/termScheduler';

// integration-ish test: fake a user going through the spaced repetition
// deck, like what happens in the Card Review screen.
describe('spaced repetition review flow', () => {
  test('a term due today is reviewed, rescheduled, then no longer due', () => {
    let term = {
      id: '@term_hc',
      term: 'Habeas Corpus',
      status: 'review',
      reviewCount: 0,
      intervalDays: 0,
      dueDate: '2024-01-01',
    };
    const t0 = '2024-01-01';

    // due at t0.
    expect(getDueTerms([term], t0).map(t => t.id)).toContain(term.id);

    // user said good -> interval 0 to 1 day, now mastered.
    term = applyReview(term, 'good', t0);
    expect(term.status).toBe('mastered');
    expect(term.dueDate).toBe('2024-01-02');

    // a day later, due again.
    expect(getDueTerms([term], '2024-01-02').map(t => t.id)).toContain(term.id);

    // second good, interval doubles to 2 days.
    term = applyReview(term, 'good', '2024-01-02');
    expect(term.intervalDays).toBe(2);
    expect(term.dueDate).toBe('2024-01-04');

    // before the due date, not in the queue.
    expect(getDueTerms([term], '2024-01-03')).toHaveLength(0);
  });

  test('forgetting a term ("again") resets the interval and returns it to review', () => {
    let term = {
      id: '@term_ej',
      term: 'Estoppel',
      status: 'mastered',
      reviewCount: 5,
      intervalDays: 8,
      dueDate: '2024-03-01',
    };
    const today = '2024-03-01';

    term = applyReview(term, 'again', today);
    expect(term.status).toBe('review');
    expect(term.intervalDays).toBe(1);
    expect(term.dueDate).toBe('2024-03-02');
    expect(term.reviewCount).toBe(6);
  });
});
