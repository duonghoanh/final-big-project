require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
// const path = require('path')
const cloudinary =require('cloudinary')

const app = express()
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());
app.use(cookieParser())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true}));
app.use(fileUpload({
    useTempFiles: true
}));

//Routers
app.use('/user', require('./routers/userRouter'))
// app.use('/api', require('./routers/upload'))
app.use('/api', require('./routers/paymentRouter'))
app.use('/api', require('./routers/categoryRouter'))
app.use('/api', require('./routers/productRouter'))


//connect to db mongo
const URI = process.env.MONGODB_URL
mongoose.connect(URI,{
    //mongoose 6.0.6 
    // userCreateIndex: true,
    // useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
},err=>{
    if(err) throw err;
    console.log('Connected to MongoDB')
})


cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

// if(process.env.NODE_ENV === 'production'){
//     app.use(express.static('client/build'))
//     app.get('*', (req, res) => {
//         res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'))
//     })
// }
const PORT = process.env.PORT||2021

app.listen(PORT,()=>{
    console.log('Server is running on Port',PORT)
})

