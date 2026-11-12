import { Inject, Injectable, Logger } from '@nestjs/common';
import { GisGeometryUtil } from '@agrosat/gis-contracts';
import { ParcelGeometryNotFoundException } from '../../domain/exceptions/satellite-domain.exceptions';
import { StressPatchAnomalyVo } from '../../domain/value-objects/stress-patch-anomaly.vo';
import { WatermelonPhenologyVo } from '../../domain/value-objects/watermelon-phenology.vo';
import {
  SentinelSceneGridResponseDto,
  SentinelSceneMapper,
} from '../dtos/sentinel-scene-response.dto';
import { SimulateSentinelPassRequestDto } from '../dtos/simulate-pass.dto';
import {
  PARCEL_GEOMETRY_PROVIDER_PORT,
  ParcelGeometryProviderPort,
} from '../ports/out/parcel-geometry-provider.port';
import {
  SENTINEL_SCENE_REPOSITORY_PORT,
  SentinelSceneRepositoryPort,
} from '../ports/out/sentinel-scene-repository.port';
import {
  SENTINEL_SPATIAL_SIMULATOR_PORT,
  SentinelSpatialSimulatorPort,
} from '../ports/out/sentinel-spatial-simulator.port';
import {
  SPECTRAL_ANOMALY_NOTIFIER_PORT,
  SpectralAnomalyNotifierPort,
} from '../ports/out/spectral-anomaly-notifier.port';

@Injectable()
export class SimulateSentinelPassUseCase {
  private readonly logger = new Logger(SimulateSentinelPassUseCase.name);

  constructor(
    @Inject(PARCEL_GEOMETRY_PROVIDER_PORT)
    private readonly parcelGeometryProvider: ParcelGeometryProviderPort,
    @Inject(SENTINEL_SPATIAL_SIMULATOR_PORT)
    private readonly spatialSimulator: SentinelSpatialSimulatorPort,
    @Inject(SENTINEL_SCENE_REPOSITORY_PORT)
    private readonly sceneRepo: SentinelSceneRepositoryPort,
    @Inject(SPECTRAL_ANOMALY_NOTIFIER_PORT)
    private readonly anomalyNotifier: SpectralAnomalyNotifierPort,
  ) {}

  public async execute(
    parcelId: string,
    dto: SimulateSentinelPassRequestDto = {},
  ): Promise<SentinelSceneGridResponseDto> {
    const parcelMeta = await this.parcelGeometryProvider.getParcelGeometry(parcelId);
    if (!parcelMeta) {
      throw new ParcelGeometryNotFoundException(parcelId);
    }

    // 1. Determinar días después de la siembra (DAS)
    const computedDas =
      dto.daysAfterPlanting !== undefined
        ? dto.daysAfterPlanting
        : Math.max(
            1,
            Math.round((Date.now() - new Date(parcelMeta.plantingDate).getTime()) / 86400000),
          );

    const phenology = WatermelonPhenologyVo.fromDaysAfterPlanting(computedDas);

    // 2. Construir configuración de mancha de estrés hídrico o plaga si se solicitó
    let stressPatchVo: StressPatchAnomalyVo | null = null;
    if (dto.injectStressPatch && dto.injectStressPatch.enabled !== false) {
      const bbox = GisGeometryUtil.computeBoundingBox(parcelMeta.boundaryGeoJson);
      // Si no se especifican coordenadas del foco, se coloca en el sector Noreste del polígono
      const defaultFocusLon =
        parcelMeta.centroid.lon + (bbox.maxLon - parcelMeta.centroid.lon) * 0.35;
      const defaultFocusLat =
        parcelMeta.centroid.lat + (bbox.maxLat - parcelMeta.centroid.lat) * 0.35;

      stressPatchVo = StressPatchAnomalyVo.create({
        centerLon: dto.injectStressPatch.centerLon ?? defaultFocusLon,
        centerLat: dto.injectStressPatch.centerLat ?? defaultFocusLat,
        radiusMeters: dto.injectStressPatch.radiusMeters ?? 42,
        ndviDropMagnitude: dto.injectStressPatch.ndviDropMagnitude ?? 0.36,
        targetMinNdvi: dto.injectStressPatch.targetMinNdvi ?? 0.28,
        anomalyCause: dto.injectStressPatch.anomalyCause ?? 'FUSARIUM_OR_DRIP_TAPE_FAILURE',
      });
    }

    // 3. Consultar escena previa para calcular caída de NDVI (ΔNDVI)
    const previousScene = await this.sceneRepo.findPreviousSceneSummary(parcelId);

    // 4. Generar escena simulada con grilla espacial en PostGIS
    const simulatedScene = await this.spatialSimulator.generateSimulatedScene({
      parcelId,
      parcelPolygonGeoJson: parcelMeta.boundaryGeoJson,
      phenology,
      stressPatch: stressPatchVo,
      simulationSeed: dto.simulationSeed,
    });

    // 5. Persistir escena y sub-polígonos en ms1_satellite
    const savedScene = await this.sceneRepo.saveSceneWithSubcells(simulatedScene);

    // 6. Evaluar si existe caída brusca de NDVI (> 0.20 en media o en el foco de estrés) y notificar a MS5
    const baselineNdvi = previousScene?.meanNdvi ?? phenology.expectedBaseNdvi;
    const meanDrop = Number((baselineNdvi - savedScene.meanNdvi).toFixed(4));
    const focalDrop = Number((baselineNdvi - savedScene.minNdvi).toFixed(4));
    const effectiveDrop = Math.max(meanDrop, focalDrop);

    if (effectiveDrop > 0.2 || savedScene.hasStressPatch) {
      this.logger.warn(
        `🛰️ Anomalía espectral detectada en parcela ${parcelId}: ΔNDVI máx = -${effectiveDrop} (minNdvi=${savedScene.minNdvi})`,
      );
      await this.anomalyNotifier.notifySpectralAnomaly({
        parcelId,
        sceneId: savedScene.id,
        capturedAt: savedScene.capturedAt.toISOString(),
        daysAfterPlanting: savedScene.daysAfterPlanting,
        phenologicalStage: savedScene.phenologicalStage,
        previousMeanNdvi: baselineNdvi,
        currentMeanNdvi: savedScene.meanNdvi,
        minNdvi: savedScene.minNdvi,
        ndviDrop: effectiveDrop,
        stressedCellsPct: savedScene.stressedCellsPct,
        stressPatchCenter: savedScene.stressPatchMetadata
          ? {
              lon: savedScene.stressPatchMetadata.centerLon,
              lat: savedScene.stressPatchMetadata.centerLat,
              radiusMeters: savedScene.stressPatchMetadata.radiusMeters,
              anomalyCause: savedScene.stressPatchMetadata.anomalyCause,
            }
          : undefined,
      });
    }

    return SentinelSceneMapper.toGridResponseDto(savedScene);
  }
}
