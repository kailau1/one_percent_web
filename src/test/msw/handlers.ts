import type { RequestHandler } from 'msw'

/**
 * Default "happy path" responses for the real backend's routes. Each must match what
 * one_percent_spring actually returns (status codes and body shapes): a test that passes
 * against a wrong mock proves nothing. Feature phases add their routes here.
 */
export const handlers: RequestHandler[] = []
