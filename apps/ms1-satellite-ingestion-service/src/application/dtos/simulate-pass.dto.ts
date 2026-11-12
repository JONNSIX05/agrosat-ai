export interface InjectStressPatchRequestDto {
  enabled?: boolean;
  /**
   * Coordenadas opcionales del epicentro de la mancha de estrés.
   * Si se omiten, se ubica automáticamente en el cuadrante noreste del polígono de la parcela.
   */
  centerLon?: number;
  centerLat?: number;
  radiusMeters?: number;
  ndviDropMagnitude?: number;
  targetMinNdvi?: number;
  anomalyCause?:
    | 'FUSARIUM_OR_DRIP_TAPE_FAILURE'
    | 'SPIDER_MITE_OUTBREAK'
    | 'WATER_STRESS_DRIP_FAILURE'
    | string;
}

export interface SimulateSentinelPassRequestDto {
  /**
   * Días después de la siembra (0 a 90+). Si se omite, se calcula automáticamente
   * a partir de la planting_date de la parcela en MS2.
   */
  daysAfterPlanting?: number;
  /**
   * Configuración opcional para inyectar una mancha de estrés hídrico o plaga
   * (caída brusca de NDVI en un sector del polígono).
   */
  injectStressPatch?: InjectStressPatchRequestDto;
  /**
   * Semilla opcional para variación del ruido espacial Perlin/armónico.
   */
  simulationSeed?: number;
}
