import { create } from 'zustand';
import { AGROSAT_ENV } from '../config/env';

interface AgroState {
  activeParcelId: string;
  ndviOpacity: number;
  telegramChatId: string;
  setActiveParcelId: (parcelId: string) => void;
  setNdviOpacity: (opacity: number) => void;
  setTelegramChatId: (chatId: string) => void;
}

export const useAgroStore = create<AgroState>((set) => ({
  activeParcelId: AGROSAT_ENV.DEFAULT_PARCEL_ID,
  ndviOpacity: 0.72,
  telegramChatId: AGROSAT_ENV.DEFAULT_TELEGRAM_CHAT_ID,
  setActiveParcelId: (activeParcelId) => set({ activeParcelId }),
  setNdviOpacity: (ndviOpacity) => set({ ndviOpacity }),
  setTelegramChatId: (telegramChatId) => set({ telegramChatId }),
}));
