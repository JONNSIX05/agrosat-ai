import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { PostgresService } from '@agrosat/shared-kernel';
import {
  FarmerAlertRepositoryPort,
  ParcelSubscriberContext,
} from '../../application/ports/out/farmer-alert-repository.port';
import { FarmerProfileEntity } from '../../domain/entities/farmer-profile.entity';
import {
  N8nWebhookDispatchStatus,
  TriggeredAlertAggregate,
} from '../../domain/entities/triggered-alert.aggregate';
import {
  AlertSeverityLevel,
  WatermelonAlertRuleCode,
} from '../../domain/value-objects/watermelon-alert-rule.vo';

interface SubscriberRow {
  farmer_id: string;
  full_name: string;
  phone_number: string | null;
  telegram_chat_id: string;
  telegram_username: string | null;
  is_notifications_enabled: boolean;
  parcel_id: string;
  parcel_alias: string;
  cooldown_minutes: number;
  centroid_lon: string | number | null;
  centroid_lat: string | number | null;
}

@Injectable()
export class PostgresFarmerAlertRepository implements FarmerAlertRepositoryPort {
  constructor(private readonly pg: PostgresService) {}

  public async upsertFarmerAndSubscription(params: {
    farmerId?: string;
    fullName: string;
    phoneNumber?: string;
    telegramChatId: string;
    telegramUsername?: string;
    parcelId: string;
    parcelAlias: string;
    cooldownMinutes: number;
  }): Promise<ParcelSubscriberContext> {
    const farmerRes = await this.pg.query<{
      id: string;
      full_name: string;
      phone_number: string | null;
      telegram_chat_id: string;
      telegram_username: string | null;
      is_notifications_enabled: boolean;
    }>(
      `
      INSERT INTO ms5_alerts.farmers (
        id,
        full_name,
        phone_number,
        telegram_chat_id,
        telegram_username,
        is_notifications_enabled
      ) VALUES (
        $1::uuid,
        $2::varchar,
        $3::varchar,
        $4::varchar,
        $5::varchar,
        TRUE
      )
      ON CONFLICT (telegram_chat_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone_number = COALESCE(EXCLUDED.phone_number, ms5_alerts.farmers.phone_number),
        telegram_username = COALESCE(EXCLUDED.telegram_username, ms5_alerts.farmers.telegram_username),
        is_notifications_enabled = TRUE
      RETURNING *;
      `,
      [
        params.farmerId ?? randomUUID(),
        params.fullName,
        params.phoneNumber ?? null,
        params.telegramChatId,
        params.telegramUsername ?? null,
      ],
    );

    const farmerRow = farmerRes.rows[0];

    await this.pg.query(
      `
      INSERT INTO ms5_alerts.farmer_parcel_subscriptions (
        farmer_id,
        parcel_id,
        parcel_alias,
        cooldown_minutes
      ) VALUES (
        $1::uuid,
        $2::uuid,
        $3::varchar,
        $4::int
      )
      ON CONFLICT (farmer_id, parcel_id) DO UPDATE SET
        parcel_alias = EXCLUDED.parcel_alias,
        cooldown_minutes = EXCLUDED.cooldown_minutes;
      `,
      [farmerRow.id, params.parcelId, params.parcelAlias, params.cooldownMinutes],
    );

    const found = await this.findSubscriberForParcel(params.parcelId);
    if (found) {
      return found;
    }

    return {
      farmer: FarmerProfileEntity.create(
        {
          fullName: farmerRow.full_name,
          phoneNumber: farmerRow.phone_number,
          telegramChatId: farmerRow.telegram_chat_id,
          telegramUsername: farmerRow.telegram_username,
          isNotificationsEnabled: farmerRow.is_notifications_enabled,
        },
        farmerRow.id,
      ),
      parcelId: params.parcelId,
      parcelAlias: params.parcelAlias,
      cooldownMinutes: params.cooldownMinutes,
      centroid: { lon: -103.4138, lat: 25.542 },
    };
  }

  public async findSubscriberForParcel(
    parcelId: string,
  ): Promise<ParcelSubscriberContext | null> {
    const res = await this.pg.query<SubscriberRow>(
      `
      SELECT
        f.id AS farmer_id,
        f.full_name,
        f.phone_number,
        f.telegram_chat_id,
        f.telegram_username,
        f.is_notifications_enabled,
        COALESCE(s.parcel_id, p.id, $1::uuid) AS parcel_id,
        COALESCE(s.parcel_alias, p.parcel_name, 'Parcela Sandía AgroSat') AS parcel_alias,
        COALESCE(s.cooldown_minutes, 15) AS cooldown_minutes,
        ST_X(p.centroid_geom) AS centroid_lon,
        ST_Y(p.centroid_geom) AS centroid_lat
      FROM ms5_alerts.farmers f
      LEFT JOIN ms5_alerts.farmer_parcel_subscriptions s
        ON s.farmer_id = f.id AND s.parcel_id = $1::uuid
      LEFT JOIN ms2_zoning.parcels p
        ON p.id = $1::uuid
      ORDER BY (s.parcel_id IS NOT NULL) DESC, f.created_at DESC
      LIMIT 1;
      `,
      [parcelId],
    );

    if (res.rowCount === 0) {
      return null;
    }

    const r = res.rows[0];
    return {
      farmer: FarmerProfileEntity.create(
        {
          fullName: r.full_name,
          phoneNumber: r.phone_number,
          telegramChatId: r.telegram_chat_id,
          telegramUsername: r.telegram_username,
          isNotificationsEnabled: Boolean(r.is_notifications_enabled),
        },
        r.farmer_id,
      ),
      parcelId: r.parcel_id,
      parcelAlias: r.parcel_alias,
      cooldownMinutes: Number(r.cooldown_minutes),
      centroid: {
        lon: Number(Number(r.centroid_lon ?? -103.4138).toFixed(6)),
        lat: Number(Number(r.centroid_lat ?? 25.542).toFixed(6)),
      },
    };
  }

