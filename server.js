/***************************************************
*****************Dependencies***********************
****************************************************/
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pg = require("pg");
const superAgent = require("superagent");
const ejs = require('ejs');
const override = require('method-override');

/***************************************************
*****************Configuration**********************
****************************************************/
dotenv.config();
const app = express();
app.use(cors());
const client = new pg.Client(process.env.DATABASE_URL);
//const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });//heroko

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.use(override('_method'));
app.set('view engine', 'ejs');

const PORT = process.env.PORT;

/***************************************************
*****************ROUTS******************************
****************************************************/

// HOME PAGE
app.get("/", homePageHandler);

// DETAILS PAGE
app.get("/details/:id", detailsPageHandler);

// LIBRARY PAGE
app.get("/library", libraryPageHandler);

// QUIZ PAGE
app.get("/quiz", quizPageHandler);

// SEARCH PAGE 
app.get("/search", searchHandler);

// ABOUT PAGE
app.get("/about", aboutHandler);

// TOP PAGE
app.get("/top", topHandler);

// ADD MOVIES TO DB
app.post("/add",addMoviesHandler);

// DETAILS PAGE 2
app.get("/details2/:id", details2PageHandler);

//  DELETE MOVIES 
app.delete("/delete/:movie_id", deletemovie);


/***************************************************
*****************HANDLER*****************************
****************************************************/
function homePageHandler(req, res) {
    getHomePageData(req, res);
}
function detailsPageHandler(req, res) {
    getDetailsData(req, res);
    //res.render("pages/details");
}
function libraryPageHandler(req, res) {
    renderMovies(req, res);
}
function quizPageHandler(req, res) {
    res.render("pages/quiz");
}
function searchHandler(req, res) {
    getSearchData(req, res)
}
function aboutHandler(req, res) {
    res.render("pages/about")
}
function topHandler(req, res) {
    getTopData(req, res);

}
function addMoviesHandler(req, res) {
    // console.log('hello');
    saveMovies(req, res);
}
function details2PageHandler(req, res) {
    getDetails2Data(req, res);
}
function deletemovie(req, res) {
    getDelete(req, res);
}

/***************************************************
*****************GETTER*****************************
****************************************************/
function getHomePageData(req, res) {

    let apiUrl = 'https://api.themoviedb.org/3/movie/popular?';
    let query = {
        api_key: process.env.MOVIE_API_KEY,
        language: "en-US",
        page: 1
    }
    superAgent
        .get(apiUrl)
        .query(query)
        .then(data => {
            var movies = JSON
                .parse(data.text)
                .results
                .filter(x => {
                    if (req.query.genraId) {//genra id provided
                        if (req.query.genraId !== "all") {//genre id not All
                            return x.genre_ids.some(x => x == req.query.genraId);
                        } return true;
                    } return true;

                })
                .filter(x => {
                    if (req.query.year) {//year  provided
                        if (req.query.year !== "all") {//year id not All
                            // console.log(x);
                            let newObj = new Date(x.release_date)
                            if (newObj.getFullYear() == req.query.year) {
                                return true;
                            } return false;
                        } return true;
                    } return true;
                })
                .map(element => new Movie(element));
            movies.forEach(element => {
                console.log(element.date)
            });
            res.render("index", { movies: movies, genre: req.query.genraId ? '' : 'clear', year: req.query.year ? '' : 'clear' });
        })
        .catch(error => {
            res.render("error", { "error": error });
        })
}
function getDetailsData(req, res) {
    let movieId = req.params.id;
    let url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.MOVIE_API_KEY}&language=en-US&append_to_response=credits`
    superAgent
        .get(url)
        .then(data => {
            var movie = new Movie(JSON.parse(data.text));
            res.render("pages/details", { movie: movie });
        })
        .catch(error => {
            console.log(error);
            res.render("error", { "error": error });
        })
}
function getSearchData(req, res) {
    let apiUrl = `https://api.themoviedb.org/3/search/movie?query='${req.query.query}'`
    let query = {
        api_key: process.env.MOVIE_API_KEY
    }
    superAgent
        .get(apiUrl)
        .query(query)
        .then(data => {
            var movies = JSON
                .parse(data.text)
                .results
                .map(element => new Movie(element));
            res.render("index", { movies: movies });

        })
        .catch(error => {
            console.log(error);
            res.render("error", { "error": error });
        })

}
function getTopData(req, res) {

    let apiUrl = `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.MOVIE_API_KEY}&language=en-US&page=1`;
    superAgent
        .get(apiUrl)
        .then(data => {
            let movies = JSON.parse(data.text).results;
            movies = movies
                .filter(x => {
                    if (req.query.genraId) {//genra id provided
                        if (req.query.genraId !== "all") {//genre id not All
                            return x.genre_ids.some(x => x == req.query.genraId);
                        } return true;
                    } return true;

                })
                .filter(x => {
                    if (req.query.year) {//year  provided
                        if (req.query.year !== "all") {//year id not All
                            // console.log(x);
                            let newObj = new Date(x.release_date)
                            if (newObj.getFullYear() == req.query.year) {
                                return true;
                            } return false;
                        } return true;
                    } return true;
                })
                .map(x => {
                    return new Movie(x);
                });
            res.render("pages/top", { movies: movies, genre: req.query.genraId ? '' : 'clear', year: req.query.year ? '' : 'clear' });
        })
        .catch(error => {
            console.log(error);
            res.render("error", { error: error });
        });

}
function saveMovies(req, res) {
    let SQL = `INSERT INTO movie(id,title, date, rating, poster, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`
    let reqBody = req.body;
    let values = [reqBody.movieID,reqBody.title, reqBody.date, reqBody.rating, reqBody.poster, reqBody.description];

    client.query(SQL, values)
        .then((data) => {
            // console.log(data);
            res.redirect('./library');
        }).catch(error => {
            console.log(error);
            res.render("error", { error: error });


        });
}
function renderMovies(req, res) {
    let SQL = `SELECT * FROM movie;`;
    client.query(SQL)
        .then(data => {
            // console.log(data.rows);
            res.render('pages/library', { moviesList: data.rows });
        }).catch(error => {
            console.log(error);
            res.render("error", { error: error });
        });
}
function getDetails2Data(req, res) {
    let SQL = `SELECT * FROM movie WHERE id=$1`;
    let id = req.params.id;
    let values = [id];
    client.query(SQL, values)
        .then(data => {
            // console.log(data.rows)
            res.render("pages/details2", { movie: data.rows[0]});
        }).catch(error => {
            console.log(error);
            res.render("error", { error: error });
        });
}
function getDelete(req, res){
    let SQL = 'DELETE FROM movie WHERE id=$1';
    let values = [req.params.movie_id];
    client.query(SQL, values)
        .then(res.redirect('../library'))
        .catch(error => {
            console.log(error);
            res.render("error", { error: error });
        });
}

/***************************************************
*****************HELPER*****************************
****************************************************/

/***************************************************
*****************DATA MODEL*************************
****************************************************/
function Movie(movie) {
    this.movieID = movie.id;
    this.description = movie.overview || 'Not Available';
    this.title = movie.title || 'Not Available';
    this.rating = movie.vote_average || 'Not Available';
    this.poster = "https://image.tmdb.org/t/p/w500" + movie.poster_path || 'Not available';
    this.date = movie.release_date || 'Not Available';

}

// app.listen(PORT, () => {
//     console.log('app is lestining in port ....', PORT);
// });
client.connect().then((data) => {
    app.listen(PORT, () => {
      console.log('the app is listening to ' + PORT);
    });
  }).catch(error => {
    console.log('error in connect to database ' + error);
  });
  