import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { agroSatApi } from '../../services/agrosat-api.client';
import { useAgroStore } from '../../store/useAgroStore';

const QUICK_PROMPTS = [
  '¿Cuánto debo regar hoy según la humedad a 20cm y 40cm?',
  'Analizar caída localizada de NDVI en mi parcela de sandía',
  'Prevención de plagas (Araña Roja / Mosca Blanca) y Fusarium en sandía',
  '¿Cómo prevenir Necrosis Apical (Blossom-End Rot) con Calcio y Boro?',
];

export default function VirtualAgronomistScreen() {
  const { activeParcelId } = useAgroStore();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      role: 'user' | 'ai';
      text: string;
      chunks?: Array<{ documentCode: string; similarityScore: number }>;
    }>
  >([]);

  const sendQuestion = async (qText: string) => {
    const clean = qText.trim();
    if (!clean || loading) return;
    setQuestion('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text: clean }]);

    try {
      const res = await agroSatApi.askVirtualAgronomist({
        parcelId: activeParcelId,
        question: clean,
        topK: 3,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: res.answerMarkdown,
          chunks: res.retrievedChunks,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>
        🧠 Módulo 4: Chat con el Agrónomo Virtual (ONNX 384d + pgvector + DeepSeek)
      </Text>

      <View style={styles.chipsRow}>
        {QUICK_PROMPTS.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={styles.chip}
            onPress={() => void sendQuestion(chip)}
          >
            <Text style={styles.chipText}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.chatArea} contentContainerStyle={{ gap: 10 }}>
        {messages.map((m, idx) => (
          <View
            key={idx}
            style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}
          >
            <Text style={styles.bubbleText}>{m.text}</Text>
            {m.chunks && (
              <View style={styles.chunksRow}>
                {m.chunks.map((c) => (
                  <Text key={c.documentCode} style={styles.chunkBadge}>
                    📚 {c.documentCode} ({Math.round(c.similarityScore * 100)}%)
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
        {loading && (
          <Text style={styles.loadingText}>
            ⏳ Vectorizando consulta en ONNX 384d y consultando a DeepSeek...
          </Text>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="Pregunta sobre riego, NPK/Ca/B, NDVI o plagas en sandía..."
          placeholderTextColor="#94B8AB"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => void sendQuestion(question)}>
          <Text style={styles.sendBtnText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1512', padding: 16, gap: 12 },
  screenTitle: { color: '#ECFDF5', fontSize: 18, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: '#173329',
    borderWidth: 1,
    borderColor: '#2B5B49',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: '#A7F3D0', fontSize: 11 },
  chatArea: {
    flex: 1,
    backgroundColor: '#12221D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#25463B',
    padding: 12,
  },
  bubble: { padding: 12, borderRadius: 10, maxWidth: '92%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1B4D3E' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#182E27' },
  bubbleText: { color: '#ECFDF5', fontSize: 13, lineHeight: 19 },
  chunksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chunkBadge: {
    color: '#26C6DA',
    fontSize: 10,
    backgroundColor: 'rgba(38, 198, 218, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  loadingText: { color: '#FFA726', fontSize: 12 },
  inputBar: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#182E27',
    borderWidth: 1,
    borderColor: '#25463B',
    borderRadius: 8,
    color: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendBtn: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 8,
  },
  sendBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
