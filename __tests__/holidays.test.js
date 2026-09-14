process.env.TZ = 'UTC';
import { getBankHolidays, isWorkingDay, getWorkingDays } from '../screens/Calculator/holidays';

describe('getBankHolidays (England & Wales, simplified)', () => {
  const holidays2024 = getBankHolidays(2024);

  test('computes Good Friday correctly from the Computus algorithm', () => {
    expect(holidays2024).toContain('2024-03-29');
  });

  test('computes Easter Monday correctly', () => {
    expect(holidays2024).toContain('2024-04-01');
  });

  test('includes Christmas and Boxing Day', () => {
    expect(holidays2024).toContain('2024-12-25');
    expect(holidays2024).toContain('2024-12-26');
  });

  test('New Year\'s Day is present', () => {
    expect(holidays2024).toContain('2024-01-01');
  });

  test('weekend-adjusted New Year holiday', () => {
    // 2023-01-01 is a Sunday -> moved to Monday 2023-01-02
    expect(getBankHolidays(2023)).toContain('2023-01-02');
  });
});

describe('isWorkingDay', () => {
  const holidays = getBankHolidays(2024);

  test('Saturday is not a working day', () => {
    expect(isWorkingDay(new Date(2024, 2, 30), holidays)).toBe(false); // Sat 2024-03-30
  });

  test('Sunday is not a working day', () => {
    expect(isWorkingDay(new Date(2024, 2, 31), holidays)).toBe(false); // Sun 2024-03-31
  });

  test('a normal weekday is a working day', () => {
    expect(isWorkingDay(new Date(2024, 2, 27), holidays)).toBe(true); // Wed 2024-03-27
  });
});

describe('getWorkingDays', () => {
  test('counts weekdays across a full standard work week (inclusive of end)', () => {
    const start = new Date(2024, 2, 4); // Mon 2024-03-04
    const end = new Date(2024, 2, 8);   // Fri 2024-03-08
    expect(getWorkingDays(start, end)).toBe(5);
  });

  test('returns zero when end is before start', () => {
    expect(getWorkingDays(new Date(2024, 5, 10), new Date(2024, 5, 1))).toBe(0);
  });
});
