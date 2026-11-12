import { Entity } from '@agrosat/shared-kernel';

export interface FarmerProfileProps {
  fullName: string;
  phoneNumber?: string | null;
  telegramChatId: string;
  telegramUsername?: string | null;
  isNotificationsEnabled: boolean;
}

export class FarmerProfileEntity extends Entity<FarmerProfileProps> {
  private constructor(props: FarmerProfileProps, id?: string) {
    super(props, id);
  }

  public static create(props: FarmerProfileProps, id?: string): FarmerProfileEntity {
    return new FarmerProfileEntity(props, id);
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get phoneNumber(): string | null | undefined {
    return this.props.phoneNumber;
  }

  get telegramChatId(): string {
    return this.props.telegramChatId;
  }

  get telegramUsername(): string | null | undefined {
    return this.props.telegramUsername;
  }

  get isNotificationsEnabled(): boolean {
    return this.props.isNotificationsEnabled;
  }
}
