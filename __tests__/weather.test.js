import {
  cleanLocation,
  findDayForecast,
  weatherDescription,
  weatherRisk,
  getForecast,
} from '../utils/weather';

describe('cleanLocation', () => {
  test('strips court suffixes so the geocoder can find the city', () => {
    expect(cleanLocation('Snaresbrook Crown Court')).toBe('Snaresbrook');
    expect(cleanLocation('London County Court')).toBe('London');
    expect(cleanLocation('Leeds Magistrates Court')).toBe('Leeds');
    expect(cleanLocation('Birmingham')).toBe('Birmingham');
  });

  test('returns empty string for empty input', () => {
    expect(cleanLocation('')).toBe('');
    expect(cleanLocation(null)).toBe('');
  });
});

describe('weatherDescription', () => {
  test('maps known WMO codes to labels', () => {
    expect(weatherDescription(0)).toBe('Clear sky');
    expect(weatherDescription(63)).toBe('Rain');
    expect(weatherDescription(95)).toBe('Thunderstorm');
  });

  test('falls back for unknown codes', () => {
    expect(weatherDescription(999)).toBe('Unknown');
  });
});

describe('findDayForecast', () => {
  const forecast = {
    daily: {
      time: ['2026-09-14', '2026-09-15'],
      weather_code: [2, 95],
      temperature_2m_max: [18, 16],
      temperature_2m_min: [10, 9],
      precipitation_probability_max: [10, 80],
      wind_speed_10m_max: [12, 55],
    },
  };

  test('returns the day that matches the court date', () => {
    const day = findDayForecast(forecast, '2026-09-15');
    expect(day.code).toBe(95);
    expect(day.tempMax).toBe(16);
    expect(day.rainProb).toBe(80);
    expect(day.windMax).toBe(55);
  });

  test('returns null when the date is not inside the forecast', () => {
    expect(findDayForecast(forecast, '2027-01-01')).toBeNull();
  });

  test('returns null for an empty forecast', () => {
    expect(findDayForecast(null, '2026-09-14')).toBeNull();
    expect(findDayForecast({}, '2026-09-14')).toBeNull();
  });
});

describe('weatherRisk', () => {
  test('thunderstorm is high risk', () => {
    expect(weatherRisk({ code: 95, windMax: 10, rainProb: 50 }).level).toBe('high');
  });

  test('snow is high risk', () => {
    expect(weatherRisk({ code: 73, windMax: 10, rainProb: 50 }).level).toBe('high');
  });

  test('heavy rain is high risk', () => {
    expect(weatherRisk({ code: 65, windMax: 10, rainProb: 80 }).level).toBe('high');
  });

  test('light rain is moderate risk', () => {
    expect(weatherRisk({ code: 61, windMax: 10, rainProb: 50 }).level).toBe('moderate');
  });

  test('clear sky is low risk', () => {
    expect(weatherRisk({ code: 0, windMax: 10, rainProb: 10 }).level).toBe('low');
  });

  test('strong wind upgrades the risk to moderate', () => {
    expect(weatherRisk({ code: 0, windMax: 60, rainProb: 10 }).level).toBe('moderate');
  });

  test('null day returns low risk', () => {
    expect(weatherRisk(null).level).toBe('low');
  });
});

describe('getForecast', () => {
  test('builds the forecast request and parses the response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ daily: { time: ['2026-09-14'] } }),
    });
    const data = await getForecast({ latitude: 51.5, longitude: -0.12 });
    expect(data.daily.time).toEqual(['2026-09-14']);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('latitude=51.5');
    expect(url).toContain('longitude=-0.12');
    expect(url).toContain('daily=');
  });

  test('throws when the request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    await expect(getForecast({ latitude: 1, longitude: 2 })).rejects.toThrow(
      'Forecast request failed'
    );
  });
});
