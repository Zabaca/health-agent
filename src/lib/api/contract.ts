import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { releaseSchema, myProviderSchema } from '@/lib/schemas/release';
import { profileSchema } from '@/lib/schemas/profile';
import {
  releaseSummarySchema,
  releaseWithProvidersSchema,
  userProviderRowSchema,
  errorSchema,
  successSchema,
  profileResponseSchema,
} from './response-schemas';

const c = initContract();

export const contract = c.router({
  releases: c.router({
    list: {
      method: 'GET',
      path: '/api/releases',
      responses: { 200: z.array(releaseSummarySchema), 401: errorSchema },
    },
    create: {
      method: 'POST',
      path: '/api/releases',
      body: releaseSchema,
      responses: { 201: releaseWithProvidersSchema, 400: errorSchema, 401: errorSchema, 500: errorSchema },
    },
    getById: {
      method: 'GET',
      path: '/api/releases/:id',
      pathParams: z.object({ id: z.string() }),
      responses: { 200: releaseWithProvidersSchema, 401: errorSchema, 404: errorSchema },
    },
    update: {
      method: 'PUT',
      path: '/api/releases/:id',
      pathParams: z.object({ id: z.string() }),
      body: releaseSchema,
      responses: { 200: releaseWithProvidersSchema, 400: errorSchema, 401: errorSchema, 404: errorSchema, 500: errorSchema },
    },
    void: {
      method: 'PATCH',
      path: '/api/releases/:id',
      pathParams: z.object({ id: z.string() }),
      body: c.noBody(),
      responses: { 200: successSchema, 401: errorSchema, 404: errorSchema },
    },
  }),
  myProviders: c.router({
    list: {
      method: 'GET',
      path: '/api/my-providers',
      responses: { 200: z.array(userProviderRowSchema), 401: errorSchema },
    },
    replace: {
      method: 'PUT',
      path: '/api/my-providers',
      body: z.object({ providers: z.array(myProviderSchema) }),
      responses: { 200: successSchema, 400: errorSchema, 401: errorSchema },
    },
  }),
  profile: c.router({
    get: {
      method: 'GET',
      path: '/api/profile',
      responses: { 200: profileResponseSchema, 401: errorSchema },
    },
    update: {
      method: 'PUT',
      path: '/api/profile',
      body: profileSchema,
      responses: { 200: successSchema, 400: errorSchema, 401: errorSchema },
    },
  }),
});
