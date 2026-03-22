import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW server instance for unit/integration tests.
 * Started in src/test/setup.ts.
 */
export const server = setupServer(...handlers);
