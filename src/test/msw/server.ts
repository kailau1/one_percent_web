import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** The fake backend used by every test. Override a route in a test with server.use(...). */
export const server = setupServer(...handlers)

export { API } from './handlers'
