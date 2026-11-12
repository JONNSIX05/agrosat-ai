import { DomainException } from '@agrosat/shared-kernel';

export class InvalidSpectralBandException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_SPECTRAL_BAND', message, details);
  }
}

export class SatelliteSceneNotFoundException extends DomainException {
  constructor(parcelId: string) {
    super(
      'SATELLITE_SCENE_NOT_FOUND',
      `No existen escenas satelitales registradas para la parcela ${parcelId}.`,
      { parcelId },
    );
  }
}

export class ParcelGeometryNotFoundException extends DomainException {
  constructor(parcelId: string) {
    super(
      'PARCEL_GEOMETRY_NOT_FOUND',
      `No se encontró la geometría de la parcela ${parcelId} en MS2 Zoning.`,
      { parcelId },
    );
  }
}
