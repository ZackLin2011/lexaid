// Bank holidays in England from GOV.UK

const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getEasterSunday = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
};

export const getBankHolidays = (year) => {
    const easterSunday = getEasterSunday(year);
    const goodFriday = new Date(easterSunday);
    goodFriday.setDate(easterSunday.getDate() - 2);
    const easterMonday = new Date(easterSunday);
    easterMonday.setDate(easterSunday.getDate() + 1);

    const holidays = [
        // New Year's Day
        { name: "New Year's Day", date: new Date(year, 0, 1) },
        // Good Friday
        { name: 'Good Friday', date: goodFriday },
        // Easter Monday
        { name: 'Easter Monday', date: easterMonday },
        // Early May bank holiday
        { name: 'Early May bank holiday', date: new Date(year, 4, 1) },
        // Spring bank holiday
        { name: 'Spring bank holiday', date: new Date(year, 4, 29) },
        // Summer bank holiday
        { name: 'Summer bank holiday', date: new Date(year, 7, 28) },
        // Christmas Day
        { name: 'Christmas Day', date: new Date(year, 11, 25) },
        // Boxing Day
        { name: 'Boxing Day', date: new Date(year, 11, 26) },
    ];

    // Adjust for the weekends
    holidays.forEach(holiday => {
        const dayOfWeek = holiday.date.getDay();
        if (dayOfWeek === 6) { // Saturday
            holiday.date.setDate(holiday.date.getDate() + 2);
        } else if (dayOfWeek === 0) { // Sunday
            holiday.date.setDate(holiday.date.getDate() + 1);
        }
    });

    // Special holidays for some several specific years
    if (year === 2023) {
        holidays.push({ name: "King's Coronation", date: new Date(2023, 4, 8) });
    }

    return holidays.map(h => toLocalDateStr(h.date));
};

export const isWorkingDay = (date, holidays) => {
    const day = date.getDay();
    if (day === 0 || day === 6) {
        return false; // iit's a weekend
    }
    const dateString = toLocalDateStr(date);
    return !holidays.includes(dateString);
};

export const getWorkingDays = (startDate, endDate) => {
    const holidays = [...getBankHolidays(startDate.getFullYear()), ...getBankHolidays(endDate.getFullYear())];
    let count = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        if (isWorkingDay(currentDate, holidays)) {
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
};
