import { Logger } from '@nestjs/common';

const logger = new Logger('WorkerProcess');

async function runWorker() {
  logger.log('Starting ClinicOS Background Queue Worker...');

  const shutdown = (signal: string) => {
    logger.log(`Received ${signal}. Shutting down worker gracefully...`);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.log('Worker listening for background jobs.');
}

runWorker().catch((err) => {
  logger.error('Worker failed to start:', err);
  process.exit(1);
});
