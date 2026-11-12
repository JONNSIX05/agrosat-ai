import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AgroMapProps } from './AgroMap.types';

/**
 * Motor Geoespacial Web (React Native Web + Esri World Imagery / SVG Vectorial).
 * Renderiza el polígono de la parcela y la grilla GeoJSON de calor NDVI/EVI en navegador sin requerir API keys de pago.
 */
export const AgroMap: React.FC<AgroMapProps> = ({
  parcelBoundary,
  subcellFeatures,
  ndviOpacity,
  onSubcellSelect,
}) => {
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>
          🛰️ Grilla Satelital PostGIS ST_SquareGrid ({subcellFeatures.length} subceldas activas)
        </Text>
        <Text style={styles.subText}>
          Parcela: {parcelBoundary ? 'Polígono GeoJSON EPSG:4326 Validado' : 'Cargando...'}
        </Text>
      </View>

      <View style={styles.gridWrapper}>
        {subcellFeatures.map((feature) => {
          const isSelected = selectedCellId === feature.id;
          return (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.cellBox,
                {
                  backgroundColor: feature.properties.fillColorHex,
                  opacity: ndviOpacity,
                  borderColor:
                    isSelected || feature.properties.isStressedCell ? '#FF1744' : '#0B1512',
                  borderWidth: isSelected || feature.properties.isStressedCell ? 2 : 0.5,
                },
              ]}
              onPress={() => {
                setSelectedCellId(feature.id);
                onSubcellSelect?.(feature);
              }}
            >
              <Text style={styles.cellLabel}>{feature.properties.ndvi.toFixed(2)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0E1F1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#25463B',
    padding: 12,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  headerText: { color: '#A7F3D0', fontSize: 13, fontWeight: '700' },
  subText: { color: '#94B8AB', fontSize: 11 },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
  },
  cellBox: {
    width: 34,
    height: 26,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
