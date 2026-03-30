require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const pool = require('./db');

const app = express();

app.use(express.urlencoded({ extended: false }));
