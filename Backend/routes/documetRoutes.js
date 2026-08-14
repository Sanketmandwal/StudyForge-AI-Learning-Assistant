import express from 'express'
import {
    uploadDocument,
    getDocuments,
    getDocument,
    deleteDocument,
    retryDocumentProcessing
} from '../controllers/documetController.js'
import protect from '../middleware/auth.js'
import upload from '../config/multer.js'
const documentRouter = express.Router()

documentRouter.use(protect);

documentRouter.post('/upload',upload.single('file'),uploadDocument)
documentRouter.post('/:id/retry',retryDocumentProcessing)
documentRouter.get('/',getDocuments)
documentRouter.get('/:id',getDocument)
documentRouter.delete('/:id',deleteDocument)

export default documentRouter