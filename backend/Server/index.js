require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const pool = require('./helpers/db');

const app = express();
const port = 3001

app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

//Routes
app.post('/register', async (req, res) =>{
    const { username, password } = req.body;
    try{
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [username, hashedPassword]
        );
        res.redirect('/login');
    } catch (err){
        console.error(err);
        res.send("Error creating account. Username might be taken.");
    }
});

app.post('/login', async (req, res) =>{
    const{ username, password } = req.body;
    try{
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0){
            const user = result.rows[0];
            const match = await bcrypt.compare(password, user.password);
            
            if (match){
                req.session.userId = user.id;
                req.session.username = user.username;
                return res.redirect('/index'); //
            }
        }
        res.send("Invalid username or password.");
    } catch (err){
        console.error(err)
        res.status(500).send("Server error.");
    }
});


app.listen(3001)