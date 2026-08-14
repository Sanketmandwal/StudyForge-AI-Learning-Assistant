import { API_PATHS } from "../utils/aiPaths.js";
import axiosInstance from "../utils/axiosInstance";

const getDocuments = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.DOCUMENTS.GET_DOCUMENTS);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch documents" };
    }
}
const uploadDocument = async (formData) => {
    try {
        const response = await axiosInstance.post(API_PATHS.DOCUMENTS.UPLOAD, formData , {
            headers :{
                'Content-Type' : 'multipart/form-data',
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to upload document" };
    }
};

const deleteDocument = async (id) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.DOCUMENTS.DELETE_DOCUMENT(id));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to delete document" };
    }
};

const getDocumentById = async (id) => {
    try {
        const response = await axiosInstance.get(API_PATHS.DOCUMENTS.GET_DOCUMENT_BY_ID(id));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch document" };
    }
};

const retryDocumentProcessing = async (documentId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.DOCUMENTS.RETRY_DOCUMENT_PROCESSING(documentId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to retry document processing" };
    }
};

const documentService = {
    getDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentById,
    retryDocumentProcessing
};

export default documentService