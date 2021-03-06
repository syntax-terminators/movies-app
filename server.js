/***************************************************
*****************Dependencies***********************
****************************************************/
const express =require('express');
const cors=require('cors');
const dotenv=require('dotenv');
const pg=require("pg");
const superAgent=require("superagent");
const ejs = require('ejs');

/***************************************************
*****************Configuration**********************
****************************************************/
dotenv.config();
const app = express();
app.use(cors());
//const client = new pg.Client(process.env.DATABASE_URL);
//const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });//heroko

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

const PORT=process.env.PORT;

/***************************************************
*****************ROUTS******************************
****************************************************/

// HOME PAGE
app.get("/",homePageHandler);

// DETAILS PAGE
app.get("/details/:id",detailsPageHandler);

// LIBRARY PAGE
app.get("/library",libraryPageHandler);

// QUIZ PAGE
app.get("/quiz",quizPageHandler);



/***************************************************
*****************HANDLER*****************************
****************************************************/
function homePageHandler(req,res) {
    getHomePageData(req,res);
}
function detailsPageHandler(req,res) {
    getDetailsData(req,res);
    //res.render("pages/details");
}
function libraryPageHandler(req,res) {
    res.render("pages/library");
}
function quizPageHandler(req,res) {
    res.render("pages/quiz");
}

/***************************************************
*****************GETTER*****************************
****************************************************/
function getHomePageData(req,res) {
    let apiUrl='https://api.themoviedb.org/3/movie/popular?';
    let query={
        api_key:process.env.MOVIE_API_KEY,
        language:"en-US",
        page:1
    }
    superAgent
    .get(apiUrl)
    .query(query)
    .then(data=>{
        var movies=JSON
        .parse(data.text)
        .results
        .map(element=>new Movie(element));
        console.log(movies)
        res.render("index",{movies:movies});
    })
    .catch(error=>{
        res.render("error",{"error":error});
    })
}
function getDetailsData(req,res) {
    let movieId=req.params.id;
    let apiUrl=`https://api.themoviedb.org/3/movie/${movieId}?`;
    let query={
        api_key:process.env.MOVIE_API_KEY,
        language:"en-US",
        page:1,
        append_to_response:"credits"
    }
    superAgent
    .get(apiUrl)
    .query(query)
    .then(data=>{
        var movies=new Movie(JSON.parse(data.text)) ;
        res.render("index",{movies:movies});
    })
    .catch(error=>{
        res.render("error",{"error":error});
    })
}


/***************************************************
*****************HELPER*****************************
****************************************************/

/***************************************************
*****************DATA MODEL*************************
****************************************************/
function Movie(movie){
    this.movieID = movie.id;
    this.description = movie.overview || 'Not Available';
    this.title = movie.title || 'Not Available';
    this.rating = movie.vote_average || 'Not Available';
    this.poster = "https://image.tmdb.org/t/p/w500" + movie.poster_path || 'Not available';
    this.date = movie.release_date || 'Not Available';
}

app.listen(PORT, () => {
    console.log('app is lestining in port ....', PORT);
});


