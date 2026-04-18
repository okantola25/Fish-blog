require('dotenv').config()
const express = require('express')
const session = require('express-session')
const pgSession = require('connect-pg-simple')(session)
const pool = require('./helpers/db')
const { registerUser, loginUser } = require('./helpers/authHjelper')
const path = require('path')
const bcrypt = require('bcrypt')


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

//vaihda salasana, vaatii vanha salasana ja uuden salasanan.

app.put('/api/change-password', async (req, res) => {
    const userId = req.session.userId
    const { currentPassword, newPassword, confirmPassword } = req.body

    if (!userId) {
        return res.status(401).json({ error: "Kirjaudu sisään." })
    }

    if (!currentPassword?.trim() || !newPassword?.trim() || !confirmPassword?.trim()) {
        return res.status(400).json({ error: "Täytä kaikki kentät." })
    }

    if (newPassword.length < 5) {
        return res.status(400).json({ error: "Uuden salasanan täytyy olla vähintään 5 merkkiä." })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Uudet salasanat eivät täsmää." })
    }

    try {
        const result = await pool.query(
            'SELECT password FROM users WHERE id = $1',
            [userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Käyttäjää ei löytynyt." })
        }

        const hashedPassword = result.rows[0].password
        const passwordMatch = await bcrypt.compare(currentPassword, hashedPassword)

        if (!passwordMatch) {
            return res.status(401).json({ error: "Nykyinen salasana on väärä." })
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10)

        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [newHashedPassword, userId]
        )

        res.json({ message: "Salasana vaihdettu onnistuneesti." })
    } catch (err) {
        console.error("Virhe salasanan vaihdossa:", err)
        res.status(500).json({ error: "Salasanan vaihtaminen epäonnistui." })
    }
})

//tilin poisto, oikea salasana vaaditaan ennen tilin poistoa. 
app.delete('/api/delete-user', async (req, res) => {
    const userId = req.session.userId
    const { password } = req.body

    if (!userId) {
        return res.status(401).json({ error: "Kirjaudu sisään poistaaksesi tilisi." })
    }

    if (!password?.trim()) {
        return res.status(400).json({ error: "Salasana vaaditaan." })
    }

    try {
        const result = await pool.query(
            'SELECT password FROM users WHERE id = $1',
            [userId]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Käyttäjää ei löytynyt." })
        }

        const hashedPassword = result.rows[0].password
        const passwordMatch = await bcrypt.compare(password, hashedPassword)

        if (!passwordMatch) {
            return res.status(401).json({ error: "Väärä salasana." })
        }

        await pool.query('DELETE FROM users WHERE id = $1', [userId])

        req.session.destroy((err) => {
            if (err) {
                console.error(err)
                return res.status(500).json({ error: "Istunnon sulkeminen epäonnistui." })
            }

            res.clearCookie('connect.sid')
            res.json({ message: "Tili poistettu onnistuneesti." })
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Tilin poistaminen epäonnistui." })
    }
})



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
            (SELECT COUNT(*) FROM replies WHERE posts_id = posts.id) AS total_replies,
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

app.get('/api/fishes', async (req, res) => {
    const userId = req.session.userId || null

    try {
        const result = await pool.query(`
            SELECT 
                fishes.*,
                COALESCE(ROUND(AVG((r.rating_thrill + r.rating_rarity + r.rating_taste + r.rating_overall) / 4.0), 1), 0) AS overall_average,

                COALESCE(ROUND(AVG(r.rating_thrill), 1), 0) AS avg_rating_thrill,
                COALESCE(ROUND(AVG(r.rating_rarity), 1), 0) AS avg_rating_rarity,
                COALESCE(ROUND(AVG(r.rating_taste), 1), 0) AS avg_rating_taste,
                COALESCE(ROUND(AVG(r.rating_overall), 1), 0) AS avg_rating_overall,
                COUNT(r.id) AS total_ratings
            FROM fishes
            LEFT JOIN fish_ratings r ON fishes.id = r.fish_id
            GROUP BY fishes.id
            ORDER BY fishes.name ASC
        `)

        res.json(result.rows)
    } catch (err) {
        console.error("Virhe kalojen latauksessa:", err)
        res.status(500).json({ error: "Tietokantavirhe kalojen haussa." })
    }
}) //Lataa kalojen tiedot

app.post('/api/fishes/:id/rate', async (req, res) => {
    const fishId = req.params.id
    const userId = req.session.userId
    const {rating1, rating2, rating3, rating4} = req.body

    if(!userId) return res.status(401).json({ error: "Kirjaudu sisään arvostellaksesi." })

    const isValidRating = (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0 && num <= 5 && (num * 10) % 5 === 0
    }

    if (![rating1, rating2, rating3, rating4].every(isValidRating)) {
        return res.status(400).json({error: "Virheellinen arvosana."})
    }

    try{
        await pool.query(`
            INSERT INTO fish_ratings (fish_id, user_id, rating_thrill, rating_rarity, rating_taste, rating_overall) 
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, fish_id) 
            DO UPDATE SET 
                rating_thrill = EXCLUDED.rating_thrill,
                rating_rarity = EXCLUDED.rating_rarity,
                rating_taste = EXCLUDED.rating_taste,
                rating_overall = EXCLUDED.rating_overall
        `, [fishId, userId, rating1, rating2, rating3, rating4]);

        res.json({ message: "Arvostelu tallennettu!" })
    } catch(err){
        console.error("Virhe arvostelun tallennuksessa:", err)
        res.status(500).json({error: "Tietokantavirhe."})
    }
}) //Kalan arviointi

app.delete('/api/fishes/:id/rate', async (req, res) =>{
    const fishId = req.params.id
    const userId = req.session.userId

    if(!userId) return res.status(401).json({ error: "Kirjaudu sisään poistaaksesi arvostelun." })

    try{
        const result = await pool.query(
            'DELETE FROM fish_ratings WHERE fish_id = $1 AND user_id = $2',
            [fishId, userId]
        )

        if(result.rowCount === 0){
            return res.status(404).json({ error: "Arvostelua ei löytynyt tai se on jo poistettu." })
        }

        res.json({ message: "Arvostelu poistettu onnistuneesti!" })
    }catch(err){
        console.error("Virhe arvostelun poistossa:", err)
        res.status(500).json({ error: "Tietokantavirhe arvostelua poistettaessa." })
    }
}) //Kalan arvioinnin poisto


app.listen(port)
console.log('success')
