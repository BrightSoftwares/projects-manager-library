function doGet(e) {
  if(e && e.parameter && e.parameter.debug){
    return testMyMailbox();
  }
  if(e && e.parameter && e.parameter.invalidate){
    ScriptApp.invalidateAuth();
    return HtmlService.createHtmlOutput("You authorizations were reset. Refresh the page to authorize again...");
  }
  if(e && e.parameter && e.parameter.report){
    return buildDashboard();
  }
  if(e && e.parameter && e.parameter.todolist){
    return buildTodolist();
  }
  if(e && e.parameter && e.parameter.projecttodolist){
    return buildProjectTodolist();
  }
  if(e && e.parameter && e.parameter.sergiotimeline){
    return buildSergioProjectTimeline();
  }  
  if(e && e.parameter && e.parameter.mgmttimeline){
    return buildMgmtProjectTimeline();
  }
  if(e && e.parameter && e.parameter.projectfollowup){
    return buildMgmtProjectFollowup();
  }
  if(e && e.parameter && e.parameter.projecttodolistreview)
  {
    return buildProjectTodolistReview();
  }
  if(e && e.parameter && e.parameter.activitytodolistreview)
  {
    return buildActivityTodolistReview();
  }
  if(e && e.parameter && e.parameter.decisiontree)
  {
    return buildDecisionTree();
  }
  else {
    var template = HtmlService.createTemplateFromFile('ActivityStatsTemplate');
    template.account = Session.getActiveUser().getEmail();
    return template.evaluate();
  }
}

function buildDecisionTree(){
  
  var template = HtmlService.createTemplateFromFile('ProjectDecisionTree');
  /*template.activeprojectlist = SpreadsheetDb.query(TABLE_NAME).filter("email_reference", SpreadsheetDb.NotEqual, "").filter("status", SpreadsheetDb.NotEqual, CLOSE_STATUS_STRING).fetch();
  template.account = Session.getActiveUser().getEmail();
  template.nbrOfActivities = template.activeprojectlist.length;
  template.strBeginDate = new Date();
  template.strEndDate = new Date();
  */
  return template.evaluate();
}

function buildTodolist(){
  
  var template = HtmlService.createTemplateFromFile('ActivityTodolistTemplate');
  template.activeprojectlist = SpreadsheetDb.query(TABLE_NAME).filter("email_reference", SpreadsheetDb.NotEqual, "").filter("status", SpreadsheetDb.NotEqual, CLOSE_STATUS_STRING).fetch();
  template.account = Session.getActiveUser().getEmail();
  template.nbrOfActivities = template.activeprojectlist.length;
  template.strBeginDate = new Date();
  template.strEndDate = new Date();
  
  return template.evaluate();
}

function buildActivityTodolistReview()
{
  var template = HtmlService.createTemplateFromFile('ActivityTodolistReviewTemplate');
  var projects = getProjectsForSergio();
  
  var todoAndInprogress = retrieveProjectTasks();
    
  template.totalItems = todoAndInprogress.length;
  template.projectTodo = todoAndInprogress;
  template.account = Session.getActiveUser().getEmail();
  
  return template.evaluate();  
}

function buildProjectTodolistReview()
{
  var template = HtmlService.createTemplateFromFile('ProjectTodolistReviewTemplate');
  var projects = getProjectsForSergio();
  
  var todoAndInprogress = retrieveProjectTasks();
    
  template.totalItems = todoAndInprogress.length;
  template.projectTodo = todoAndInprogress;
  template.account = Session.getActiveUser().getEmail();
  
  return template.evaluate();
}

function buildProjectTodolist(){
  
  var template = HtmlService.createTemplateFromFile('ProjectTodolistTemplate');
  var projects = getProjectsForSergio();
  
  var todoAndInprogress = retrieveProjectTasks();
    
  template.totalItems = todoAndInprogress.length;
  template.projectTodo = todoAndInprogress;
  template.account = Session.getActiveUser().getEmail();
  
  return template.evaluate();
}

function buildDashboard(){
  var uiApp = UiApp.createApplication().setTitle("Activity tracker dashboard").setStyleAttribute("overflow", "scroll").setStyleAttribute("height", "900px");
  var panel = uiApp.createVerticalPanel();
  
  var charts = buildCharts();
  panel.add(uiApp.createLabel("Daily traffic").setStyleAttribute("font-size", "16px"));
  panel.add(charts["dailytraffic"]);
  panel.add(uiApp.createLabel("Weekly traffic").setStyleAttribute("font-size", "16px"));
  panel.add(charts["weeklytraffic"]);
  panel.add(uiApp.createLabel("Monthly traffic").setStyleAttribute("font-size", "16px"));
  panel.add(charts["monthlytraffic"]);
  panel.add(uiApp.createLabel("Burn up chart").setStyleAttribute("font-size", "16px"));
  panel.add(charts["burnupchart"]);
  panel.add(uiApp.createLabel("Workload chart").setStyleAttribute("font-size", "16px"));
  panel.add(charts["workloadchart"]);
  panel.add(uiApp.createLabel("Backlog evolution").setStyleAttribute("font-size", "16px"));
  panel.add(charts["backlogevolution"]);
  panel.add(uiApp.createLabel("Activity per type").setStyleAttribute("font-size", "16px"));
  panel.add(charts["activitypertype"]);
  panel.add(uiApp.createLabel("Activity per type (stacked)").setStyleAttribute("font-size", "16px"));
  panel.add(charts["activitypertypestacked"]);
  panel.add(uiApp.createLabel("Activity per status").setStyleAttribute("font-size", "16px"));
  panel.add(charts["labelized"]);
  panel.add(uiApp.createLabel("Project gantt").setStyleAttribute("font-size", "16px"));
  panel.add(charts["projectgantt"]);
  if(charts["attachments"] != undefined){
    panel.add(uiApp.createLabel("Attachments").setStyleAttribute("font-size", "16px"));
    panel.add(charts["attachments"]);
  }
  panel.add(uiApp.createLabel("Word count").setStyleAttribute("font-size", "16px"));
  panel.add(charts["messageslength"]);
  panel.add(uiApp.createLabel("Response time").setStyleAttribute("font-size", "16px"));
  panel.add(charts["responsetime"]);
  
  uiApp.add(panel);
  return uiApp;
}
