import { ValueObject } from '@agrosat/shared-kernel';
import { GeoJsonPolygon, GisGeometryUtil } from '@agrosat/gis-contracts';
import { InvalidParcelPolygonException } from '../exceptions/zoning-domain.exceptions';

interface GeoPolygonProps {
  geoJson: GeoJsonPolygon;
  vertexCount: number;
}

export class GeoPolygonVo extends ValueObject<GeoPolygonProps> {
  private constructor(props: GeoPolygonProps) {
    super(props);
  }

  public static create(rawPolygon: GeoJsonPolygon): GeoPolygonVo {
    try {
      const normalized = GisGeometryUtil.validateAndClosePolygon(rawPolygon);
      const vertexCount = normalized.coordinates[0].length - 1;
      return new GeoPolygonVo({
        geoJson: normalized,
        vertexCount,
      });
    } catch (error) {
      throw new InvalidParcelPolygonException(
        error instanceof Error ? error.message : 'Polígono GeoJSON inválido.',
      );
    }
  }

  get geoJson(): GeoJsonPolygon {
    return this.props.geoJson;
  }

  get vertexCount(): number {
    return this.props.vertexCount;
  }
}
