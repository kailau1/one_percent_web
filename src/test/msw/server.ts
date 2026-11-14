import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** The fake backend used by every test. Override a route in a test with server.use(...). */
export const server = setupServer(...handlers)

/** Base URL the app is configured with in tests (see vite.config.ts). */
export const API = 'http://api.test'
