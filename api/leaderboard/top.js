import { handleLeaderboardTop, nodeApiConfig } from '../../server/firebaseApi.js';

export const config = nodeApiConfig;

export default async function handler(req, res) {
  await handleLeaderboardTop(req, res);
}
