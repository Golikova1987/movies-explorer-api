require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { errors } = require('celebrate');
const cors = require('cors');
const limiter = require('./utils/limiter');

const errorHandler = require('./middlewares/error-handler');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const { PORT = 3000, DB_URL = 'mongodb://127.0.0.1:27017/bitfilmsdb' } = process.env;

const app = express();

const router = require('./routes/index');

app.use(cors({
  origin: ['http://localhost:3001', 'https://explorer.movies.nomoredomainsrocks.ru'],
  credentials: true,
}));

app.use(helmet());

app.use(bodyParser.json());

mongoose.connect(DB_URL);

app.use(requestLogger);

app.use(limiter);

app.use(express.json());

app.use(router);

app.use(errorLogger);

app.use(errors());

app.use(errorHandler);

app.listen(PORT);
