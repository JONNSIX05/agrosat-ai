import { Inject, Injectable } from '@nestjs/common';
import {
  SentinelSceneGridResponseDto,
  SentinelSceneMapper,
} from '../dtos/sentinel-scene-response.dto';
import {
  SENTINEL_SCENE_REPOSITORY_PORT,
  SentinelSceneRepositoryPort,
} from '../ports/out/sentinel-scene-repository.port';
import { SimulateSentinelPassUseCase } from './simulate-sentinel-pass.use-case';

@Injectable()
export class GetLatestParcelGridUseCase {
  constructor(
    @Inject(SENTINEL_SCENE_REPOSITORY_PORT)
    private readonly sceneRepo: SentinelSceneRepositoryPort,
    private readonly simulatePassUseCase: SimulateSentinelPassUseCase,
  ) {}

  /**
   * Obtiene la última escena satelital con su grilla de sub-polígonos GeoJSON.
   * Si la parcela aún no tiene ninguna pasada satelital registrada, genera automáticamente
   * una escena nominal inicial para que el mapa siempre tenga datos listos.
   */
  public async execute(parcelId: string): Promise<SentinelSceneGridResponseDto> {
    const existingScene = await this.sceneRepo.findLatestSceneWithSubcellsByParcelId(parcelId);
    if (existingScene) {
      return SentinelSceneMapper.toGridResponseDto(existingScene);
    }

    return this.simulatePassUseCase.execute(parcelId, {});
  }
}
