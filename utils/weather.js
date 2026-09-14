// Getting weather for the case detail page

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export const cleanLocation = (raw) => {
  return (raw || '')
    .replace(/\b(magistrates'?|crown|county|high|supreme|family|employment|first-tier)?\s*(court|tribunal)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getCoordinates = async (location) => {
  const query = cleanLocation(location);
  if (!query) return null;
  const url =
    GEOCODING_URL +
    '?name=' +
    encodeURIComponent(query) +
    '&count=1&language=en&format=json';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = await res.json();
  const first = data.results && data.results[0];
  return first
    ? { latitude: first.latitude, longitude: first.longitude, name: first.name }
    : null;
};

export const getForecast = async ({ latitude, longitude }) => {
  const url =
    FORECAST_URL +
    '?latitude=' +
    latitude +
    '&longitude=' +
    longitude +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max' +
    '&timezone=auto&forecast_days=16';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Forecast request failed');
  return res.json();
};

// WMO weather code -> short label, only the codes.
export const weatherDescription = (code) => {
  const map = {
    0: 'Clear sky',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light showers',
    81: 'Showers',
    82: 'Heavy showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with hail',
  };
  return map[code] || 'Unknown';
};

// Pick the day of the court date out of the daily forecast arrays.
export const findDayForecast = (forecast, dateStr) => {
  const daily = forecast && forecast.daily;
  if (!daily || !Array.isArray(daily.time)) return null;
  const idx = daily.time.indexOf(dateStr);
  if (idx === -1) return null;
  return {
    date: dateStr,
    code: daily.weather_code ? daily.weather_code[idx] : null,
    tempMax: daily.temperature_2m_max ? daily.temperature_2m_max[idx] : null,
    tempMin: daily.temperature_2m_min ? daily.temperature_2m_min[idx] : null,
    rainProb: daily.precipitation_probability_max
      ? daily.precipitation_probability_max[idx]
      : null,
    windMax: daily.wind_speed_10m_max ? daily.wind_speed_10m_max[idx] : null,
  };
};

// a simple rule for whether the weather might affect travel to court.
export const weatherRisk = (day) => {
  if (!day) return { level: 'low', message: 'No forecast available.' };
  const code = day.code;
  let level = 'low';
  let message = 'Weather should not affect travel.';
  if (code >= 95) {
    level = 'high';
    message = 'Thunderstorm expected - travel may be disrupted.';
  } else if (code >= 71 && code <= 77) {
    level = 'high';
    message = 'Snow expected - allow extra travel time.';
  } else if ((code >= 65 && code <= 67) || code === 82) {
    level = 'high';
    message = 'Heavy rain expected - allow extra travel time.';
  } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 81)) {
    level = 'moderate';
    message = 'Rain likely - bring an umbrella.';
  }
  if (day.windMax >= 50) {
    level = level === 'low' ? 'moderate' : level;
    message = 'Strong wind expected - check travel updates.';
  } else if (day.rainProb >= 70 && level === 'low') {
    level = 'moderate';
    message = 'High chance of rain - bring an umbrella.';
  }
  return { level, message };
};
