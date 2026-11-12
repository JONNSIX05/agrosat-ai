import React from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';

const NAV_ITEMS = [
  { path: '/', label: '🛰️ Parcelas y NDVI (MS1/MS2)' },
  { path: '/telemetry', label: '🌡️ Telemetría y Alertas (MS3/MS5)' },
  { path: '/agronomist', label: '🧠 Agrónomo Virtual RAG (MS4)' },
  { path: '/simulation', label: '⚡ Simulación Chaos Demo' },
];

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 900;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={[styles.root, isDesktopWeb && styles.rootDesktop]}>
      {isDesktopWeb && (
        <View style={styles.sidebar}>
          <Text style={styles.brandTitle}>🍉 AgroSat AI</Text>
          <Text style={styles.brandSubtitle}>Sandía GIS + RAG Multiplataforma</Text>
          <View style={styles.sidebarNav}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.path;
              return (
                <Text
                  key={item.path}
                  onPress={() => router.push(item.path as never)}
                  style={[styles.navLink, active && styles.navLinkActive]}
                >
                  {item.label}
                </Text>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.contentArea}>
        <Slot />
      </View>

      {!isDesktopWeb && (
        <View style={styles.bottomBar}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.path;
            return (
              <Text
                key={item.path}
                onPress={() => router.push(item.path as never)}
                style={[styles.bottomTab, active && styles.bottomTabActive]}
              >
                {item.label.split(' ')[0]} {item.label.split(' ')[1]}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1512' },
  rootDesktop: { flexDirection: 'row' },
  sidebar: {
    width: 260,
    backgroundColor: '#10201B',
    borderRightWidth: 1,
    borderRightColor: '#25463B',
    padding: 18,
  },
  brandTitle: { color: '#ECFDF5', fontSize: 20, fontWeight: '800' },
  brandSubtitle: { color: '#94B8AB', fontSize: 12, marginTop: 4, marginBottom: 22 },
  sidebarNav: { gap: 8 },
  navLink: {
    color: '#94B8AB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  navLinkActive: {
    backgroundColor: '#1B5E20',
    color: '#FFFFFF',
  },
  contentArea: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#10201B',
    borderTopWidth: 1,
    borderTopColor: '#25463B',
    paddingVertical: 12,
  },
  bottomTab: { color: '#94B8AB', fontSize: 12, fontWeight: '600' },
  bottomTabActive: { color: '#2ECC71', fontWeight: '800' },
});
