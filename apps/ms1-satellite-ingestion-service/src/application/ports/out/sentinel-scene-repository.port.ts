import { SentinelSceneAggregate } from '../../../domain/entities/sentinel-scene.aggregate';
import { SentinelSceneSummaryDto } from '../../dtos/sentinel-scene-response.dto';

export const SENTINEL_SCENE_REPOSITORY_PORT = Symbol('SENTINEL_SCENE_REPOSITORY_PORT');

export interface SentinelSceneRepositoryPort {
  saveSceneWithSubcells(scene: SentinelSceneAggregate): Promise<SentinelSceneAggregate>;
  findLatestSceneWithSubcellsByParcelId(parcelId: string): Promise<SentinelSceneAggregate | null>;
  findPreviousSceneSummary(
    parcelId: string,
    beforeSceneId?: string,
  ): Promise<SentinelSceneSummaryDto | null>;
  findSceneTimeSeriesByParcelId(
    parcelId: string,
    limit?: number,
  ): Promise<SentinelSceneSummaryDto[]>;
}
