import { Logger } from '@nestjs/common';
import * as net from 'node:net';

export class KafkaTunnelHelper {
  private static readonly logger = new Logger(KafkaTunnelHelper.name);
  private static server: net.Server | null = null;

  static startProxyIfRemote(rawBrokers: string | string[]) {
    const brokerList = Array.isArray(rawBrokers)
      ? rawBrokers
      : String(rawBrokers)
          .split(',')
          .map((b) => b.trim());

    const first = brokerList[0] || '';
    const [host, portStr] = first.split(':');
    const port = parseInt(portStr || '9092', 10);

    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return;
    }

    try {
      this.server = net.createServer((clientSocket) => {
        const remoteSocket = net.connect(port, host);
        clientSocket.pipe(remoteSocket).pipe(clientSocket);
        clientSocket.on('error', () => {});
        remoteSocket.on('error', () => {});
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          this.logger.debug(
            `Port ${port} already bound, skipping local Kafka proxy`,
          );
        } else {
          this.logger.warn(`Kafka tunnel proxy error: ${err.message}`);
        }
      });

      this.server.listen(port, '127.0.0.1', () => {
        this.logger.log(
          `🔀 Kafka local tunnel active: 127.0.0.1:${port} -> ${host}:${port}`,
        );
      });
    } catch (err: any) {
      this.logger.warn(`Could not start Kafka tunnel: ${err.message}`);
    }
  }

  static stopProxy() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
