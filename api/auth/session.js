import { handleAuthSession, nodeApiConfig } from '../../server/firebaseApi.js';

export const config = nodeApiConfig;

export default async function handler(req, res) {
  await handleAuthSession(req, res);
}
