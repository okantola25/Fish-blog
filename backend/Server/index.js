require('dotenv').config()
const express = require('express')
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const pool = require('./helpers/db')
const { registerUser, loginUser } = require('./helpers/authHjelper')
const path = require('path')

const app = express()
const port = 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, '../../frontend')))
app.use(express.urlencoded({ extended: true }))

app.use(session({
    store: new pgSession({
        pool : pool,
        tableName : 'session'
    }),
  secret: process.env.SESSION_SECRET || 'mon petite chou-fleur', //Saa laitta oman
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: false 
  }
}))

                                                                //Routes//

app.get('/api/me', (req, res) =>{
    if(req.session.userId){
        res.json({
            kirjautunut: true,
            username: req.session.username
        })
    } else{
        res.json({ kirjautunut: false })
    }
}) //Hallitsee istuntoa eli onko vieras/käyttäjä

app.get('/users', async (req,res) =>{
    try{
    const result = await pool.query('SELECT * FROM users')
    res.json(result.rows)
  } catch (err){
    res.status(500).json({ error: err.message })
  }
}) //Testi komento

app.post('/kirjUlos', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send("Jotain meni pieleen!")
        res.clearCookie('connect.sid')
        res.redirect('/index.html')
    })
}) //Ulos kirjautuminen

app.post('/rekisteroi', async (req, res) =>{
    const { username, password } = req.body
    try{
        await registerUser(username, password)
        res.redirect('/index.html')
    } catch (err){
        console.error(err)
        res.send("Virhe, Käyttäjä tunnus saattaa olla käytössä.")
    }
}) //Uuden käyttäjän rekisteröinti

app.post('/kirjaudu', async (req, res) =>{
    const{ username, password } = req.body
    try{
        const user = await loginUser(username, password)
        
        if(user){
            req.session.userId = user.id
            req.session.username = user.username
            return res.redirect('/index.html')
        }
    res.status(401).send("Käyttäjä tunnus tai salasana ei täsmää.")
    } catch (err){
        console.error(err)
        res.status(500).send("Palvelin virhe :(")
    }
}) //Kirjautuminen jollakin tilillä

app.delete('/api/me', async (req, res) =>{
    const userId = req.session.userId

    if(!userId) return res.status(401).json({error: "Kirjaudu sisään poistaaksesi tilisi."})

    try{
        await pool.query('DELETE FROM users WHERE id = $1', [userId])

        req.session.destroy((err) =>{
            if (err) throw err
            res.clearCookie('connect.sid')
            res.json({message: "Tili poistettu."})
        })
    } catch(err){
        console.error(err)
        res.status(500).json({error: "Tilin poistaminen epäonnistui. Jos ongelma jatkuu ota yhteyttä ylläpitäjiin."})
    }
}) //Tilin poisto, poistaa myös julkasut ja tykkäykset

app.post('/api/posts', async (req, res) =>{
    if(!req.session.userId){
        return res.status(401).send("Kirjaudu sisään luodaksesi julkaisun.")
    } // Ei voi luoda julkaisua ellei oo kirjautunu

    const { title, content } = req.body
    const userId = req.session.userId

    try{
        await pool.query(
            'INSERT INTO posts (user_id, title, content) VALUES ($1, $2, $3)',
            [userId, title, content]
        )
        res.redirect('/forum.html')
    } catch(err){
        console.error("Error creating post:", err)
        res.status(500).send("Palvelinvirhe.")
    }
})

app.delete('/api/posts/:id', async (req, res) =>{
    const postId = req.params.id
    const userId = req.session.userId

    if(!userId) return res.status(401).json({error: "Kirjaudu sisään."})

    try{
        const result = await pool.query(
            'DELETE FROM posts WHERE id = $1 AND user_id = $2',
            [postId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(403).json({error: "Sinulla ei ole oikeutta poistaa tätä julkaisua tai sitä ei ole olemassa."})
        } //Laitetaan poistamis nappi näkyy vaa jos omistaa postin

        res.json({message: "Julkaisu poistettu onnistuneesti."})
    } catch(err){
        console.error(err)
        res.status(500).json({ error: "Tietokantavirhe."})
    }
}) // Julkasun poisto

app.get('/api/posts', async (req, res) =>{
    try{
        const result = await pool.query(
            `SELECT posts.id, posts.title, posts.content, posts.created_at, users.username 
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            ORDER BY posts.created_at DESC`
        )
        res.json(result.rows)
    } catch(err){
        console.error("Error fetching threads:", err)
        res.status(500).json({error: "Palvelinvirhe"})
    }
})

app.listen(port)
console.log('success')