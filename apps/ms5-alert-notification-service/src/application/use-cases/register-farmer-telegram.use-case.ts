import { Inject, Injectable } from '@nestjs/common';
import { InvalidFarmerSubscriptionException } from '../../domain/exceptions/alert-domain.exceptions';
import { RegisterFarmerSubscriptionRequestDto } from '../dtos/farmer-alert.dto';
import {
  FARMER_ALERT_REPOSITORY_PORT,
  FarmerAlertRepositoryPort,
} from '../ports/out/farmer-alert-repository.port';

@Injectable()
export class RegisterFarmerTelegramUseCase {
  constructor(
    @Inject(FARMER_ALERT_REPOSITORY_PORT)
    private readonly alertRepo: FarmerAlertRepositoryPort,
  ) {}

  public async execute(dto: RegisterFarmerSubscriptionRequestDto) {
    if (!dto.telegramChatId || dto.telegramChatId.trim().length < 3) {
      throw new InvalidFarmerSubscriptionException(
        'Debe proporcionar un telegramChatId válido para recibir alertas en Telegram.',
      );
    }

    const defaultParcelId =
      dto.parcelId ?? process.env.DEFAULT_PARCEL_ID ?? '00000000-0000-0000-0000-000000000001';

    const ctx = await this.alertRepo.upsertFarmerAndSubscription({
      farmerId: dto.farmerId,
      fullName: dto.fullName?.trim() || 'Productor AgroSat',
      phoneNumber: dto.phoneNumber,
      telegramChatId: dto.telegramChatId.trim(),
      telegramUsername: dto.telegramUsername,
      parcelId: defaultParcelId,
      parcelAlias: dto.parcelAlias?.trim() || 'Parcela Sandía Lote Norte',
      cooldownMinutes: dto.cooldownMinutes ?? 15,
    });

    return {
      farmerId: ctx.farmer.id,
      fullName: ctx.farmer.fullName,
      telegramChatId: ctx.farmer.telegramChatId,
      telegramUsername: ctx.farmer.telegramUsername ?? null,
      parcelId: ctx.parcelId,
      parcelAlias: ctx.parcelAlias,
      cooldownMinutes: ctx.cooldownMinutes,
    };
  }
}
