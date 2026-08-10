import "dotenv/config";

import {
    QdrantClient
} from "@qdrant/js-client-rest";

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY
});

const COLLECTION_NAME =
    "studyforge_documents";

const inspect = async () => {
    try {
        const result =
            await client.scroll(
                COLLECTION_NAME,
                {
                    limit: 1,
                    with_payload: true,
                    with_vector: false
                }
            );

        console.dir(
            result,
            {
                depth: null
            }
        );
    } catch (error) {
        console.error(
            "Failed to inspect Qdrant:",
            error
        );
    }
};

inspect();