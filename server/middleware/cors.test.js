/**
 * @jest-environment node
 */

const request = require('supertest')
const express = require('express')

// Store original env
const originalEnv = process.env.CORS_ALLOWED_ORIGINS

describe('CORS Middleware', () => {
  let createCorsMiddleware

  beforeEach(() => {
    jest.resetModules()
    delete process.env.CORS_ALLOWED_ORIGINS
    // eslint-disable-next-line global-require
    createCorsMiddleware = require('./cors')
  })

  afterAll(() => {
    if (originalEnv !== undefined) {
      process.env.CORS_ALLOWED_ORIGINS = originalEnv
    } else {
      delete process.env.CORS_ALLOWED_ORIGINS
    }
  })

  const createTestApp = (corsMiddleware) => {
    const app = express()
    app.use(corsMiddleware)
    app.get('/api/test', (req, res) => res.json({ message: 'ok' }))
    app.options('/api/test', (req, res) => res.sendStatus(204))
    return app
  }

  describe('default configuration (no CORS_ALLOWED_ORIGINS)', () => {
    it('should not set Access-Control-Allow-Origin header for same-origin requests', async () => {
      const middleware = createCorsMiddleware()
      const app = createTestApp(middleware)

      const response = await request(app).get('/api/test')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })

    it('should reject cross-origin requests', async () => {
      const middleware = createCorsMiddleware()
      const app = createTestApp(middleware)

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://malicious-site.com')

      expect(response.status).toBe(200)
      // Origin not in allowed list, so no CORS header
      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('with CORS_ALLOWED_ORIGINS configured', () => {
    it('should allow requests from configured origin', async () => {
      process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
      jest.resetModules()
      // eslint-disable-next-line global-require
      createCorsMiddleware = require('./cors')

      const middleware = createCorsMiddleware()
      const app = createTestApp(middleware)

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:5173')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173'
      )
    })

    it('should allow requests from multiple configured origins', async () => {
      process.env.CORS_ALLOWED_ORIGINS =
        'http://localhost:5173,http://192.168.1.100:3001'
      jest.resetModules()
      // eslint-disable-next-line global-require
      createCorsMiddleware = require('./cors')

      const middleware = createCorsMiddleware()
      const app = createTestApp(middleware)

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://192.168.1.100:3001')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://192.168.1.100:3001'
      )
    })

    it('should reject requests from non-configured origins', async () => {
      process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
      jest.resetModules()
      // eslint-disable-next-line global-require
      createCorsMiddleware = require('./cors')

      const middleware = createCorsMiddleware()
      const app = createTestApp(middleware)

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://evil-site.com')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('preflight requests', () => {
    it('should handle OPTIONS preflight requests', async () => {
      process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
      jest.resetModules()
      // eslint-disable-next-line global-require
      createCorsMiddleware = require('./cors')

      const middleware = createCorsMiddleware()
      const app = createTestApp(middleware)

      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')

      expect(response.status).toBe(204)
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173'
      )
      expect(response.headers['access-control-allow-methods']).toBeDefined()
    })

    it('should allow common HTTP methods', async () => {
      process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
      jest.resetModules()
      // eslint-disable-next-line global-require
      createCorsMiddleware = require('./cors')

      const middleware = createCorsMiddleware()
      const app = createTestApp(middleware)

      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')

      expect(response.headers['access-control-allow-methods']).toContain('GET')
      expect(response.headers['access-control-allow-methods']).toContain('POST')
    })

    it('should allow Content-Type header', async () => {
      process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
      jest.resetModules()
      // eslint-disable-next-line global-require
      createCorsMiddleware = require('./cors')

      const middleware = createCorsMiddleware()
      const app = createTestApp(middleware)

      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')

      expect(response.headers['access-control-allow-headers']).toContain(
        'Content-Type'
      )
    })
  })

  describe('edge cases', () => {
    it('should trim whitespace from configured origins', async () => {
      process.env.CORS_ALLOWED_ORIGINS =
        ' http://localhost:5173 , http://192.168.1.100:3001 '
      jest.resetModules()
      // eslint-disable-next-line global-require
      createCorsMiddleware = require('./cors')

      const middleware = createCorsMiddleware()
      const app = createTestApp(middleware)

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:5173')

      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173'
      )
    })

    it('should handle empty CORS_ALLOWED_ORIGINS gracefully', async () => {
      process.env.CORS_ALLOWED_ORIGINS = ''
      jest.resetModules()
      // eslint-disable-next-line global-require
      createCorsMiddleware = require('./cors')

      const middleware = createCorsMiddleware()
      const app = createTestApp(middleware)

      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'http://localhost:5173')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })
  })
})
