// fee and interest math calculations

export const courtIssueFeeBand = (value) => {
  if (value <= 10000) {
    return value * 0.05;
  }
  if (value <= 100000) {
    return 500 + (value - 10000) * 0.04;
  }
  return 4100 + (value - 100000) * 0.03;
};

// check the inputs, return an error message or null if ok.
export const validateCourtFeeInput = (claimType, value) => {
  if (!claimType) return 'Please select a claim type.';
  if (value === null || value === undefined || Number.isNaN(value)) return 'Please enter a valid claim value.';
  if (value < 0) return 'Claim value cannot be negative.';
  return null;
};

// Main court fee calc, returns issue/security/enforcement fees or  error if the input is bad or problematic.
export const calculateCourtFee = ({ claimType, value, reduceFee }) => {
  const error = validateCourtFeeInput(claimType, value);
  if (error) return { error };

  let issueFee = courtIssueFeeBand(value);

  // Certain claim types carry a 20% uplift.
  if (['divorce', 'insolvency', 'probate'].includes(claimType)) {
    issueFee *= 1.2;
  }

  // Fee remission  or/ reduction, it halves the issue fee.
  if (reduceFee === 'yes') {
    issueFee *= 0.5;
  }

  return {
    issueFee,
    securityForCosts: value * 0.01,
    enforcementFee: 110,
  };
};

// To estimate solicitor fee as a low-high range, based on case tyep and region. returns { error } if the input is bad.
export const estimateSolicitorFee = ({ caseType, region, value }) => {
  if (!caseType) return { error: 'Please select a case type.' };
  if (value === null || value === undefined || Number.isNaN(value) || value < 0) {
    return { error: 'Please enter a valid claim value.' };
  }

  let baseRate = 0.1;
  if (region === 'england') {
    baseRate *= 1.2;
  }
  if (['ip', 'commercial'].includes(caseType)) {
    baseRate *= 1.5;
  }

  return {
    lowerBound: value * baseRate,
    upperBound: value * (baseRate + 0.1),
  };
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// statutory interest
export const calculateStatutoryInterest = ({
  principal,
  startDate,
  endDate,
  rateType = 'judgment',
  dayCountMethod = 'exclude_start',
  yearBase = '365',
  rateMultiplier = 1,
}) => {
  if (!principal || Number.isNaN(principal) || principal <= 0) {
    return { error: 'Please enter a valid principal amount.' };
  }
  if (endDate < startDate) {
    return { error: 'End date cannot be earlier than the start date.' };
  }

  let timeDiff = endDate.getTime() - startDate.getTime();
  if (dayCountMethod === 'include_both') {
    timeDiff += MS_PER_DAY;
  }
  const days = Math.max(0, Math.ceil(timeDiff / MS_PER_DAY));

  const baseRate = rateType === 'judgment' ? 0.08 : 0.085;
  const dailyRate = (baseRate * rateMultiplier) / parseInt(yearBase, 10);
  const interest = principal * dailyRate * days;

  return { days, interest };
};
