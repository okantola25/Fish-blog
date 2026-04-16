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
    if (!username?.trim()) {
            return res.status(400).json({ error: "Käyttäjänimi ei voi olla tyhjä"})
        }
    if(!password?.trim() || password.trim().length < 5) {
            return res.status(400).json({ error: "Salasanan täytyy olla vähintään 5 merkkiä"})
        } //tarkastaa tietojen min pituudet

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

app.delete('/api/delete-user', async (req, res) =>{
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

app.post('/api/create-post', async (req, res) =>{
    if(!req.session.userId){
        return res.status(401).send("Kirjaudu sisään luodaksesi julkaisun.")
    } // Ei voi luoda julkaisua ellei oo kirjautunu

    const { title, content } = req.body
    const userId = req.session.userId

    //tarkistaa että julkaisu ei ole tyhjä
    if (!title?.trim()) {
        return res.status(400).json({ error: "Otsikko ei voi olla tyhjä"})
    }
    else if(!content?.trim()) {
        return res.status(400).json({ error: "Julkaisu ei voi olla tyhjä"})
    }
    
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

app.delete('/api/delete-post/:id', async (req, res) =>{
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

app.post('/api/like-post/:id', async (req, res) =>{
    const postId = req.params.id
    const userId = req.session.userId

    if(!userId) return res.status(401).json({error: "Kirjaudu sisään."})

    try{
        const checkLike = await pool.query(
            'SELECT * FROM postLikes WHERE user_id = $1 AND post_id = $2',
            [userId, postId]
        )
    
    if(checkLike.rows.length>0){
        await pool.query(
            'DELETE FROM postLikes WHERE  user_id = $1 AND post_id = $2',
            [userId, postId]
        )
        return res.json({liked:false})
    } else{
        await pool.query(
            'INSERT INTO postLikes (user_id, post_id) VALUES ($1,$2)',
            [userId, postId]
        )
        res.json({liked:true})
    }} catch(err){
        console.error(err)
        res.status(500).json({error:"Tietokanta virhe"})
    }
}) //Julkaisun tykkäys methodi

app.get('/api/load-replies/:id', async (req, res) =>{
    const postId = req.params.id
    try{
        const result = await pool.query(
            `SELECT replies.*, users.username 
             FROM replies 
             JOIN users ON replies.user_id = users.id 
             WHERE posts_id = $1 
             ORDER BY created_at ASC`,
             [postId]
        )
        res.json(result.rows)
    } catch(err){
        console.error(err)
        res.status(500).json({error: "Virhe kommenttien latauksessa."})
    }
}) //Lataa kommentit

app.post('/api/post-reply/:id', async (req, res) =>{
    const postId = req.params.id
    const userId = req.session.userId
    const {content} = req.body

    if(!userId) return res.status(401).json({error:"Kirjaudu sisään vastataksesi"})
    if(!content || content.trim() === '') return res.status(400).json({error: "Kommentti ei voi olla tyhjä"})

    try{
        await pool.query(
            'INSERT INTO replies (posts_id, user_id, content) VALUES ($1, $2, $3)',
            [postId, userId, content]
        )
        res.status(201).json({message:"Kommentti julkaistu."})
    }catch(err){
        console.error(err)
        res.status(500).json({error:"Virhe kommentoitaessa"})
}})

app.get('/api/load-posts', async (req, res) =>{
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const offset = (page-1)* limit
    const userId = req.session.userId || null

    const search = (req.query.search || '').trim();
    const sort = (req.query.sort || 'newest').toLowerCase();

    const sortingOptions = {
        "newest": "posts.created_at DESC",
        "oldest": "posts.created_at ASC",
        "likes-desc": "total_likes DESC, posts.created_at DESC",
        "likes-asc": "total_likes ASC, posts.created_at DESC"
    };
    
    const params = [limit, offset, userId]
    let searchQuery = ''
    
    if(search) {
        params.push(`%${search}%`)
        searchQuery = 'WHERE posts.title ILIKE $4 or posts.content ILIKE $4'
    }

    const sortParam = sortingOptions[sort] || sortingOptions.newest

    try{
        const result = await pool.query(
            `SELECT posts.id, posts.title, posts.content, posts.created_at, users.username,
            (SELECT COUNT(*) FROM postLikes WHERE post_id = posts.id) AS total_likes,
            EXISTS(SELECT 1 FROM postLikes WHERE post_id = posts.id AND user_id = $3) AS user_liked
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            ${searchQuery}
            ORDER BY ${sortParam}
            LIMIT $1 OFFSET $2`,
            params
        )
        res.json(result.rows)
    } catch(err){
        console.error("Error fetching threads:", err)
        res.status(500).json({error: "Palvelinvirhe"})
    }
}) //Lataa julkaisut. Lisätty lajittelu ja haku parametrit

//profiili sivu, tarkistaa sisäänkirjautumisen, hakee julkaisut


app.get('/api/my-posts', async (req, res) => {
    const userId = req.session.userId

    if (!userId) {
        return res.status(401).json({ error: 'Kirjaudu sisään.' })
    }

    try {
        const result = await pool.query(
            `SELECT id, title, content, created_at
             FROM posts
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        )

        res.json(result.rows)
    } catch (err) {
        console.error('Error fetching my posts:', err)
        res.status(500).json({ error: 'Palvelinvirhe.' })
    }
})



app.listen(port)
console.log('success')
