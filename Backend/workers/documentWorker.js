import "dotenv/config";
import { Worker } from "bullmq";
import redisConnection from "../config/redis.js";
import connectDB from "../config/db.js";
import { processDocument } from "../services/documentProcessor.js";

const startWorker = async () => {
    try {
        await connectDB();

        const documentWorker = new Worker(
            "document-processing",

            async (job) => {
                console.log("=================================");
                console.log(`Processing job: ${job.id}`);
                console.log("Job data:", job.data);
                console.log("=================================");

                const result = await processDocument(
                    job.data.documentId
                );

                return result;
            },

            {
                connection: redisConnection,
                concurrency: 2
            }
        );

        documentWorker.on(
            "completed",
            (job, result) => {
                console.log(
                    `Job ${job.id} completed successfully`
                );

                console.log(
                    "Result:",
                    result
                );
            }
        );

        documentWorker.on(
            "failed",
            (job, error) => {
                console.error(
                    `Job ${job?.id} failed:`,
                    error
                );
            }
        );

        documentWorker.on(
            "error",
            (error) => {
                console.error(
                    "Worker error:",
                    error
                );
            }
        );

        console.log(
            "Document worker started"
        );
    } catch (error) {
        console.error(
            "Failed to start worker:",
            error
        );

        process.exit(1);
    }
};

startWorker();
