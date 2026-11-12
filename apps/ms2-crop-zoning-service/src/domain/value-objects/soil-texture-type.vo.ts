import { DomainException, ValueObject } from '@agrosat/shared-kernel';

export type SoilTextureCode = 'FRANCO_ARENOSA' | 'FRANCA' | 'ARENOSA' | 'ARCILLOSA';

interface SoilTextureProps {
  texture: SoilTextureCode;
}

export class SoilTextureTypeVo extends ValueObject<SoilTextureProps> {
  private static readonly VALID_TEXTURES: SoilTextureCode[] = [
    'FRANCO_ARENOSA',
    'FRANCA',
    'ARENOSA',
    'ARCILLOSA',
  ];

  private constructor(props: SoilTextureProps) {
    super(props);
  }

  public static create(texture: string): SoilTextureTypeVo {
    const normalized = texture.toUpperCase() as SoilTextureCode;
    if (!this.VALID_TEXTURES.includes(normalized)) {
      throw new DomainException(
        'INVALID_SOIL_TEXTURE',
        `Textura de suelo inválida (${texture}). Valores permitidos: ${this.VALID_TEXTURES.join(', ')}`,
      );
    }
    return new SoilTextureTypeVo({ texture: normalized });
  }

  get value(): SoilTextureCode {
    return this.props.texture;
  }

  /**
   * Puntaje sobre 25 puntos máximos (Óptimo para sandía: FRANCO_ARENOSA).
   */
  public computeScoreOutOf25(): { score: number; limitingReason?: string; recommendation?: string } {
    switch (this.props.texture) {
      case 'FRANCO_ARENOSA':
        return {
          score: 25,
          recommendation:
            'Textura Franco-Arenosa ideal para sandía: excelente aireación radicular y rápido calentamiento primaveral.',
        };
      case 'FRANCA':
        return {
          score: 22,
          recommendation:
            'Textura Franca muy favorable: buena retención de humedad y nutrientes; conformar camas altas de 25 cm.',
        };
      case 'ARENOSA':
        return {
          score: 16,
          limitingReason: 'Textura Arenosa con baja retención de humedad y alta lixiviación de Nitrógeno y Potasio',
          recommendation:
            'Incorporar 20-30 ton/ha de composta madura y fraccionar el riego por goteo en 3 pulsos cortos diarios.',
        };
      case 'ARCILLOSA':
        return {
          score: 7,
          limitingReason: 'Textura Arcillosa pesada con riesgo severo de compactación y asfixia radicular en sandía',
          recommendation:
            'Realizar subsolado profundo (50 cm), levantar camas de 35 cm de altura y evitar láminas de riego prolongadas.',
        };
    }
  }
}
