import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AGROSAT_ENV } from '../../config/env';
import { agroSatApi } from '../../services/agrosat-api.client';
import { useAgroStore } from '../../store/useAgroStore';

export default function TelemetryAndAlertsScreen() {
  const { activeParcelId, telegramChatId, setTelegramChatId } = useAgroStore();
  const [telemetry, setTelemetry] = useState<Awaited<
    ReturnType<typeof agroSatApi.getTelemetryHistory>
  > | null>(null);
  const [alerts, setAlerts] = useState<
    Awaited<ReturnType<typeof agroSatApi.listParcelAlerts>>
  >([]);
  const [statusMsg, setStatusMsg] = useState<string>('');

  useEffect(() => {
    void loadTelemetryAndAlerts();
  }, [activeParcelId]);

  const loadTelemetryAndAlerts = async () => {
    const [telRes, alertsRes] = await Promise.all([
      agroSatApi.getTelemetryHistory(activeParcelId, 24),
      agroSatApi.listParcelAlerts(activeParcelId),
    ]);
    setTelemetry(telRes);
    setAlerts(alertsRes);
  };

  const handleLinkTelegram = async () => {
    await agroSatApi.linkTelegramSubscription({
      farmerId: AGROSAT_ENV.DEFAULT_FARMER_ID,
      fullName: 'Productor Demo AgroSat',
      telegramChatId,
      parcelId: activeParcelId,
      parcelAlias: 'Parcela Sandía Lote Norte',
    });
    setStatusMsg(`✅ Telegram Chat ID (${telegramChatId}) vinculado con éxito en MS5.`);
  };

  const cur = telemetry?.summary.current;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>
        🌡️💧 Módulo 3: Telemetría Climática IoT (MS3) y Alertas Tempranas (MS5)
      </Text>

      {cur && (
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Temp. Ambiente</Text>
            <Text style={styles.kpiValue}>{cur.ambientTempC} °C</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Humedad Suelo 20cm</Text>
            <Text style={styles.kpiValue}>{cur.soilMoisture20cmPct}%</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Humedad Suelo 40cm</Text>
            <Text style={styles.kpiValue}>{cur.soilMoisture40cmPct}%</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Déficit VPD</Text>
            <Text style={styles.kpiValue}>{cur.vpdKpa} kPa</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📲 Vinculación con Bot de Telegram (n8n + MS5)</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={telegramChatId}
            onChangeText={setTelegramChatId}
            placeholder="Telegram Chat ID"
            placeholderTextColor="#94B8AB"
          />
          <TouchableOpacity style={styles.btn} onPress={handleLinkTelegram}>
            <Text style={styles.btnText}>Vincular Chat ID</Text>
          </TouchableOpacity>
        </View>
        {statusMsg ? <Text style={styles.statusText}>{statusMsg}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          🚨 Historial de Alertas Críticas Disparadas ({alerts.length})
        </Text>
        {alerts.map((a) => (
          <View key={a.alertId} style={styles.alertBox}>
            <Text style={styles.alertTitle}>{a.title}</Text>
            <Text style={styles.alertAction}>{a.recommendedAction}</Text>
            <Text style={styles.alertMeta}>
              Regla: {a.ruleCode} • Severidad: {a.severity} • Estado n8n: {a.n8nWebhookStatus}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1512' },
  content: { padding: 16, gap: 14 },
  screenTitle: { color: '#ECFDF5', fontSize: 18, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#12221D',
    borderWidth: 1,
    borderColor: '#25463B',
    borderRadius: 10,
    padding: 12,
  },
  kpiLabel: { color: '#94B8AB', fontSize: 11 },
  kpiValue: { color: '#2ECC71', fontSize: 20, fontWeight: '800', marginTop: 4 },
  card: {
    backgroundColor: '#12221D',
    borderWidth: 1,
    borderColor: '#25463B',
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  cardTitle: { color: '#A7F3D0', fontSize: 14, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#182E27',
    borderWidth: 1,
    borderColor: '#25463B',
    borderRadius: 8,
    color: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btn: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  statusText: { color: '#2ECC71', fontSize: 12 },
  alertBox: {
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
    borderRadius: 6,
    padding: 10,
    gap: 4,
  },
  alertTitle: { color: '#FF8A80', fontWeight: '700', fontSize: 13 },
  alertAction: { color: '#ECFDF5', fontSize: 12 },
  alertMeta: { color: '#94B8AB', fontSize: 10 },
});
