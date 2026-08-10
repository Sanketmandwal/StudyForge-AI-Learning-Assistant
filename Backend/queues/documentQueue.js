import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

export const documentQueue = new Queue(
    "document-processing",
    {
        connection: redisConnection,

        defaultJobOptions: {
            attempts: 3,

            backoff: {
                type: "exponential",
                delay: 5000
            },

            removeOnComplete: {
                age: 24 * 3600,
                count: 100
            },

            removeOnFail: {
                age: 7 * 24 * 3600
            }
        }
    }
);