import { randomUUID } from 'crypto';

export abstract class Entity<TProps> {
  protected readonly _id: string;
  protected readonly props: TProps;

  protected constructor(props: TProps, id?: string) {
    this._id = id ?? randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  public equals(object?: Entity<TProps>): boolean {
    if (object === null || object === undefined) {
      return false;
    }
    if (this === object) {
      return true;
    }
    return this._id === object._id;
  }
}
