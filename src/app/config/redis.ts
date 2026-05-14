import Redis from "ioredis"
import { envVariable } from "./index";

export const redis = new Redis(envVariable.REDIS_URL, {
  maxRetriesPerRequest: null
});
