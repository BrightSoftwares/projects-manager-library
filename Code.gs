// server.js
// where your node app starts

// init project
//var express = require('express');
//var bodyParser = require('body-parser');
//var moment = require('moment');
//var chrono = require('chrono-node');
//var app = express();
//var GitHubApi = require('github');

//var github = new GitHubApi();

//app.use(bodyParser.text());
//app.post("/", (req, res) => {

SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
WEBHOOK_TOKEN = PropertiesService.getScriptProperties().getProperty("WEBHOOK_TOKEN");
GH_USER = PropertiesService.getScriptProperties().getProperty("GH_USER");
GH_TOKEN = PropertiesService.getScriptProperties().getProperty("GH_TOKEN");
GH_REPO = PropertiesService.getScriptProperties().getProperty("GH_REPO");
TABLE_NAME = "Schedule";

SpreadsheetDb.setWorkingSpreadsheet(SPREADSHEET_ID);
SpreadsheetDb.setPrimaryKey(TABLE_NAME, 'id');


function doPost(e){
  if (e.parameter.token !== process.env.WEBHOOK_TOKEN)
    res.sendStatus(400);
  
  var fileBody = e.parameter.body;
  postFileToGithub(fileBody, GH_USER, GH_REPO, GH_USER, GH_TOKEN);
}


/**
Browse the articles to post, process them if their date is reached
*/
function processArticles(){
  var articles = SpreadsheetDb.query(TABLE_NAME).filter("poststatus", SpreadsheetDb.NotEqual, "posted").fetch();
  var now = new Date();
  
  for(var i=0; i<articles.length; i++){
    // Process each article
    var article = articles[i];
    var article_date = new Date(article.scheduleddatetime);
    
    if(article_date <= now){
      // If the article date has passed
      var fileBody = "This is a fake body";
      var ghowner = article.ghowner;
      var ghrepo = article.ghrepo;
      var ghuser = article.ghuser;
      var ghtoken = GH_TOKEN;
      var email = "full3right@gmail.com";
      postArticle(article.posttitle, article_date, fileBody, email, ghowner, ghrepo, ghuser, ghtoken);
      
      // Update the article status
      article.poststatus = "posted";
      SpreadsheetDb.query(TABLE_NAME).update(article.id, article);
      
      Logger.log("The article " + article.posttitle + " has been posted");
    }
    else{
      Logger.log("The article "+ article.posttitle +"'s date "+ article_date +" has not passed yet.");
    }
  }
}

/**
* Post a file to github
*/
function postFileToGithub(fileBody, ghowner, ghrepo, ghuser, ghtoken){
  
  console.log("Req body is:" + JSON.stringify(fileBody))
  var body = fileBody.replace(/\|\|\|/g, '\n');
  var title;
  var titleSearch = body.match(/title: (.*?)\n/);
  if (titleSearch && titleSearch.length > 0) {
    title = titleSearch[1];
  }
  var dateSearch = body.match(/date: (.*?)\n/);
  var date = new Date(); //dateSearch[1] ? parseFileDate(dateSearch[1]) : new Date();
  
  
  var email = "full3right@gmail.com";
  postArticle(title, date, body, email, ghowner, ghrepo, ghuser, ghtoken);
}

function postArticle(posttitle, postdate, postbody, commiteremail, ghowner, ghrepo, ghuser, ghtoken){
  Logger.log("postArticle > Posting article title " + posttitle + ", postdate " + postdate + ", commiter email " + commiteremail);
  /*github.authenticate({
    type: 'oauth',
    token: process.env.GH_TOKEN
  })*/
  var ghclient = new GithubClient(ghowner, ghrepo, ghuser, ghtoken);
  
  /**github.repos.createFile({
    owner: process.env.GH_USER,
    repo: process.env.GH_REPO,
    //path: `_posts/${moment(date).format('YYYY-MM-DD-HH-mm-ss-')}${title}.html`,
    message: "post via ifttt-ghpages",
    branch: "gh-pages",
    content: new Buffer(body).toString('base64')
  }, function(err, resp) {
    if (err) {
      console.log('error: ' + err);
      res.sendStatus(500);
    } else {
      console.log('success: ' + resp);
      res.sendStatus(200);
    }
  });
  */
  var titleslug = convertToSlug(posttitle);
  //var content = "This is a simple file to commit";
  var filename = "_posts/" + Utilities.formatDate(postdate, "GMT", "YYYY-MM-dd-") + titleslug + ".html";
  
  var header = "---\n\
layout: post\n\
title:  \""+ posttitle +"\"\n\
author: john\n\
categories: [ Jekyll, tutorial ]\n\
description: \"This is also a dummy description for "+ posttitle +"\"\n\
image: https://sergioafanou.github.io/blog/assets/images/13.jpg\n\
---\n\n\n";
  
  postbody = header + postbody;
  
  ghclient.commit(postbody, filename, commiteremail);

};


function parseFileDate(date){
  return new Date();  
}

/**
* Converts a title into a slug
*/
function convertToSlug(text)
{
    return text.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
}


// listen for requests :)
//var listener = app.listen(process.env.PORT, function () {
//  console.log('Your app is listening on port ' + listener.address().port);
//});


/**
Return a fresh article object
*/
function getFreshArticle(){
  var article = {};
  article.id = generateId();
  article.feed = "";	
  article.feedtype = "";
  article.feedname = "";
  article.posttitle = "";
  article.postcontent = "";
  article.keywords = "";
  article.ghowner = "";
  article.ghrepo = "";
  article.ghuser = "";
  article.scheduleddatetime = "";
  article.poststatus = "";
  
  return article;
}

/**
Generates an unique ID for the articles
*/
function generateId(){ return Math.floor((1 + Math.random()) * 0x100000000000).toString(16); }

/**

*/
function initProjectParameters_(){
  
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", "initialvalue");
  PropertiesService.getScriptProperties().setProperty("WEBHOOK_TOKEN", "initialvalue");
  PropertiesService.getScriptProperties().setProperty("GH_USER", "initialvalue");
  PropertiesService.getScriptProperties().setProperty("GH_TOKEN", "initialvalue");
  PropertiesService.getScriptProperties().setProperty("GH_REPO", "initialvalue");
  
}