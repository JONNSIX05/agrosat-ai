import { ValueObject } from '@agrosat/shared-kernel';
import { EviIndexVo } from './evi-index.vo';
import { NdviIndexVo } from './ndvi-index.vo';

interface SpectralBandsProps {
  b02Blue: number;
  b04Red: number;
  b08Nir: number;
  ndvi: NdviIndexVo;
  evi: EviIndexVo;
}

export class SpectralBandsVo extends ValueObject<SpectralBandsProps> {
  private constructor(props: SpectralBandsProps) {
    super(props);
  }

  /**
   * A partir de un NDVI objetivo en [-0.10, 0.85] y una reflectancia NIR (B08) realista,
   * despeja físicamente la reflectancia Roja (B04) y Azul (B02) de Sentinel-2.
   */
  public static fromTargetNdvi(targetNdvi: number, baseNir = 0.44): SpectralBandsVo {
    const clampedNdvi = Math.max(-0.1, Math.min(0.85, targetNdvi));
    const b08Nir = Number(Math.max(0.12, Math.min(0.62, baseNir)).toFixed(5));

    // De NDVI = (B08 - B04) / (B08 + B04) => B04 = B08 * (1 - NDVI) / (1 + NDVI)
    const rawB04 = (b08Nir * (1 - clampedNdvi)) / Math.max(0.05, 1 + clampedNdvi);
    const b04Red = Number(Math.max(0.015, Math.min(0.55, rawB04)).toFixed(5));
    const b02Blue = Number(Math.max(0.01, Math.min(0.35, b04Red * 0.62)).toFixed(5));

    // Verificación por fórmula estándar NDVI = (B08 - B04) / (B08 + B04)
    const computedNdvi = (b08Nir - b04Red) / (b08Nir + b04Red);
    const ndviVo = NdviIndexVo.create(computedNdvi);
    const eviVo = EviIndexVo.fromBands(b02Blue, b04Red, b08Nir);

    return new SpectralBandsVo({
      b02Blue,
      b04Red,
      b08Nir,
      ndvi: ndviVo,
      evi: eviVo,
    });
  }

  public static fromPersisted(params: {
    b02Blue: number;
    b04Red: number;
    b08Nir: number;
    ndvi: number;
    evi: number;
  }): SpectralBandsVo {
    return new SpectralBandsVo({
      b02Blue: params.b02Blue,
      b04Red: params.b04Red,
      b08Nir: params.b08Nir,
      ndvi: NdviIndexVo.create(params.ndvi),
      evi: EviIndexVo.fromValue(params.evi),
    });
  }

  get b02Blue(): number {
    return this.props.b02Blue;
  }

  get b04Red(): number {
    return this.props.b04Red;
  }

  get b08Nir(): number {
    return this.props.b08Nir;
  }

  get ndvi(): NdviIndexVo {
    return this.props.ndvi;
  }

  get evi(): EviIndexVo {
    return this.props.evi;
  }
}
