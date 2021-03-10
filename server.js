/***************************************************
*****************Dependencies***********************
****************************************************/
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pg = require("pg");
const superAgent = require("superagent");
const override = require('method-override');
const { Template } = require('ejs');
const { del } = require('superagent');

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
// QUIZZ SCORE
app.get("/quiz/score", quizScoreHandler);





/***************************************************
*****************HANDLER*****************************
****************************************************/
function homePageHandler(req, res) {
    getHomePageData(req, res);
}
function detailsPageHandler(req, res) {
    getDetailsData(req, res);
}
function libraryPageHandler(req, res) {
    renderMovies(req, res);
}
function quizPageHandler(req, res) {
    getQuiz(req,res);
   // res.render("pages/quiz");
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
    saveMovies(req, res);
}
function details2PageHandler(req, res) {
    getDetails2Data(req, res);
}
function deletemovie(req, res) {
    getDelete(req, res);
}
function quizScoreHandler(req,res) {
    let quiz=JSON.parse(req.query.quizes)
    //console.log(quiz);
    let correctChoice=[];
    quiz.forEach(x=>{
        x.forEach(u=>{
            correctChoice.push(u.correctChoice)
        }); 
    });

    console.log("*************************");
    let userChoice=Object.values(req.query);
    userChoice.length=userChoice.length-1;
    console.log(userChoice);
    console.log("*************************");
    console.log("choice ",correctChoice);
    let total=0;
    userChoice.forEach((x,i)=>{
        if(typeof correctChoice[i] === 'object'){
            if(correctChoice[i].includes(x.toString())){
                total ++;
            }
        } else{
            if(x==correctChoice[i])total++;
        }
        // if(i+1%3==0){//actors array
        //     if(correctChoice[i].includes(x.toString()))total++;
        // }
        // if(x==correctChoice[i])total++;
        
    })
    console.log('total', total)
    // total=((total/(userChoice.length)).toFixed(1))*100
    // res.redirect(`/library?score=${total}`)
    let deleteScore = 'DELETE FROM score;';
    client.query(deleteScore).then(() =>{
        let addScore = 'INSERT INTO score(score) VALUES($1);';
        client.query(addScore, [total]).then(() =>{
            console.log('score added to the database')
        }).catch(error => res.render('error'))
    })
    res.redirect('/library');
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
                //console.log(element.date)
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
            let movieId =req.params.id;
            let apiUrl=`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.MOVIE_API_KEY}&language=en-US&append_to_response=credits`
            superAgent
            .get(apiUrl)
            .then(data=>{
                let actors=JSON.parse(data.text).credits.cast;
                if(actors.length>10)actors.length=10;
                // console.log(actors)
                actors = actors.map(actor => new Actor(actor));
                res.render("pages/details", { movie: movie,actors:actors });
            })
            .catch(error=>{
                res.render("error",{error:error})
            });
            
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
            res.render("index", { movies: movies, genre: req.query.genraId ? '' : 'clear', year: req.query.year ? '' : 'clear' });

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
function getDetails2Data(req, res) {
    let SQL = `SELECT * FROM movie WHERE id=$1`;
    let id = req.params.id;
    let values = [id];
    client.query(SQL, values)
        .then(data => {
            let SQL2 = `SELECT * FROM actors WHERE moviesid=$1`;
            client.query(SQL2, values).then(data2 => {
                res.render("pages/details2", { movie: data.rows[0],actors:data2.rows});
            });
        }).catch(error => {
            console.log(error);
            res.render("error", { error: error });
        });
}
function getDelete(req, res){

        let values = [req.params.movie_id];
        let SQL2 = 'DELETE FROM actors WHERE moviesid=$1';
        client.query(SQL2, values)
        .then(data=>{
            let SQL = 'DELETE FROM movie WHERE id=$1';
            client.query(SQL, values)
                .then(data=>{
                    let deleteScore = 'DELETE FROM score;'
                    client.query(deleteScore).then(() =>{
                        console.log('score reset')
                        res.redirect('../library')
                    }).catch(error => res.render('error', {error: error})) 
                })
                .catch(error => {
                    console.log(error);
                    res.render("error", { error: error });
                });
        })
        .catch(error => {
            console.log(error);
            res.render("error", { error: error });
        });

}
function getQuiz(req,res) {
   let SQL=`SELECT * FROM movie`;
    client.query(SQL)
        .then(data => {
        formatMoviesList(data.rows,res);
       // res.send(data.rows);
        }).catch(error => {
            //console.log(error);
            res.render("error", { error: error });
        });
}


/***************************************************
*****************HELPER*****************************
****************************************************/
function formatMoviesList(movies,res) {
    let temp=[];
    let sql=`SELECT name FROM actors WHERE moviesid=$1 `
    movies.forEach(x=>{
        let safeValue=[x.id];
        client.query(sql,safeValue).then(data=>{
            let actors=data.rows.map(x=>x.name);
            var movie={
                name:x.title,
                rating:x.rating,
                date:new Date(x.date).getFullYear().toString(),
                actors:actors
            }
            temp.push(movie);
            if(temp.length==movies.length){//final movie
                generateQuiz(res,temp);
            };
        })
    });
}
function generateQuiz(res,temp) {
    const questionTemplate={
        rating:{
            question:'what is the rating of the ',
            choises:getRandomRatingArray()
        },
        date :{
            question:'what is the date of the ',
            choises:getRandomYear()
        },
        actors:{
            question:"one of the following actors act in the ",
            choises:["Alain Moussi","Eddie Steeples","Yang Yang","Scarlet johanson","Jackie Chan","Al Pacino","William Hanna"]
        }    
}

let quizList=getQuizList(temp,questionTemplate);

quizList.forEach(questions =>{
    questions.map(question =>{
       
       if(typeof question.correctChoice !=typeof {}){
        if(!question.choises.includes(question.correctChoice))
        question.choises.push(question.correctChoice);
        question.choises = shuffleArray(question.choises)
        return question
       }else{
        //    let randomActor=question.correctChoice[getRandom(question.correctChoice.length)];
        let randomActor=question.correctChoice[0];
           if(!question.choises.includes(randomActor))
            question.choises.push(randomActor);
            question.choises = shuffleArray(question.choises)
            return question  
       }
    })
})
res.render('pages/quiz', {quizes: quizList});
}
function getQuizList(movies,questionTemplate) {
    var temp=[]
    movies.forEach(element => {
        temp.push(getQuiz2(element,questionTemplate));
    });
    temp = shuffleArray(temp);
    if(temp.length > 5){
        temp = temp.slice(0, 5);
    }
    return temp;
}  
function getQuiz2(movie,template) {
    var questions=getQuestionList(movie,template);
    return questions;
}
function getQuestionList(movie,template) {
    let temp=[];
    // console.log("template : ",template);
    
    let questionsNumber=Object.entries(template).length;
    
    let moviesKeys=Object.keys(movie);
    let templateKeys=Object.keys(template);
    moviesKeys.forEach(x=>{
        templateKeys.forEach(y=>{
            if(x==y){
                //x== actors
                //
                
                let choises=template[y].choises;
                let header=template[y].question;
                let correctChoice=movie[x];
                
                
                 //console.log(movie)
                var question={
                    header:header+movie.name+" movie?",
                    choises:choises,
                    correctChoice:correctChoice
                }
               //console.log("choices=: ",choises)
                temp.push(JSON.parse(JSON.stringify(question)));
                
            };
        })
    })
    return temp;
}
function saveMovies(req, res) {
    let SQL = `INSERT INTO movie(id,title, date, rating, poster, description) VALUES ($1, $2, $3, $4, $5, $6)`
    let reqBody = req.body;
    let values = [reqBody.movieID,reqBody.title, reqBody.date, reqBody.rating, reqBody.poster, reqBody.description];

    client.query(SQL, values)
        .then((data) => {
            let actorsjson = JSON.parse(req.body.actors);
            actorsjson.forEach(actor=>{
            let values2 = [actor.poster,actor.name,reqBody.movieID];
            let SQL2 = `INSERT INTO actors(image, name, moviesid) VALUES ($1, $2, $3)`
            client.query(SQL2, values2)
                .then((data) => {
                    let deleteScore = 'DELETE FROM score;'
                    client.query(deleteScore).then(()=>{
                        console.log('score reset')
                    }).catch(error => res.render('error', {error: error}))
                }).catch(error => {
                    console.log(error);
                    res.render("error", { error: error });
                });
        
            }); res.redirect('/library');

        }).catch(error => {
            console.log(error);
            res.redirect("/");//raw already exist
            //res.render("error", { error: error });
        });



}
function renderMovies(req, res) {
    let SQL = `SELECT * FROM movie;`;
    client.query(SQL)
        .then(data => {
            let getScoreQuery = 'SELECT * FROM score'
            client.query(getScoreQuery).then(score =>{
                if(score.rows.length >= 1){
                    res.render('pages/library', { moviesList: data.rows, score: score.rows[0].score});
                } else{
                    res.render('pages/library', { moviesList: data.rows});
                }
            }).catch()
            
        }).catch(error => {
            console.log(error);
            res.render("error", { error: error });
        });
}
function getRandom(max) {
  return  Math.floor(Math.random() * max)
}
function getFloatRandom(max) {
    return  (Math.random() * max).toFixed(1);
}
function getRandomRatingArray(){
    let temp=[];
    for (let index = 0; index < 30; index++) {
        let rand=getFloatRandom(10)
        if(!temp.includes(rand))
        temp.push(rand.toString())
        if(temp.length==6)break;
    }
    return temp;
}
function getRandomYear() {
    let temp=[];
    for (let index = 0; index < 30; index++) {
        let rand=Math.floor(Math.random() * 41) + 1980;
        if(!temp.includes(rand.toString()))
        temp.push(rand.toString())
        if(temp.length==6)break;
    }
    return temp;
}
function shuffleArray(array) { // Durstenfeld shuffle 
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

/***************************************************
*****************DATA MODEL*************************
****************************************************/
function Movie(movie) {
    this.movieID = movie.id;
    this.description = movie.overview || 'Not Available';
    this.title = movie.title || 'Not Available';
    this.rating = movie.vote_average || 'Not Available';
    this.poster = movie.poster_path ? "https://image.tmdb.org/t/p/w500" + movie.poster_path : '../img/default-poster.png'
    this.date = movie.release_date || 'Not Available';

}
function Actor(actor){
    this.name = actor.name;
    this.character = actor.character;
    this.poster = actor.profile_path ? ("https://image.tmdb.org/t/p/w500" + actor.profile_path) : '../img/default-poster.png'
}


client.connect().then((data) => {
    app.listen(PORT, () => {
      console.log('the app is listening to ' + PORT);
    });
  }).catch(error => {
    console.log('error in connect to database ' + error);
  });
  