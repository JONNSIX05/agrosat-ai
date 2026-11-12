import { AssembledAgronomicContext } from '../../../domain/entities/agronomic-consultation.aggregate';

export const MICROSERVICES_CONTEXT_PORT = Symbol('MICROSERVICES_CONTEXT_PORT');

export interface MicroservicesContextPort {
  assembleParcelContext(parcelId: string): Promise<AssembledAgronomicContext>;
  resolveParcelIdByTelegramChatId(telegramChatId: string): Promise<string>;
}
