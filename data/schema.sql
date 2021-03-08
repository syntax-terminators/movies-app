DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS actors;
DROP TABLE IF EXISTS movie;

CREATE TABLE IF NOT EXISTS
movie(
  id SERIAL PRIMARY KEY NOT NULL,
  title VARCHAR(256) NOT NULL,
  date VARCHAR(256) NOT NULL,
  rating VARCHAR(256) NOT NULL,
  poster VARCHAR(256) NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS
questions(
  id SERIAL PRIMARY KEY NOT NULL,
  question VARCHAR(256) NOT NULL,
  answer VARCHAR(256) NOT NULL,
  moviesid int not null references movie(id)
);

CREATE TABLE IF NOT EXISTS
actors(
  id SERIAL PRIMARY KEY NOT NULL,
  image VARCHAR(256) NOT NULL,
  name VARCHAR(256) NOT NULL,
  moviesid int not null references movie(id)
  );
  
