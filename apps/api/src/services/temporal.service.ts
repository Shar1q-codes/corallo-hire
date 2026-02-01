import { Injectable } from '@nestjs/common';
import { Connection, Client } from '@temporalio/client';

@Injectable()
export class TemporalService {
  private clientPromise?: Promise<Client>;

  async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const connection = await Connection.connect({
          address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
        });
        return new Client({ connection });
      })();
    }
    try {
      return await this.clientPromise;
    } catch (error) {
      this.clientPromise = undefined;
      throw error;
    }
  }
}
