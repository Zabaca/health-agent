import { type AppRoute, type AppRouteMutation, isAppRouteMutation } from '@ts-rest/core';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

type InferParams<T extends AppRoute> = T['pathParams'] extends z.ZodTypeAny
  ? z.infer<T['pathParams']>
  : Record<string, never>;

type InferBody<T extends AppRoute> = T extends AppRouteMutation
  ? T['body'] extends z.ZodTypeAny
    ? z.infer<T['body']>
    : undefined
  : undefined;

export type RouteCtx<T extends AppRoute> = {
  params: InferParams<T>;
  body: InferBody<T>;
  req: NextRequest;
};

type NextHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wraps a ts-rest contract route for use in Next.js App Router.
 *
 * - Automatically awaits and validates path params against the contract's pathParams schema.
 * - Automatically parses and validates the request body against the contract's body schema.
 * - Validates the response body against the contract's declared response schema for the
 *   returned status code, returning 500 if the handler produces a non-conforming response.
 * - Passes typed `{ params, body, req }` to the handler.
 */
export function contractRoute<T extends AppRoute>(
  route: T,
  handler: (ctx: RouteCtx<T>) => Promise<NextResponse>
): NextHandler {
  return async (req, context) => {
    // Await and validate path params
    const rawParams = context?.params ? await context.params : {};
    let params = {} as InferParams<T>;
    if (route.pathParams instanceof z.ZodType) {
      const result = route.pathParams.safeParse(rawParams);
      if (!result.success) {
        return NextResponse.json({ error: 'Invalid path parameters' }, { status: 400 });
      }
      params = result.data;
    }

    // Parse and validate request body (only for mutations with a Zod body schema)
    let body = undefined as InferBody<T>;
    if (isAppRouteMutation(route) && route.body instanceof z.ZodType) {
      const rawBody = await req.json().catch(() => null);
      const result = route.body.safeParse(rawBody);
      if (!result.success) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
      }
      body = result.data as InferBody<T>;
    }

    const response = await handler({ params, body, req });

    // Validate response body against the contract's declared schema for this status code
    const responseSchema = (route.responses as Record<number, unknown>)[response.status];
    if (responseSchema instanceof z.ZodType) {
      const rawResponseBody = await response.clone().json().catch(() => null);
      const result = responseSchema.safeParse(rawResponseBody);
      if (!result.success) {
        console.error(
          `[contractRoute] Response for ${route.method} ${route.path} (status ${response.status}) does not match contract schema:`,
          result.error.flatten()
        );
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
      // Return the schema-parsed body to strip any extra fields
      return NextResponse.json(result.data, { status: response.status });
    }

    return response;
  };
}
