import { GeoJsonPolygon, SubcellFeature } from '../../services/agrosat-api.client';

export interface AgroMapProps {
  center: { lon: number; lat: number };
  parcelBoundary?: GeoJsonPolygon;
  subcellFeatures: SubcellFeature[];
  ndviOpacity: number;
  isDrawingMode?: boolean;
  onPolygonComplete?: (polygon: GeoJsonPolygon) => void;
  onSubcellSelect?: (feature: SubcellFeature) => void;
}
