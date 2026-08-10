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

const createIndexes = async () => {
    try {
        await client.createPayloadIndex(
            COLLECTION_NAME,
            {
                field_name:
                    "metadata.documentId",

                field_schema: "keyword",

                wait: true
            }
        );

        console.log(
            "Created index: metadata.documentId"
        );

        await client.createPayloadIndex(
            COLLECTION_NAME,
            {
                field_name:
                    "metadata.userId",

                field_schema: "keyword",

                wait: true
            }
        );

        console.log(
            "Created index: metadata.userId"
        );

        console.log(
            "Qdrant payload indexes created successfully"
        );
    } catch (error) {
        console.error(
            "Failed to create payload indexes:",
            error
        );
    }
};

createIndexes();