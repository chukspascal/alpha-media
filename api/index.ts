import server from "../dist/server/server.js";

async function handle(request: Request): Promise<Response> {
  return server.fetch(request, {}, {});
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
