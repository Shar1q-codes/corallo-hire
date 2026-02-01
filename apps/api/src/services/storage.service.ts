import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageService {
  async putObject(key: string, _body: Buffer) {
    const bucket = process.env.S3_BUCKET ?? 'local-bucket';
    const endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
    return {
      key,
      bucket,
      url: `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`,
    };
  }
}
