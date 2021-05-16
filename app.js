const express = require('express');
const app = express();

const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const bodyParser = require('body-parser');



const connectDatabase = require('./config/database');
const errorMiddleware = require('./middlewares/errors')
const ErrorHandler = require('./utils/errorHandler')

// npm i express dotenv --save
// npm i nodemon --save-dev
// npm i mongoose --save
// npm i validator --save
// npm i slugify --save
// npm i node-geocoder --save
// npm i bcryptjs --save
// npm i jsonwebtoken --save
// npm i cookie-parser --save
// npm i nodemailer --save
// npm i express-fileupload --save
// npm i express-rate-limit --save
// npm i helmet --save
// npm i express-mongo-sanitize --save
// npm i xss-clean --save
// npm i hpp --save
// npm i cors --save
// npm i body-parser --save
// mongodb://localhost:27017/jobs?readPreference=primary&appname=MongoDB%20Compass&ssl=false

// Setting up config.env file variables
dotenv.config({ path: './config/config.env'})

// Handling Uncaught Exception
process.on('uncaughtException', err => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down due to uncught exception.');
    process.exit(1);
})

// Connecting to database
connectDatabase();

// Set up body parser
app.use(bodyParser.urlencoded({ extended : true }));

app.use(express.static('public'));


// Setup security headers
app.use(helmet());

// Setup body parser
app.use(express.json());

// Set cookie parser
app.use(cookieParser());

// Hanlde File Upload
app.use(fileUpload());

// Sanitize data - prevent operator injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xssClean());

// Prevent Parameter Pollution
app.use(hpp({
    whitelist: ['positions']
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10*60*1000, //10 Mints
    max : 100
});

// Setup CORS - Accessible by other domains
app.use(cors());

app.use(limiter);

/*
Creating own middleware - EXAMPLE
const middleware = (req, res, next) => {
    console.log('Hello from middleware');

    // Setting up user variable globally
    req.requestMethod = req.method;
    next();
}
app.use(middleware);
*/


// Importing all routes
const jobs = require('./routes/jobs')
const auth = require('./routes/auth')
const user = require('./routes/user')

app.use('/api/v1', jobs);
app.use('/api/v1', auth);
app.use('/api/v1', user);

// Handle unhandled routes - RIGHT AFTER app.use('/api/v1', jobs);
app.all('*', (req, res, next) => {
    next(new ErrorHandler(`${req.originalUrl} route not found`, 404))
})

// Middleware to handle errors,
app.use(errorMiddleware)

const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
    console.log(`Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`);
})

// Handling unhandled Promise Rejection
process.on('unhandledRejection', err => {
    console.log(`Error: ${err.message}`);
    console.group('Shutting down the server due to Unhandled promise rejection.');
    server.close( () => {
        process.exit(1);
    })
})
