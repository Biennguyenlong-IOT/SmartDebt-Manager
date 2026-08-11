import { handleAiInsightsRequest } from "../services/aiInsightsHandler.js";

export default async function handler(req: any, res: any) {
  return handleAiInsightsRequest(req, res);
}
