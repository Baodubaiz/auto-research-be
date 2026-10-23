import { Logger } from '@nestjs/common';
import { MongoClient } from 'mongodb';

export class WriteContentMongoHelper {
  private static readonly logger = new Logger(WriteContentMongoHelper.name);
  private static cachedClient: MongoClient | null = null;

  static toMongoDocId(id: string): string {
    const clean = id.replace(/-/g, '');
    return clean.length >= 24 ? clean.slice(0, 24) : clean.padEnd(24, '0');
  }

  private static async getClient(): Promise<MongoClient> {
    if (this.cachedClient) {
      try {
        await this.cachedClient.db('admin').command({ ping: 1 });
        return this.cachedClient;
      } catch {
        this.cachedClient = null;
      }
    }
    const uri = process.env.MONGO_URI?.trim();
    if (!uri) {
      throw new Error(
        'Thiếu biến môi trường MONGO_URI. Cấu hình trong .env (không commit giá trị thật) — xem .env.example.',
      );
    }
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    this.cachedClient = client;
    return client;
  }

  static async ensureMongoReady(
    mongoDocId: string,
    papers: Array<{ title?: string; abstract?: string; [key: string]: unknown }>,
    outline: { outline?: unknown[]; headings?: unknown[] },
  ): Promise<void> {
    try {
      const client = await this.getClient();
      const userDb = client.db('user_documents');
      const adminDb = client.db('admin');

      const docs = (papers && papers.length > 0 ? papers : [
        {
          title: 'AI in Academic Research',
          abstract: 'Comprehensive literature overview and empirical findings.',
        },
      ]).map((p) => ({
        title: p.title || 'Untitled Reference',
        key_points: p.abstract || 'Nghiên cứu cơ sở lý thuyết và phương pháp luận.',
      }));

      await userDb.collection('reports_refs').updateOne(
        { _id: mongoDocId as unknown as object },
        { $set: { documents: docs } },
        { upsert: true },
      );

      const outlineItems =
        Array.isArray(outline.outline) && outline.outline.length > 0
          ? outline.outline
          : Array.isArray(outline.headings) && outline.headings.length > 0
            ? outline.headings
            : [1, 2, 3, 4, 5];

      const count = Math.max(outlineItems.length, 5);
      const updates = [];
      for (let i = 1; i <= count; i++) {
        updates.push(
          adminDb.collection('outlines').updateOne(
            { documentId: mongoDocId, index: i },
            {
              $setOnInsert: {
                documentId: mongoDocId,
                index: i,
                refTable: [],
                content: '',
                contentArr: [],
              },
            },
            { upsert: true },
          ),
        );
      }
      await Promise.all(updates);
      this.logger.debug(`Ensured MongoDB records ready for ${mongoDocId}`);
    } catch (err) {
      this.logger.warn(`Failed to sync Mongo collections for ${mongoDocId}: ${(err as Error).message}`);
    }
  }
}
