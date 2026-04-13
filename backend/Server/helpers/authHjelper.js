const bcrypt = require('bcrypt')
const db = require('./db')

const registerUser = async (username, password) =>{
    const hashedPassword = await bcrypt.hash(password, 10)
    return await db.query(
        'INSERT INTO users (username, password) VALUES ($1, $2)',
            [username, hashedPassword]
        )
} //Käyttäjän rekisteröinti

const loginUser = async (username, password) =>{
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username])

    if (result.rows.length > 0) {
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) return user; // Kirjautuminen onnistuu
    }
    return null; // Jos ei onnistu
} //Sisään kirjautuminen

module.exports = {
    registerUser,
    loginUser
}