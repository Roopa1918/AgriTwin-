// AgriTwin — Real-World Live Weather Service via Open-Meteo API
// Free, global, reliable meteorological forecast API with zero API key requirement.
// Automatically retrieves live field conditions based on the user's selected coordinates.

export function getWeatherDescription(code) {
  // WMO Weather interpretation codes (WW)
  switch (code) {
    case 0: return { label: 'Clear Sky', icon: '☀️' };
    case 1: return { label: 'Mainly Clear', icon: '🌤️' };
    case 2: return { label: 'Partly Cloudy', icon: '⛅' };
    case 3: return { label: 'Overcast', icon: '☁️' };
    case 45:
    case 48: return { label: 'Foggy', icon: '🌫️' };
    case 51:
    case 53:
    case 55: return { label: 'Light Drizzle', icon: '🌦️' };
    case 61: return { label: 'Slight Rain', icon: '🌧️' };
    case 63: return { label: 'Moderate Rain', icon: '🌧️' };
    case 65: return { label: 'Heavy Rain', icon: '⛈️' };
    case 80:
    case 81:
    case 82: return { label: 'Rain Showers', icon: '🌦️' };
    case 95:
    case 96:
    case 99: return { label: 'Thunderstorm', icon: '⚡' };
    default: return { label: 'Partly Cloudy', icon: '⛅' };
  }
}

export async function fetchLiveWeather(latitude, longitude) {
  const lat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : (latitude ? parseFloat(latitude) : null);
  const lon = typeof longitude === 'number' && !isNaN(longitude) ? longitude : (longitude ? parseFloat(longitude) : null);

  if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
    return getOfflineFallbackWeather('No GPS coordinates configured for active field');
  }

  const cacheKey = `agritwin_weather_cache_${lat.toFixed(2)}_${lon.toFixed(2)}`;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,precipitation,weather_code,et0_fao_evapotranspiration&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API returned status ${response.status}`);
    const data = await response.json();

    const current = data.current || {};
    const weatherInfo = getWeatherDescription(current.weather_code ?? 2);

    // Synchronized Reference ET0 for today
    const todayEt0 = (data.daily && Array.isArray(data.daily.et0_fao_evapotranspiration) && typeof data.daily.et0_fao_evapotranspiration[0] === 'number')
      ? parseFloat(data.daily.et0_fao_evapotranspiration[0].toFixed(1))
      : 4.8;

    // Format hourly forecast for today (next 8 hours)
    const hourly = [];
    if (data.hourly && data.hourly.time) {
      const nowIdx = 0;
      for (let i = nowIdx; i < Math.min(data.hourly.time.length, nowIdx + 8); i++) {
        const timeStr = new Date(data.hourly.time[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        hourly.push({
          time: timeStr,
          temp: Math.round(data.hourly.temperature_2m[i] ?? 28),
          humidity: Math.round(data.hourly.relative_humidity_2m[i] ?? 60),
          rain: parseFloat((data.hourly.precipitation[i] ?? 0).toFixed(1)),
          et0: parseFloat((data.hourly.et0_fao_evapotranspiration?.[i] ?? 0.2).toFixed(2)),
          ...getWeatherDescription(data.hourly.weather_code[i] ?? 1)
        });
      }
    }

    // Format 5-Day Forecast with FAO-56 Reference ET0 and Rain Probability
    const daily = [];
    if (data.daily && data.daily.time) {
      for (let d = 0; d < Math.min(5, data.daily.time.length); d++) {
        const dateObj = new Date(data.daily.time[d]);
        const dayName = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : dateObj.toLocaleDateString([], { weekday: 'short' });
        const dayEt0 = d === 0 
          ? todayEt0 
          : (typeof data.daily.et0_fao_evapotranspiration?.[d] === 'number' 
            ? parseFloat(data.daily.et0_fao_evapotranspiration[d].toFixed(1)) 
            : 4.5);

        daily.push({
          day: dayName,
          date: dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          maxTemp: Math.round(data.daily.temperature_2m_max[d] ?? 31),
          minTemp: Math.round(data.daily.temperature_2m_min[d] ?? 22),
          rain: parseFloat((data.daily.precipitation_sum[d] ?? 0).toFixed(1)),
          precipitationProbability: data.daily.precipitation_probability_max?.[d] ?? 0,
          et0: dayEt0,
          ...getWeatherDescription(data.daily.weather_code[d] ?? 2)
        });
      }
    }

    const weatherPayload = {
      latitude: lat,
      longitude: lon,
      temperature: Math.round(current.temperature_2m ?? 29),
      humidity: Math.round(current.relative_humidity_2m ?? 65),
      rainfall: parseFloat((current.precipitation ?? 0).toFixed(1)),
      windSpeed: Math.round(current.wind_speed_10m ?? 12),
      currentEt0: todayEt0,
      condition: weatherInfo.label,
      conditionIcon: weatherInfo.icon,
      hourly,
      daily,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fetchedAt: new Date().toISOString(),
      isLive: true,
      isStale: false,
      isOffline: false,
      source: `Live Forecast (Open-Meteo NWP for ${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`
    };

    // Save to coordinate-specific cache for offline resilience
    try {
      localStorage.setItem(cacheKey, JSON.stringify(weatherPayload));
    } catch (e) {
      // safe fallback
    }

    return weatherPayload;
  } catch (error) {
    console.warn('[AgriTwin Weather] Could not fetch live weather from Open-Meteo:', error);

    // Attempt to retrieve coordinate-specific cached weather from storage
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Verify coordinates match requested field to prevent cross-field contamination
        const isCoordMatch = typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number' &&
          Math.abs(parsed.latitude - lat) < 0.05 && Math.abs(parsed.longitude - lon) < 0.05;

        if (isCoordMatch) {
          const ageHours = (Date.now() - new Date(parsed.fetchedAt || 0).getTime()) / 3600000;
          if (ageHours <= 24) {
            return {
              ...parsed,
              isLive: false,
              isStale: true,
              isOffline: false,
              ageHours: Math.round(ageHours),
              source: `Cached Weather (${Math.round(ageHours)}h ago • Open-Meteo NWP for ${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`
            };
          }
        }
      }
    } catch (e) {
      // cache parsing failed
    }

    // Graceful offline state — Phase 2 soil moisture mode continues seamlessly
    return getOfflineFallbackWeather(`Offline: Weather unreachable for ${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`);
  }
}

export function getOfflineFallbackWeather(reason = 'Weather Forecast Unavailable') {
  return {
    latitude: null,
    longitude: null,
    temperature: null,
    humidity: null,
    rainfall: null,
    windSpeed: null,
    currentEt0: null,
    condition: 'Weather Unavailable',
    conditionIcon: '⚠️',
    hourly: [],
    daily: [],
    lastUpdated: 'Unavailable',
    fetchedAt: null,
    isLive: false,
    isStale: false,
    isOffline: true,
    source: `Offline (${reason})`
  };
}
