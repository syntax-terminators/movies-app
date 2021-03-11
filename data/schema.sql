DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS actors;
DROP TABLE IF EXISTS movie;
DROP TABLE IF EXISTS score;
CREATE TABLE IF NOT EXISTS
movie(
  id SERIAL PRIMARY KEY NOT NULL,
  -- movieid TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  rating TEXT NOT NULL,
  poster TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS
questions(
  id SERIAL PRIMARY KEY NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  moviesid int not null references movie(id)
);

CREATE TABLE IF NOT EXISTS
actors(
  id SERIAL PRIMARY KEY NOT NULL,
  image TEXT NOT NULL,
  name TEXT NOT NULL,
  moviesid int not null references movie(id)
);

CREATE TABLE IF NOT EXISTS
score(
  id SERIAL PRIMARY KEY NOT NULL,
  score VARCHAR(255) NOT NULL
);
