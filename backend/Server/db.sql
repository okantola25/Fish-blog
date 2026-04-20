-- Database pöydät menee pgadmin4 niin voi testata local db ennen ku laitetaa julki
-- DELETE ON CASCADE meinaa että jos poistaa tilin nii poistaa muistaki db pöydistä tiedot

-- Käyttäjät pöytä
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL
);

-- Forum postien pöytä
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(1024) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forum vastaukset pöytä
CREATE TABLE replies (
    id SERIAL PRIMARY KEY,
    posts_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(1024) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Forum postien tykkäykset
CREATE TABLE postLikes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Käyttäjien istunnot pöytä
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);

-- Kalatiedot pöytä
CREATE TABLE fishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(100),
    description TEXT,
    image_url VARCHAR(255)
);

INSERT INTO fishes (name, scientific_name, description, image_url)
VALUES 
    ('Hauki', 'Esox lucius', 'Suomen vesistöjen suurimpia petokaloja.', 'hauki.jpg');

-- Kalojen arvosanat pöytä
CREATE TABLE fish_ratings (
    id SERIAL PRIMARY KEY,
    fish_id INTEGER REFERENCES fishes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating_thrill NUMERIC(2,1) CHECK (rating_thrill >= 0 AND rating_thrill <= 5),
    rating_rarity NUMERIC(2,1) CHECK (rating_rarity >= 0 AND rating_rarity <= 5),
    rating_taste NUMERIC(2,1) CHECK (rating_taste >= 0 AND rating_taste <= 5),
    rating_overall NUMERIC(2,1) CHECK (rating_overall >= 0 AND rating_overall <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, fish_id)
);



ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
