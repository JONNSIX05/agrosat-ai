import { Inject, Injectable } from '@nestjs/common';
import { SentinelSceneSummaryDto } from '../dtos/sentinel-scene-response.dto';
import {
  SENTINEL_SCENE_REPOSITORY_PORT,
  SentinelSceneRepositoryPort,
} from '../ports/out/sentinel-scene-repository.port';

@Injectable()
export class GetParcelNdviTimeseriesUseCase {
  constructor(
    @Inject(SENTINEL_SCENE_REPOSITORY_PORT)
    private readonly sceneRepo: SentinelSceneRepositoryPort,
  ) {}

  public async execute(
    parcelId: string,
    limit = 30,
  ): Promise<{
    parcelId: string;
    totalPasses: number;
    latestMeanNdvi: number | null;
    ndviDeltaFromPrevious: number;
    series: SentinelSceneSummaryDto[];
  }> {
    const scenes = await this.sceneRepo.findSceneTimeSeriesByParcelId(parcelId, limit);

    let ndviDelta = 0;
    if (scenes.length >= 2) {
      const latest = scenes[scenes.length - 1];
      const prev = scenes[scenes.length - 2];
      ndviDelta = Number((latest.meanNdvi - prev.meanNdvi).toFixed(4));
    }

    return {
      parcelId,
      totalPasses: scenes.length,
      latestMeanNdvi: scenes.length > 0 ? scenes[scenes.length - 1].meanNdvi : null,
      ndviDeltaFromPrevious: ndviDelta,
      series: scenes,
    };
  }
}
