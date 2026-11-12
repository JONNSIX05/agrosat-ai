import { DomainException } from '@agrosat/shared-kernel';

export class InvalidParcelPolygonException extends DomainException {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_PARCEL_POLYGON', message, details);
  }
}

export class ParcelNotFoundException extends DomainException {
  constructor(parcelId: string) {
    super('PARCEL_NOT_FOUND', `No se encontró la parcela con ID ${parcelId}.`, { parcelId });
  }
}
