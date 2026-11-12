import { ValueObject } from '@agrosat/shared-kernel';
import { WatermelonPhenologicalStageCode } from '@agrosat/service-contracts';

interface WatermelonPhenologyProps {
  daysAfterPlanting: number;
  stage: WatermelonPhenologicalStageCode;
  expectedBaseNdvi: number;
}

export class WatermelonPhenologyVo extends ValueObject<WatermelonPhenologyProps> {
  private constructor(props: WatermelonPhenologyProps) {
    super(props);
  }

  public static fromDaysAfterPlanting(daysAfterPlanting: number): WatermelonPhenologyVo {
    const das = Math.max(0, Math.min(120, Math.round(daysAfterPlanting)));

    let stage: WatermelonPhenologicalStageCode;
    let baseNdvi: number;

    if (das === 0) {
      stage = 'PRE_PLANTING';
      baseNdvi = 0.14;
    } else if (das <= 18) {
      // Etapa 1: Emergencia y establecimiento (0.15 -> 0.28)
      stage = 'EMERGENCE';
      baseNdvi = 0.15 + 0.0072 * das;
    } else if (das <= 40) {
      // Etapa 2: Crecimiento rápido de guías (0.28 -> 0.64)
      stage = 'VINE_GROWTH';
      baseNdvi = 0.28 + 0.0163 * (das - 18);
    } else if (das <= 65) {
      // Etapa 3: Floración, polinización y cuajado (0.65 -> 0.80)
      stage = 'FLOWERING';
      baseNdvi = 0.65 + 0.15 * Math.sin(((das - 40) / 25) * Math.PI);
    } else {
      // Etapa 4: Engorde y maduración previo a cosecha (0.65 -> 0.54)
      stage = 'MATURATION';
      baseNdvi = Math.max(0.50, 0.65 - 0.0045 * (das - 65));
    }

    return new WatermelonPhenologyVo({
      daysAfterPlanting: das,
      stage,
      expectedBaseNdvi: Number(baseNdvi.toFixed(4)),
    });
  }

  get daysAfterPlanting(): number {
    return this.props.daysAfterPlanting;
  }

  get stage(): WatermelonPhenologicalStageCode {
    return this.props.stage;
  }

  get expectedBaseNdvi(): number {
    return this.props.expectedBaseNdvi;
  }
}
