import { QdrantVectorStore } from "@langchain/qdrant";
import embeddings from "./embeddings.js";

const COLLECTION_NAME = "studyforge_documents";

export const getQdrantStore = async () => {
    const vectorStore =
        await QdrantVectorStore.fromExistingCollection(
            embeddings,
            {
                url: process.env.QDRANT_URL,
                apiKey: process.env.QDRANT_API_KEY,
                collectionName: COLLECTION_NAME,

                clientParams: {
                    checkCompatibility: false
                }
            }
        );

    return vectorStore;
};

export {
    COLLECTION_NAME
};