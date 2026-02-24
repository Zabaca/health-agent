import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { releaseSchema, myProviderSchema, staffReleaseSchema } from '@/lib/schemas/release';
import { profileSchema, staffProfileSchema } from '@/lib/schemas/profile';
import {
  releaseSummarySchema,
  releaseWithProvidersSchema,
  userProviderRowSchema,
  errorSchema,
  successSchema,
  profileResponseSchema,
  patientSummarySchema,
  staffMemberSchema,
  staffProfileResponseSchema,
  scheduledCallSchema,
  staffScheduledCallSchema,
  uploadResponseSchema,
  registerResponseSchema,
} from './response-schemas';

const c = initContract();

export const contract = c.router({
  register: {
    method: 'POST',
    path: '/api/register',
    body: z.object({ email: z.string().email(), password: z.string().min(8) }),
    responses: {
      201: registerResponseSchema,
      400: errorSchema,
      409: errorSchema,
      500: errorSchema,
    },
  },
  upload: {
    method: 'POST',
    path: '/api/upload',
    body: z.object({ data: z.string(), extension: z.string().optional() }),
    responses: {
      200: uploadResponseSchema,
      400: errorSchema,
      401: errorSchema,
      500: errorSchema,
    },
  },
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
  admin: c.router({
    patients: c.router({
      list: {
        method: 'GET',
        path: '/api/admin/patients',
        responses: { 200: z.array(patientSummarySchema), 401: errorSchema, 403: errorSchema },
      },
      getById: {
        method: 'GET',
        path: '/api/admin/patients/:id',
        pathParams: z.object({ id: z.string() }),
        responses: { 200: patientSummarySchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
      reassign: {
        method: 'PATCH',
        path: '/api/admin/patients/:id',
        pathParams: z.object({ id: z.string() }),
        body: z.object({ assignedToId: z.string() }),
        responses: { 200: successSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
      listStaff: {
        method: 'GET',
        path: '/api/admin/staff',
        responses: { 200: z.array(staffMemberSchema), 401: errorSchema, 403: errorSchema },
      },
    }),
    patientReleases: c.router({
      list: {
        method: 'GET',
        path: '/api/admin/patients/:id/releases',
        pathParams: z.object({ id: z.string() }),
        responses: { 200: z.array(releaseSummarySchema), 401: errorSchema, 403: errorSchema },
      },
      create: {
        method: 'POST',
        path: '/api/admin/patients/:id/releases',
        pathParams: z.object({ id: z.string() }),
        body: staffReleaseSchema,
        responses: { 201: releaseWithProvidersSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema, 500: errorSchema },
      },
      getById: {
        method: 'GET',
        path: '/api/admin/patients/:id/releases/:releaseId',
        pathParams: z.object({ id: z.string(), releaseId: z.string() }),
        responses: { 200: releaseWithProvidersSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
      update: {
        method: 'PUT',
        path: '/api/admin/patients/:id/releases/:releaseId',
        pathParams: z.object({ id: z.string(), releaseId: z.string() }),
        body: staffReleaseSchema,
        responses: { 200: releaseWithProvidersSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 500: errorSchema },
      },
      void: {
        method: 'PATCH',
        path: '/api/admin/patients/:id/releases/:releaseId',
        pathParams: z.object({ id: z.string(), releaseId: z.string() }),
        body: c.noBody(),
        responses: { 200: successSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
    }),
    patientProviders: c.router({
      list: {
        method: 'GET',
        path: '/api/admin/patients/:id/providers',
        pathParams: z.object({ id: z.string() }),
        responses: { 200: z.array(userProviderRowSchema), 401: errorSchema, 403: errorSchema },
      },
    }),
    profile: c.router({
      get: {
        method: 'GET',
        path: '/api/admin/profile',
        responses: { 200: staffProfileResponseSchema, 401: errorSchema, 403: errorSchema },
      },
      update: {
        method: 'PUT',
        path: '/api/admin/profile',
        body: staffProfileSchema,
        responses: { 200: successSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema },
      },
    }),
    changePassword: c.router({
      update: {
        method: 'PUT',
        path: '/api/admin/change-password',
        body: z.object({ password: z.string().min(8) }),
        responses: { 200: successSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema },
      },
    }),
  }),
  staffScheduledCalls: c.router({
    getById: {
      method: 'GET',
      path: '/api/staff/scheduled-calls/:id',
      pathParams: z.object({ id: z.string() }),
      responses: { 200: staffScheduledCallSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
    cancel: {
      method: 'PATCH',
      path: '/api/staff/scheduled-calls/:id',
      pathParams: z.object({ id: z.string() }),
      body: z.object({ status: z.enum(['cancelled']) }),
      responses: { 200: staffScheduledCallSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
    },
  }),
  scheduledCalls: c.router({
    list: {
      method: 'GET',
      path: '/api/scheduled-calls',
      responses: { 200: z.array(scheduledCallSchema), 401: errorSchema },
    },
    create: {
      method: 'POST',
      path: '/api/scheduled-calls',
      body: z.object({ scheduledAt: z.string() }),
      responses: { 201: scheduledCallSchema, 400: errorSchema, 401: errorSchema, 404: errorSchema },
    },
    getById: {
      method: 'GET',
      path: '/api/scheduled-calls/:id',
      pathParams: z.object({ id: z.string() }),
      responses: { 200: scheduledCallSchema, 401: errorSchema, 404: errorSchema },
    },
    update: {
      method: 'PATCH',
      path: '/api/scheduled-calls/:id',
      pathParams: z.object({ id: z.string() }),
      body: z.object({
        scheduledAt: z.string().optional(),
        status: z.enum(['cancelled']).optional(),
      }),
      responses: { 200: scheduledCallSchema, 400: errorSchema, 401: errorSchema, 404: errorSchema },
    },
  }),
  agent: c.router({
    patients: c.router({
      list: {
        method: 'GET',
        path: '/api/agent/patients',
        responses: { 200: z.array(patientSummarySchema), 401: errorSchema, 403: errorSchema },
      },
      getById: {
        method: 'GET',
        path: '/api/agent/patients/:id',
        pathParams: z.object({ id: z.string() }),
        responses: { 200: patientSummarySchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
      reassign: {
        method: 'PATCH',
        path: '/api/agent/patients/:id',
        pathParams: z.object({ id: z.string() }),
        body: z.object({ assignedToId: z.string() }),
        responses: { 200: successSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
    }),
    patientReleases: c.router({
      list: {
        method: 'GET',
        path: '/api/agent/patients/:id/releases',
        pathParams: z.object({ id: z.string() }),
        responses: { 200: z.array(releaseSummarySchema), 401: errorSchema, 403: errorSchema },
      },
      create: {
        method: 'POST',
        path: '/api/agent/patients/:id/releases',
        pathParams: z.object({ id: z.string() }),
        body: staffReleaseSchema,
        responses: { 201: releaseWithProvidersSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema, 500: errorSchema },
      },
      getById: {
        method: 'GET',
        path: '/api/agent/patients/:id/releases/:releaseId',
        pathParams: z.object({ id: z.string(), releaseId: z.string() }),
        responses: { 200: releaseWithProvidersSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
      update: {
        method: 'PUT',
        path: '/api/agent/patients/:id/releases/:releaseId',
        pathParams: z.object({ id: z.string(), releaseId: z.string() }),
        body: staffReleaseSchema,
        responses: { 200: releaseWithProvidersSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema, 500: errorSchema },
      },
      void: {
        method: 'PATCH',
        path: '/api/agent/patients/:id/releases/:releaseId',
        pathParams: z.object({ id: z.string(), releaseId: z.string() }),
        body: c.noBody(),
        responses: { 200: successSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
      },
    }),
    patientProviders: c.router({
      list: {
        method: 'GET',
        path: '/api/agent/patients/:id/providers',
        pathParams: z.object({ id: z.string() }),
        responses: { 200: z.array(userProviderRowSchema), 401: errorSchema, 403: errorSchema },
      },
    }),
    profile: c.router({
      get: {
        method: 'GET',
        path: '/api/agent/profile',
        responses: { 200: staffProfileResponseSchema, 401: errorSchema, 403: errorSchema },
      },
      update: {
        method: 'PUT',
        path: '/api/agent/profile',
        body: staffProfileSchema,
        responses: { 200: successSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema },
      },
    }),
    changePassword: c.router({
      update: {
        method: 'PUT',
        path: '/api/agent/change-password',
        body: z.object({ password: z.string().min(8) }),
        responses: { 200: successSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema },
      },
    }),
  }),
});
