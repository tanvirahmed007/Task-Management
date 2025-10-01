// types/global.d.ts
import { ReadableStreamDefaultController } from 'stream';

declare global {
  var notificationClients: {
    [key: string]: ReadableStreamDefaultController;
  } | undefined;
}

export {};