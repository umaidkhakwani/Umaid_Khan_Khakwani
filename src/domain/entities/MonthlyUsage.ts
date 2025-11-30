export class MonthlyUsage {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly year: number,
    public readonly month: number,
    public readonly messageCount: number,
    public readonly lastResetDate: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    userId: string,
    year: number,
    month: number
  ): {
    userId: string;
    year: number;
    month: number;
    messageCount: number;
  } {
    return {
      userId,
      year,
      month,
      messageCount: 0,
    };
  }

  increment(): MonthlyUsage {
    return new MonthlyUsage(
      this.id,
      this.userId,
      this.year,
      this.month,
      this.messageCount + 1,
      this.lastResetDate,
      this.createdAt,
      new Date()
    );
  }

  reset(newYear: number, newMonth: number): MonthlyUsage {
    return new MonthlyUsage(
      this.id,
      this.userId,
      newYear,
      newMonth,
      0,
      new Date(),
      this.createdAt,
      new Date()
    );
  }
}

