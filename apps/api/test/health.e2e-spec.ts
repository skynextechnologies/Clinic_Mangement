import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';

import { AppModule } from '../src/app.module.js';

describe('Health & Platform Essentials (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /health/live returns liveness status wrapped in envelope', async () => {
    const res = await request(app.getHttpServer()).get('/health/live').expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toMatchObject({ status: 'up' });
    expect(res.body.data).toHaveProperty('timestamp');
  });

  it('GET /health/ready returns readiness status wrapped in envelope', async () => {
    const res = await request(app.getHttpServer()).get('/health/ready').expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toMatchObject({
      status: 'ready',
      database: 'connected',
      redis: 'connected',
    });
  });

  it('GET /non-existent-route returns RFC 7807 problem+json structure', async () => {
    const res = await request(app.getHttpServer()).get('/non-existent-route').expect(404);

    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body).toMatchObject({
      type: 'about:blank',
      status: 404,
      instance: '/non-existent-route',
    });
    expect(res.body).toHaveProperty('code');
  });
});
