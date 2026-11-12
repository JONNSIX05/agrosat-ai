import { DomainException } from './domain.exception';

export class Result<T, E = DomainException> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
    Object.freeze(this);
  }

  public static ok<U, F = DomainException>(value?: U): Result<U, F> {
    return new Result<U, F>(true, value);
  }

  public static fail<U, F = DomainException>(error: F): Result<U, F> {
    return new Result<U, F>(false, undefined, error);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot retrieve the value of a failed Result. Check error instead.');
    }
    return this._value as T;
  }

  public getError(): E {
    if (this.isSuccess) {
      throw new Error('Cannot retrieve the error of a successful Result.');
    }
    return this._error as E;
  }
}
