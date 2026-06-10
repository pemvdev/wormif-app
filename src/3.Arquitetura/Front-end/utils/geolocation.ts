export type GeoLocationPoint = {
  lat: number;
  lng: number;
  label: string;
};

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeolocationError';
  }
}

function formatCoordinateLabel(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('localityLanguage', 'pt');

    const response = await fetch(url.toString());
    if (!response.ok) return formatCoordinateLabel(lat, lng);

    const data = (await response.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
    };

    const place = data.city || data.locality;
    const region = data.principalSubdivision;
    if (place && region) return `${place}, ${region}`;
    if (place) return place;
    if (data.countryName) return data.countryName;
  } catch {
    // fallback to coordinates
  }

  return formatCoordinateLabel(lat, lng);
}

export async function captureCurrentLocation(): Promise<GeoLocationPoint> {
  if (!('geolocation' in navigator)) {
    throw new GeolocationError('Seu navegador não suporta geolocalização.');
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    });
  });

  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const label = await reverseGeocode(lat, lng);

  return { lat, lng, label };
}

export function geolocationErrorMessage(error: unknown): string {
  if (error instanceof GeolocationError) return error.message;

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as GeolocationPositionError).code;
    if (code === 1) {
      return 'Permissão de localização negada. Ative o acesso no navegador ou nas configurações do sistema.';
    }
    if (code === 2) {
      return 'Não foi possível determinar sua posição no momento.';
    }
    if (code === 3) {
      return 'Tempo esgotado ao obter a localização. Tente novamente.';
    }
  }

  return 'Não foi possível obter a localização.';
}
