import { handleAuthLogout, nodeApiConfig } from '../../server/firebaseApi.js';

export const config = nodeApiConfig;

export default async function handler(req, res) {
  await handleAuthLogout(req, res);
}
