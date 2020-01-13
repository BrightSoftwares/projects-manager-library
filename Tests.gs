function testPostArticleToGithub() {

  var fileBody = "---\
layout: post\
title:  \"Testing Options for creating a new site with Jekyll\"\
author: john\
categories: [ Jekyll, tutorial, tests ]\
image: assets/images/13.jpg\
date: 2018-01-12\
---\
\
`jekyll new <PATH>` installs a new Jekyll site at the path specified (relative to current directory). \
In this case, Jekyll will be installed in a directory called `myblog`. Here are some additional details:";
  
  postFileToGithub(fileBody);
}

function testPostArticle(){
  
  var posttitle = "This is a Lkoh icorne Hangoon dummy article";
  var postdate = new Date(2019, 12, 03, 14, 21);
  var postbody = "This is a glorious entry from the Lord. 23 Hang  kok Lic";
  var commiteremail = "full3right@gmail.com";
  var ghowner = "sergioafanou";
  var ghrepo = "blog";
  var ghuser = "sergioafanou";
  var ghtoken = PropertiesService.getScriptProperties().getProperty(GH_REPO);
  postArticle(posttitle, postdate, postbody, commiteremail, ghowner, ghrepo, ghuser, ghtoken);
  
}
