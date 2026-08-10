import express, { urlencoded } from 'express'
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import authRouter from './routes/authRoutes.js'
import documentRouter from './routes/documetRoutes.js'
import FlashcardRouter from './routes/flashcardRoutes.js'
import aiRouter from './routes/aiRoutes.js'
import quizRouter from './routes/quizRoutes.js'
import progressRouter from './routes/progressRoute.js'
import connectCloudinary from './config/cloudinary.js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


connectCloudinary()
connectDB();

app.use(cors({
    origin:'*',
    methods:["GET","POST","PUT","DELETE"],
    allowedHeaders:["Content-Type","Authorization"],
    credentials:true
}))


app.use(express.json());
app.use(express.urlencoded({ extended:true}))
app.use('/uploads', express.static(path.join(__dirname,'uploads')))

app.use('/api/auth', authRouter)
app.use('/api/documents',documentRouter)
app.use('/api/flashcards', FlashcardRouter)
app.use('/api/ai',aiRouter)
app.use('/api/quizzes', quizRouter)
app.use('/api/progress', progressRouter)

app.use((req,res)=>{
    res.status(404).json({
        success:false,
        error:"Route NOT FOUND",
        statusCode : 404
    })
})

const PORT = process.env.PORT || 5000

app.listen(5000 , () => console.log(`Server Started running in ${process.env.NODE_ENV} at PORT ${PORT}`))


process.on('unhandledRejection',(err) =>{
    console.log(`Error ${err.message}`)
    process.exit(1);
})