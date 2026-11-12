import { BoundingBox, GeoJsonPolygon, GeoJsonPosition, LatLngLiteral } from './geojson.types';

export class GisGeometryUtil {
  private static readonly EARTH_RADIUS_METERS = 6371008.8;

  /**
   * Valida que un polígono GeoJSON tenga al menos 4 posiciones en su anillo exterior,
   * coordenadas dentro de WGS84 (SRID 4326) y anillo cerrado (primer punto === último punto).
   */
  public static validateAndClosePolygon(polygon: GeoJsonPolygon): GeoJsonPolygon {
    if (!polygon || polygon.type !== 'Polygon' || !Array.isArray(polygon.coordinates)) {
      throw new Error('GeoJSON inválido: se requiere un objeto de tipo Polygon.');
    }

    const outerRing = polygon.coordinates[0];
    if (!Array.isArray(outerRing) || outerRing.length < 3) {
      throw new Error('El polígono de la parcela debe tener al menos 3 vértices distintos.');
    }

    const normalizedRing: GeoJsonPosition[] = outerRing.map((pos, idx) => {
      if (!Array.isArray(pos) || pos.length < 2) {
        throw new Error(`Coordenada inválida en el índice ${idx}.`);
      }
      const [lon, lat] = [Number(pos[0]), Number(pos[1])];
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
        throw new Error(`Coordenadas no numéricas en el vértice ${idx}.`);
      }
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        throw new Error(`Coordenadas fuera de rango WGS84 (SRID 4326) en vértice ${idx}: [${lon}, ${lat}]`);
      }
      return [lon, lat];
    });

    const first = normalizedRing[0];
    const last = normalizedRing[normalizedRing.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      normalizedRing.push([first[0], first[1]]);
    }

    if (normalizedRing.length < 4) {
      throw new Error('Un anillo lineal cerrado GeoJSON debe tener al menos 4 posiciones.');
    }

    return {
      type: 'Polygon',
      coordinates: [normalizedRing, ...polygon.coordinates.slice(1)],
    };
  }

  /**
   * Calcula la distancia geodésica en metros entre dos coordenadas (fórmula de Haversine).
   */
  public static haversineDistanceMeters(
    lon1: number,
    lat1: number,
    lon2: number,
    lat2: number,
  ): number {
    const toRad = (deg: number): number => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return this.EARTH_RADIUS_METERS * c;
  }

  /**
   * Calcula la caja delimitadora (BoundingBox) de un polígono GeoJSON.
   */
  public static computeBoundingBox(polygon: GeoJsonPolygon): BoundingBox {
    const ring = polygon.coordinates[0];
    let minLon = Infinity;
    let minLat = Infinity;
    let maxLon = -Infinity;
    let maxLat = -Infinity;

    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }

    return { minLon, minLat, maxLon, maxLat };
  }

  /**
   * Convierte una lista de coordenadas { latitude, longitude } de la App Móvil a GeoJsonPolygon cerrado.
   */
  public static fromLatLngVertices(vertices: LatLngLiteral[]): GeoJsonPolygon {
    const ring: GeoJsonPosition[] = vertices.map((v) => [v.longitude, v.latitude]);
    return this.validateAndClosePolygon({
      type: 'Polygon',
      coordinates: [ring],
    });
  }
}
