import {
  courtIssueFeeBand,
  calculateCourtFee,
  estimateSolicitorFee,
  calculateStatutoryInterest,
} from '../utils/feeCalculations';

describe('courtIssueFeeBand', () => {
  test('applies the 5% band up to £10,000', () => {
    expect(courtIssueFeeBand(10000)).toBe(500);
    expect(courtIssueFeeBand(100)).toBe(5);
  });

  test('applies the stepped band between £10k and £100k', () => {
    expect(courtIssueFeeBand(50000)).toBeCloseTo(2100);
  });

  test('applies the top band above £100k', () => {
    expect(courtIssueFeeBand(200000)).toBeCloseTo(7100);
  });
});

describe('calculateCourtFee', () => {
  test('returns an error without a claim type', () => {
    expect(calculateCourtFee({ claimType: null, value: 100, reduceFee: 'no' }).error).toBeTruthy();
  });

  test('returns an error for negative values', () => {
    expect(calculateCourtFee({ claimType: 'monetary', value: -5, reduceFee: 'no' }).error).toBeTruthy();
  });

  test('computes base issue, security and enforcement fees', () => {
    const result = calculateCourtFee({ claimType: 'monetary', value: 10000, reduceFee: 'no' });
    expect(result.issueFee).toBeCloseTo(500);
    expect(result.securityForCosts).toBeCloseTo(100);
    expect(result.enforcementFee).toBe(110);
  });

  test('divorce / insolvency / probate carry a 20% uplift', () => {
    const result = calculateCourtFee({ claimType: 'divorce', value: 10000, reduceFee: 'no' });
    expect(result.issueFee).toBeCloseTo(600);
  });

  test('reduced fee halves the issue fee', () => {
    const result = calculateCourtFee({ claimType: 'monetary', value: 10000, reduceFee: 'yes' });
    expect(result.issueFee).toBeCloseTo(250);
  });
});

describe('estimateSolicitorFee', () => {
  test('Wales civil estimate range', () => {
    const result = estimateSolicitorFee({ caseType: 'civil', region: 'wales', value: 10000 });
    expect(result.lowerBound).toBeCloseTo(1000);
    expect(result.upperBound).toBeCloseTo(2000);
  });

  test('England applies a 1.2 multiplier', () => {
    const result = estimateSolicitorFee({ caseType: 'civil', region: 'england', value: 10000 });
    expect(result.lowerBound).toBeCloseTo(1200);
    expect(result.upperBound).toBeCloseTo(2200);
  });

  test('complex cases (IP / commercial) apply a further 1.5 multiplier', () => {
    const result = estimateSolicitorFee({ caseType: 'ip', region: 'england', value: 10000 });
    expect(result.lowerBound).toBeCloseTo(1800);
    expect(result.upperBound).toBeCloseTo(2800);
  });
});

describe('calculateStatutoryInterest', () => {
  test('computes interest over 7 days at 8% judgment rate on £1000', () => {
    const result = calculateStatutoryInterest({
      principal: 1000,
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 0, 8),
      rateType: 'judgment',
      dayCountMethod: 'exclude_start',
      yearBase: '365',
      rateMultiplier: 1,
    });
    expect(result.days).toBe(7);
    expect(result.interest).toBeCloseTo(1.53, 1);
  });

  test('include_both counts an extra day', () => {
    const result = calculateStatutoryInterest({
      principal: 1000,
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 0, 8),
      rateType: 'judgment',
      dayCountMethod: 'include_both',
      yearBase: '365',
      rateMultiplier: 1,
    });
    expect(result.days).toBe(8);
  });

  test('contract rate uses 8.5%', () => {
    const result = calculateStatutoryInterest({
      principal: 1000,
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 0, 8),
      rateType: 'contract',
      dayCountMethod: 'exclude_start',
      yearBase: '365',
      rateMultiplier: 1,
    });
    expect(result.interest).toBeCloseTo(1.63, 1);
  });

  test('rejects invalid principal', () => {
    expect(calculateStatutoryInterest({ principal: -10, startDate: new Date(), endDate: new Date() }).error).toBeTruthy();
  });

  test('rejects end date before start date', () => {
    const result = calculateStatutoryInterest({
      principal: 1000,
      startDate: new Date(2024, 5, 10),
      endDate: new Date(2024, 5, 1),
    });
    expect(result.error).toBeTruthy();
  });
});
