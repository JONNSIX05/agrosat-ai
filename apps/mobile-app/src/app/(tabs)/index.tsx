import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AgroMap } from '../../components/map/AgroMap.web';
import { agroSatApi, ParcelDto, SubcellFeature } from '../../services/agrosat-api.client';
import { useAgroStore } from '../../store/useAgroStore';

export default function ParcelsAndNdviScreen() {
  const { activeParcelId, ndviOpacity, setActiveParcelId } = useAgroStore();
  const [parcels, setParcels] = useState<ParcelDto[]>([]);
  const [subcells, setSubcells] = useState<SubcellFeature[]>([]);
  const [selectedCell, setSelectedCell] = useState<SubcellFeature | null>(null);
  const [sceneMeta, setSceneMeta] = useState<{
    sceneCode: string;
    daysAfterPlanting: number;
    phenologicalStage: string;
    meanNdvi: number;
  } | null>(null);

  useEffect(() => {
    void loadData();
  }, [activeParcelId]);

  const loadData = async () => {
    const [parcelList, gridData] = await Promise.all([
      agroSatApi.listParcels(),
      agroSatApi.getLatestSatelliteGrid(activeParcelId),
    ]);
    setParcels(parcelList);
    setSubcells(gridData.gridGeoJson?.features ?? []);
    setSceneMeta(gridData.scene);
  };

  const activeParcel = parcels.find((p) => p.parcelId === activeParcelId) ?? parcels[0];
  const suit = activeParcel?.soilSuitability;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>
        🍉 Módulo 1 y 2: Zonificación PostGIS (MS2) y Malla Satelital NDVI/EVI (MS1)
      </Text>

      <View style={styles.parcelSelector}>
        {parcels.map((p) => (
          <TouchableOpacity
            key={p.parcelId}
            style={[
              styles.parcelChip,
              p.parcelId === activeParcelId && styles.parcelChipActive,
            ]}
            onPress={() => setActiveParcelId(p.parcelId)}
          >
            <Text style={styles.parcelChipText}>
              {p.parcelName} ({p.areaHectares} ha)
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeParcel && (
        <AgroMap
          center={activeParcel.centroid}
          parcelBoundary={activeParcel.boundaryGeoJson}
          subcellFeatures={subcells}
          ndviOpacity={ndviOpacity}
          onSubcellSelect={(cell) => setSelectedCell(cell)}
        />
      )}

      {selectedCell && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🔍 Inspección de Subcelda PostGIS ({selectedCell.properties.row},{' '}
            {selectedCell.properties.col})
          </Text>
          <Text style={styles.cardBody}>
            NDVI: {selectedCell.properties.ndvi} • EVI: {selectedCell.properties.evi} • Vigor:{' '}
            {selectedCell.properties.vigorLevel} • B04 Red: {selectedCell.properties.bandB04Red} •
            B08 NIR: {selectedCell.properties.bandB08Nir}
          </Text>
        </View>
      )}

      {suit && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🌱 Tarjeta de Aptitud Edáfica para Sandía — Score: {suit.viabilityScorePct}% (
            {suit.suitabilityCategory})
          </Text>
          <Text style={styles.cardBody}>
            • Textura de Suelo: {suit.soilTexture} | pH Simulado: {suit.phLevel} | Drenaje:{' '}
            {suit.drainageLevel}
          </Text>
          <Text style={styles.cardBody}>
            • Altitud: {suit.altitudeMsnm} msnm | Radiación Solar: {suit.solarRadiationMjm2}{' '}
            MJ/m²/día | Pendiente: {suit.slopePct}%
          </Text>
        </View>
      )}

      {sceneMeta && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            🛰️ Escena Sentinel-2 Activa: {sceneMeta.sceneCode}
          </Text>
          <Text style={styles.cardBody}>
            Día después de siembra: {sceneMeta.daysAfterPlanting} DDS • Etapa Fenológica:{' '}
            {sceneMeta.phenologicalStage} • NDVI Medio: {sceneMeta.meanNdvi}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1512' },
  content: { padding: 16, gap: 14 },
  screenTitle: { color: '#ECFDF5', fontSize: 18, fontWeight: '700' },
  parcelSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  parcelChip: {
    backgroundColor: '#12221D',
    borderWidth: 1,
    borderColor: '#25463B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  parcelChipActive: { backgroundColor: '#1B5E20', borderColor: '#2ECC71' },
  parcelChipText: { color: '#ECFDF5', fontSize: 12, fontWeight: '600' },
  card: {
    backgroundColor: '#12221D',
    borderWidth: 1,
    borderColor: '#25463B',
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  cardTitle: { color: '#A7F3D0', fontSize: 14, fontWeight: '700' },
  cardBody: { color: '#ECFDF5', fontSize: 13 },
});
