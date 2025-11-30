export class ChatMessage {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly question: string,
    public readonly answer: string,
    public readonly tokens: number,
    public readonly createdAt: Date
  ) {}

  static create(
    userId: string,
    question: string,
    answer: string,
    tokens: number
  ): Omit<ChatMessage, 'id' | 'createdAt'> {
    return {
      userId,
      question,
      answer,
      tokens,
    };
  }
}

