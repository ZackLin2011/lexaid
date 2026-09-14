//to get today's date in YMD format
const getToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// next review interval. 'again' resets to 1 day, 'good' doubles it
export const getNextInterval = (currentInterval, performance) => {
  if (performance === 'again') {
    return 1; // Reset to 1 day if forgotten
  }
  if (performance === 'good') {
    // If it's the first time reviewing (interval 0), next is 1 day. In the opposite situation, double it.
    const next = currentInterval === 0 ? 1 : currentInterval * 2;
    return Math.min(next, 30); // at most 30 days
  }
  return currentInterval;
};

// add intervalDays to today and return the new due date.
export const getDueDate = (intervalDays, today) => {
  const date = new Date(today);
  date.setDate(date.getDate() + intervalDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// update a term after a review: status, interval, due date, review count.
export const applyReview = (term, performance, today) => {
  const newInterval = getNextInterval(term.intervalDays, performance);
  
  let newStatus = term.status;
  if (performance === 'good') {
    newStatus = 'mastered';
  } else if (performance === 'again') {
    newStatus = 'review';
  }

  return {
    ...term,
    status: newStatus,
    reviewCount: (term.reviewCount || 0) + 1,
    intervalDays: newInterval,
    dueDate: getDueDate(newInterval, today),
    lastReviewedAt: today,
  };
};

// terms that are due (dueDate is today or earlier).
export const getDueTerms = (terms, today) => {
  return terms.filter(term => term.dueDate && term.dueDate <= today);
};

// basic stats for the terms screen: total, mastered, due today, %.
export const getStats = (terms, today) => {
  const total = terms.length;
  if (total === 0) {
    return { total: 0, mastered: 0, dueToday: 0, masteredPct: 0 };
  }
  
  const mastered = terms.filter(t => t.status === 'mastered').length;
  const dueToday = getDueTerms(terms, today).length;
  const masteredPct = total > 0 ? parseFloat(((mastered / total) * 100).toFixed(1)) : 0;

  return { total, mastered, dueToday, masteredPct };
};