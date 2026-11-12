import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { agroSatApi } from '../../services/agrosat-api.client';
import { useAgroStore } from '../../store/useAgroStore';

export default function ChaosSimulationScreen() {
  const { activeParcelId } = useAgroStore();
  const [lastResult, setLastResult] = useState<string>('');
  const [running, setRunning] = useState(false);

  const runScenario = async (scenario: 'FROST' | 'HEAT_DROUGHT' | 'NDVI_PLAGUE_DROP') => {
    setRunning(true);
    try {
      const res = await agroSatApi.triggerChaosSimulation({
        parcelId: activeParcelId,
        scenario,
      });
      setLastResult(`✅ [${res.scenario}] ${res.description} (${res.triggeredAt})`);
    } catch (err) {
      setLastResult(`❌ Error: ${(err as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>
        ⚡ Módulo 5: Panel Interactivo de Simulación Demo en Vivo
      </Text>
      <Text style={styles.subtitle}>
        Dispara anomalías sintéticas hacia MS1 y MS3 para observar cómo PostgreSQL LISTEN/NOTIFY
        activa MS5, consulta el brief de emergencia en MS4 (DeepSeek) y notifica a Telegram vía n8n.
      </Text>

      <TouchableOpacity
        style={[styles.simCard, { borderColor: '#42A5F5' }]}
        disabled={running}
        onPress={() => void runScenario('FROST')}
      >
        <Text style={styles.simTitle}>❄️ 1. Simular Helada Severa Nocturna (1.9 °C &lt; 4.0 °C)</Text>
        <Text style={styles.simDesc}>
          Inyecta lectura crítica en MS3 -&gt; dispara regla FROST_ALERT en MS5 -&gt; envía prescripción de
          riego térmico a Telegram.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.simCard, { borderColor: '#FF5252' }]}
        disabled={running}
        onPress={() => void runScenario('HEAT_DROUGHT')}
      >
        <Text style={styles.simTitle}>
          🔥💧 2. Simular Golpe de Calor (41.2 °C) y Sequía Radicular (17.8% a 20cm)
        </Text>
        <Text style={styles.simDesc}>
          Dispara regla HEAT_AND_DROUGHT_SHOCK con VPD crítico (&gt; 6.0 kPa) y prescripción urgente
          de Nitrato de Calcio + Boro para prevenir Necrosis Apical.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.simCard, { borderColor: '#FFA726' }]}
        disabled={running}
        onPress={() => void runScenario('NDVI_PLAGUE_DROP')}
      >
        <Text style={styles.simTitle}>
          🛰️🥀 3. Simular Caída Brusca de NDVI (-0.39 puntos — Fusarium / Fuga Cintilla)
        </Text>
        <Text style={styles.simDesc}>
          Genera nueva pasada Sentinel-2 en PostGIS ST_SquareGrid con mancha gaussiana de estrés
          severo y dispara regla SUDDEN_NDVI_DROP.
        </Text>
      </TouchableOpacity>

      {lastResult ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{lastResult}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1512' },
  content: { padding: 16, gap: 14 },
  screenTitle: { color: '#ECFDF5', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#94B8AB', fontSize: 13, lineHeight: 19 },
  simCard: {
    backgroundColor: '#12221D',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  simTitle: { color: '#ECFDF5', fontSize: 15, fontWeight: '700' },
  simDesc: { color: '#94B8AB', fontSize: 12, lineHeight: 18 },
  resultBox: {
    backgroundColor: '#182E27',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2ECC71',
  },
  resultText: { color: '#A7F3D0', fontSize: 13, fontWeight: '600' },
});
