import { initClient } from '@ts-rest/core';
import { contract } from './contract';

export const apiClient = initClient(contract, {
  baseUrl: '',
  baseHeaders: {},
  credentials: 'include',
});
