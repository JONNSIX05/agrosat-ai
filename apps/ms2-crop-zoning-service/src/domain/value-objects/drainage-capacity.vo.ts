import { DomainException, ValueObject } from '@agrosat/shared-kernel';

export type DrainageCapacityCode = 'OPTIMO_BUENO' | 'MODERADO' | 'DEFICIENTE';

interface DrainageProps {
  level: DrainageCapacityCode;
}

export class DrainageCapacityVo extends ValueObject<DrainageProps> {
  private static readonly VALID_LEVELS: DrainageCapacityCode[] = [
    'OPTIMO_BUENO',
    'MODERADO',
    'DEFICIENTE',
  ];

  private constructor(props: DrainageProps) {
    super(props);
  }

  public static create(level: string): DrainageCapacityVo {
    const normalized = level.toUpperCase() as DrainageCapacityCode;
    if (!this.VALID_LEVELS.includes(normalized)) {
      throw new DomainException(
        'INVALID_DRAINAGE_LEVEL',
        `Nivel de drenaje inválido (${level}). Permitidos: ${this.VALID_LEVELS.join(', ')}`,
      );
    }
    return new DrainageCapacityVo({ level: normalized });
  }

  get value(): DrainageCapacityCode {
    return this.props.level;
  }

  /**
   * Puntaje sobre 20 puntos máximos para cultivo de sandía.
   */
  public computeScoreOutOf20(): { score: number; limitingReason?: string; recommendation?: string } {
    switch (this.props.level) {
      case 'OPTIMO_BUENO':
        return { score: 20 };
      case 'MODERADO':
        return {
          score: 14,
          recommendation:
            'Drenaje moderado: construir camas de siembra elevadas (30 cm) y monitorear sensor de humedad a 40 cm para evitar saturación.',
        };
      case 'DEFICIENTE':
        return {
          score: 4,
          limitingReason: 'Drenaje interno deficiente con alto riesgo de pudrición de cuello y raíz (Phytophthora y Pythium)',
          recommendation:
            'Trazar zanjas de drenaje perimetral, subsolar a 50 cm e instalar acolchado sobre camas altas antes de sembrar.',
        };
    }
  }
}