  public async findFarmerByTelegramChatId(
    telegramChatId: string,
  ): Promise<ParcelSubscriberContext | null> {
    const res = await this.pg.query<SubscriberRow>(
      `
      SELECT
        f.id AS farmer_id,
        f.full_name,
        f.phone_number,
        f.telegram_chat_id,
        f.telegram_username,
        f.is_notifications_enabled,
        COALESCE(s.parcel_id, '00000000-0000-0000-0000-000000000001'::uuid) AS parcel_id,
        COALESCE(s.parcel_alias, 'Parcela Sandía Lote Norte') AS parcel_alias,
        COALESCE(s.cooldown_minutes, 15) AS cooldown_minutes,
        ST_X(p.centroid_geom) AS centroid_lon,
        ST_Y(p.centroid_geom) AS centroid_lat
      FROM ms5_alerts.farmers f
      LEFT JOIN ms5_alerts.farmer_parcel_subscriptions s
        ON s.farmer_id = f.id
      LEFT JOIN ms2_zoning.parcels p
        ON p.id = COALESCE(s.parcel_id, '00000000-0000-0000-0000-000000000001'::uuid)
      WHERE f.telegram_chat_id = $1::varchar
      LIMIT 1;
      `,
      [telegramChatId],
    );

    if (res.rowCount === 0) {
      return null;
    }

    const r = res.rows[0];
    return {
      farmer: FarmerProfileEntity.create(
        {
          fullName: r.full_name,
          phoneNumber: r.phone_number,
          telegramChatId: r.telegram_chat_id,
          telegramUsername: r.telegram_username,
          isNotificationsEnabled: Boolean(r.is_notifications_enabled),
        },
        r.farmer_id,
      ),
      parcelId: r.parcel_id,
      parcelAlias: r.parcel_alias,
      cooldownMinutes: Number(r.cooldown_minutes),
      centroid: {
        lon: Number(Number(r.centroid_lon ?? -103.4138).toFixed(6)),
        lat: Number(Number(r.centroid_lat ?? 25.542).toFixed(6)),
      },
    };
  }

  public async saveTriggeredAlert(
    alert: TriggeredAlertAggregate,
  ): Promise<TriggeredAlertAggregate> {
    await this.pg.query(
      `
      INSERT INTO ms5_alerts.triggered_alerts (
        id,
        parcel_id,
        farmer_id,
        rule_code,
        severity,
        title,
        recommended_action,
        trigger_metrics,
        n8n_webhook_status,
        triggered_at
      ) VALUES (
        $1::uuid,
        $2::uuid,
        $3::uuid,
        $4::varchar,
        $5::varchar,
        $6::varchar,
        $7::text,
        $8::jsonb,
        $9::varchar,
        $10::timestamptz
      );
      `,
      [
        alert.id,
        alert.parcelId,
        alert.farmerId,
        alert.ruleCode,
        alert.severity,
        alert.title,
        alert.recommendedAction,
        JSON.stringify(alert.triggerMetrics),
        alert.n8nWebhookStatus,
        alert.triggeredAt.toISOString(),
      ],
    );

    return alert;
  }

  public async updateAlertWebhookStatus(
    alertId: string,
    status: N8nWebhookDispatchStatus,
  ): Promise<void> {
    await this.pg.query(
      `
      UPDATE ms5_alerts.triggered_alerts
      SET n8n_webhook_status = $2::varchar
      WHERE id = $1::uuid;
      `,
      [alertId, status],
    );
  }

  public async findAlertsByParcelId(
    parcelId: string,
    limit = 30,
  ): Promise<TriggeredAlertAggregate[]> {
    const res = await this.pg.query<{
      id: string;
      parcel_id: string;
      farmer_id: string;
      rule_code: WatermelonAlertRuleCode;
      severity: AlertSeverityLevel;
      title: string;
      recommended_action: string;
      trigger_metrics: Record<string, unknown>;
      n8n_webhook_status: N8nWebhookDispatchStatus;
      triggered_at: Date | string;
    }>(
      `
      SELECT *
      FROM ms5_alerts.triggered_alerts
      WHERE parcel_id = $1::uuid
      ORDER BY triggered_at DESC
      LIMIT $2::int;
      `,
      [parcelId, limit],
    );

    return res.rows.map((r) =>
      TriggeredAlertAggregate.create(
        {
          parcelId: r.parcel_id,
          farmerId: r.farmer_id,
          ruleCode: r.rule_code,
          severity: r.severity,
          title: r.title,
          recommendedAction: r.recommended_action,
          triggerMetrics: r.trigger_metrics ?? {},
          n8nWebhookStatus: r.n8n_webhook_status,
          triggeredAt: new Date(r.triggered_at),
        },
        r.id,
      ),
    );
  }
}
