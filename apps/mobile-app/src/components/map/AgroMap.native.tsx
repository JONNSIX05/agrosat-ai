import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { MapPressEvent, Polygon } from 'react-native-maps';
import { AgroMapProps } from './AgroMap.types';

/**
 * Motor Geoespacial Nativo (iOS / Android) con react-native-maps.
 * Renderiza el polígono de la parcela y la malla PostGIS ST_SquareGrid de 168 subceldas NDVI/EVI.
 */
export const AgroMap: React.FC<AgroMapProps> = ({
  center,
  parcelBoundary,
  subcellFeatures,
  ndviOpacity,
  isDrawingMode = false,
  onPolygonComplete,
  onSubcellSelect,
}) => {
  const [draftPoints, setDraftPoints] = useState<Array<{ latitude: number; longitude: number }>>([]);

  const handleMapPress = (event: MapPressEvent) => {
    if (!isDrawingMode) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setDraftPoints((prev) => [...prev, { latitude, longitude }]);
  };

  const finishDrawing = () => {
    if (draftPoints.length < 3 || !onPolygonComplete) return;
    const ring = draftPoints.map((pt) => [
      Number(pt.longitude.toFixed(6)),
      Number(pt.latitude.toFixed(6)),
    ]);
    ring.push(ring[0]);
    onPolygonComplete({
      type: 'Polygon',
      coordinates: [ring],
    });
    setDraftPoints([]);
  };

  const boundaryCoords =
    parcelBoundary?.coordinates?.[0]?.map(([lon, lat]) => ({
      latitude: lat,
      longitude: lon,
    })) ?? [];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapType="satellite"
        initialRegion={{
          latitude: center.lat,
          longitude: center.lon,
          latitudeDelta: 0.0045,
          longitudeDelta: 0.0045,
        }}
        onPress={handleMapPress}
      >
        {boundaryCoords.length >= 3 && (
          <Polygon
            coordinates={boundaryCoords}
            strokeColor="#00E676"
            strokeWidth={3}
            fillColor="rgba(0, 230, 118, 0.06)"
          />
        )}

        {subcellFeatures.map((feature) => {
          const coords =
            feature.geometry?.coordinates?.[0]?.map(([lon, lat]) => ({
              latitude: lat,
              longitude: lon,
            })) ?? [];
          if (coords.length < 3) return null;

          return (
            <Polygon
              key={feature.id}
              coordinates={coords}
              strokeColor={feature.properties.isStressedCell ? '#FF1744' : '#1B5E20'}
              strokeWidth={feature.properties.isStressedCell ? 1.5 : 0.4}
              fillColor={hexToRgba(feature.properties.fillColorHex, ndviOpacity)}
              tappable
              onPress={() => onSubcellSelect?.(feature)}
            />
          );
        })}

        {draftPoints.length >= 2 && (
          <Polygon
            coordinates={draftPoints}
            strokeColor="#FFEB3B"
            strokeWidth={2}
            fillColor="rgba(255, 235, 59, 0.22)"
          />
        )}
      </MapView>

      {isDrawingMode && (
        <View style={styles.drawOverlay}>
          <Text style={styles.drawText}>Vértices GPS trazados: {draftPoints.length}</Text>
          {draftPoints.length >= 3 && (
            <TouchableOpacity style={styles.saveBtn} onPress={finishDrawing}>
              <Text style={styles.saveBtnText}>Guardar Polígono en PostGIS</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || '#2ecc71').replace('#', '');
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 340, borderRadius: 12, overflow: 'hidden' },
  map: { flex: 1 },
  drawOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(11, 21, 18, 0.92)',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawText: { color: '#ECFDF5', fontSize: 12, fontWeight: '600' },
  saveBtn: { backgroundColor: '#1B5E20', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
