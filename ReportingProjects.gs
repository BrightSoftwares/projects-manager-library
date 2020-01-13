
/** This report is build for the management **/
function projectReportForManagement()
{
  var projects = getProjectsForManagement();    
  Logger.log(projects.length + " projects fetched.");  
  projectReport(projects, "Reporting for Management", false);
  
}

/** This report is build for the management **/
function projectReportForSergio()
{
  var projects = getProjectsForSergio();    
  Logger.log(projects.length + " projects fetched.");  
  projectReport(projects, "Reporting for Sergio", true);  
}


/** Create a project report **/
function projectReport(projects, reportTitle, displaydates)
{
  var images = {};
  for(var i=0; i<projects.length; i++)
  {
    try
    {
      project = projects[i];
      
      project.done = project.done == undefined || project.done.trim() == "" ? [] : project.done.trim().split(String.fromCharCode(10));
      project.recently_done = project.recently_done == undefined || project.recently_done.trim() == "" ? [] : project.recently_done.trim().split(String.fromCharCode(10));
      project.in_progress = project.in_progress == undefined || project.in_progress.trim() == "" ? [] : project.in_progress.trim().split(String.fromCharCode(10));
      project.todo = project.todo == undefined || project.todo.trim() == "" ? [] : project.todo.trim().split(String.fromCharCode(10));
      project.blocking_points = project.blocking_points == undefined || project.blocking_points.trim() == "" ? [] : project.blocking_points.trim().split(String.fromCharCode(10));
      
      var totalItems = project.done + project.in_progress + project.todo + project.blocking_points;
      var dataTable = Charts.newDataTable();
      dataTable.addColumn(Charts.ColumnType['STRING'], 'Type');
      dataTable.addColumn(Charts.ColumnType['NUMBER'], 'Number of activities');
      dataTable.addRow(["Done", project.done.length]);
      dataTable.addRow(["In progress", project.in_progress.length]);
      dataTable.addRow(["Todo", project.todo.length]);
      dataTable.addRow(["Blocking points", project.blocking_points.length]);
      dataTable.build();
      images["chart"+i] = Charts.newPieChart().setDataTable(dataTable).setDimensions(65, 40).build();
      
      
      project.start_date = Utilities.formatDate(new Date(project.start_date), "GMT+1", "dd/MM/yyyy");
      project.end_date = Utilities.formatDate(new Date(project.end_date), "GMT+1", "dd/MM/yyyy");
    } catch (e) { 
      Logger.log("An error occured during the processing of this project, " + e); 
    }
  }
  
  //Logger.log(projects);
  var meteo = {};
  meteo.windy = "&#127811;";
  meteo.stormy = "&#9928;";
  meteo.sunny = "&#9728;";
  meteo.blast = "&#128163;";
  
  var template = HtmlService.createTemplateFromFile('ProjectReportingTemplate');
  template.projects = projects;
  template.displaydates = displaydates;
  template.reportTitle = reportTitle;
  template.meteo = meteo;
  
  Logger.log(template.evaluate().getContent())
  
  MailApp.sendEmail(DEVELOPPER_EMAIL, "Project reporting - " + reportTitle, '', 
                    { 
                      htmlBody: template.evaluate().getContent(),
                      inlineImages: images 
                    }
  );
}

/** Create a project report in Google Doc **/
function projectReportInGoogleDoc(projects, projectStatuses, displaydates)
{
  //projects = qsort(projects, 1, "ASC");
  var images = {};
  var newDocTitle = "RIOS - Détail du suivi des projets - " + Utilities.formatDate(new Date(), "GMT+2", "dd/MM/yyyy")
  var theDoc = DocumentApp.openById("1ypyQ9Jx2nExBc_9hDhyGdobiNbIbOme_-o5aPlK_KfU").setName(newDocTitle);
  var theDocBody = theDoc.getBody();
  theDocBody.clear();
  
  theDocBody.appendParagraph(newDocTitle).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  var totalItems = projects.length;
  
  var last_project_name = "unknown";
  var last_status = "unknown";
  
  for(var i=0; i<projects.length; i++)
  {
    var project = projects[i];
    var project_name = project[3];
    var status = project[9];
    var task_number = project[11];
    var task_description = project[4];
    
    var isProjectOpen = true;
    for(var j=0; j<projectStatuses.length && isProjectOpen; j++)
    {
      var projectStatusItem = projectStatuses[j];
      var projectStatusItem_name = projectStatusItem[1];
      var projectStatusItem_status = projectStatusItem[13];
      
      if(projectStatusItem_name == project_name)
      {
        if(projectStatusItem_status != "Archived" && projectStatusItem_status != "Delivered" && status != "Abandonned")
        {
          isProjectOpen = false;
            
          if(last_project_name != project_name)
          {
            theDocBody.appendParagraph(project_name).setHeading(DocumentApp.ParagraphHeading.HEADING3);
            last_project_name = project_name;
          }
          
          if(last_status != status)
          {
            theDocBody.appendParagraph(status).setHeading(DocumentApp.ParagraphHeading.HEADING4);
            last_status = status;
          }
          
          theDocBody.appendListItem(task_description).setGlyphType(DocumentApp.GlyphType.SQUARE_BULLET).insertText(0, "(#" + task_number + ") ").setForegroundColor("#ECECEC");
    
        }
        
        if(projectStatusItem_status == "Archived" || projectStatusItem_status == "Delivered")
        {
          isProjectOpen = false;
        }
      }
    }
    
  }
  
  theDocBody.appendHorizontalRule();
  theDocBody.appendPageBreak();
  
}

function buildSergioProjectTimeline()
{
  var projects = getProjectsForSergio();  
  var template = HtmlService.createTemplateFromFile('ProjectTimeline');
  template.projects = projects;
  return template.evaluate();
}

function buildMgmtProjectTimeline()
{
  var projects = getProjectsForManagement();  
  var template = HtmlService.createTemplateFromFile('ProjectTimeline');
  template.projects = projects;
  return template.evaluate();
}

function buildMgmtProjectFollowup()
{
  var projects = getProjectsForManagement();  
  var template = HtmlService.createTemplateFromFile('ProjectFollowup');
  template.projects = projects;
  return template.evaluate();
}

function buildSergioProjectFollowup()
{
  var projects = getProjectsForSergio();  
  var template = HtmlService.createTemplateFromFile('ProjectFollowup');
  template.projects = projects;
  return template.evaluate();
}

function getProjectsForManagement()
{
  return SpreadsheetDb.query(PROJECT_REPORTING_TABLE_NAME)
    .filter("status", SpreadsheetDb.NotEqual, "Archived")
    .filter("status", SpreadsheetDb.NotEqual, "Hidden_From_Managers")
    .orderBy("status", 'DESC')
    .fetch();  
}

function getProjectsForSergio()
{
 return SpreadsheetDb.query(PROJECT_REPORTING_TABLE_NAME)
    .filter("status", SpreadsheetDb.NotEqual, "Archived")
    .orderBy("status", 'DESC')
    .fetch();  
}

function projectToProjectActions()
{
  
  SpreadsheetDb.setPrimaryKey('ProjectTasks', 'task_id');
  //var template = HtmlService.createTemplateFromFile('ProjectTodolistTemplate');
  var projects = getProjectsForSergio();
  
  var todoAndInprogress = [];
  
  for(var i=0; i<projects.length; i++)
  {
    //project = projects[i];    
    //project.done = project.done.trim() == "" ? [] : project.done.trim().split("-");
    var in_progress = projects[i].in_progress.trim() == "" ? [] : projects[i].in_progress.trim().split("-");
    for(var j=0; j<in_progress.length; j++)
    {
      todoAndInprogress.push([projects[i].project_name, "In progress", in_progress[j]]);
      updateProjectAction(undefined, projects[i].project_name, in_progress[j], "In progress", "noturgent_notimportant");
    }
    
    var todo = projects[i].todo.trim() == "" ? [] : projects[i].todo.trim().split("-");
    for(var k=0; k<todo.length; k++)
    {
      todoAndInprogress.push([projects[i].project_name, "To do", todo[k]]);
      updateProjectAction(undefined, projects[i].project_name, todo[k], "To do", "noturgent_notimportant");
    }
  }
  
  // Set the primary key back to the original state
  SpreadsheetDb.setPrimaryKey(TABLE_NAME, 'email_reference');
}

function markProjectActionAsAbandoned(taskId){ markProjectActionStatusAs(taskId.toString().trim(), "Abandoned"); }
function markProjectActionAsDone(taskId) { markProjectActionStatusAs(taskId.toString().trim(), "Done"); }
function markProjectActionStatusAsTodo(taskId){ markProjectActionStatusAs(taskId.toString().trim(), "To do"); }
function markProjectActionStatusAsInprogress(taskId) { markProjectActionStatusAs(taskId.toString().trim(), "In progress"); }
function markProjectActionStatusAsDone(taskId){ markProjectActionStatusAs(taskId.toString().trim(), "Done"); }

function markProjectActionStatusAs(taskId, status)
{
  SpreadsheetDb.setPrimaryKey('ProjectTasks', 'task_id');
  
  var tasks = SpreadsheetDb.query("ProjectTasks")
    .filter("task_id", SpreadsheetDb.Equal, taskId)
    .limit(1)
    .fetch();
  var task = tasks[0];
  task.status = status;
  task.timestamp = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");
  SpreadsheetDb.query("ProjectTasks").update(task.task_id, task);
  
  SpreadsheetDb.setPrimaryKey(TABLE_NAME, 'email_reference');
}

function markProjectActionCategoryAs(taskId, category)
{
  SpreadsheetDb.setPrimaryKey('ProjectTasks', 'task_id');
  
  var tasks = SpreadsheetDb.query("ProjectTasks")
    .filter("task_id", SpreadsheetDb.Equal, taskId)
    .limit(1)
    .fetch();
  var task = tasks[0];
  task.category = category;
  //task.status = category;
  task.timestamp = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");
  SpreadsheetDb.query("ProjectTasks").update(task.task_id, task);
  
  SpreadsheetDb.setPrimaryKey(TABLE_NAME, 'email_reference');
}

function batchUpdateProjectactionTasknumber(tasksJson)
{
  Logger.log("Batch updating projects actions ...");
  var bachResult = "";
  var jsonObject = JSON.parse(tasksJson);
  
  SpreadsheetDb.setPrimaryKey('ProjectTasks', 'task_id');
  
  for(var i in jsonObject)
  {
    Logger.log("Processing task " + i);
    var taskCategory = jsonObject[i]["taskCategory"];
    var taskNumber = jsonObject[i]["taskNumber"];
    var taskDuedate = jsonObject[i]["taskDuedate"];
    var taskDuration = jsonObject[i]["taskDuration"];
    
    //updateProjectactionTasknumber(i, taskCategory,taskNumber);
    var taskId = i; //taskId.toString().trim();
    taskNumber = taskNumber.toString().trim();
    var tasks = SpreadsheetDb.query("ProjectTasks")
      .filter("task_id", SpreadsheetDb.Equal, taskId)
      .limit(1)
      .fetch();
    var task = tasks[0];
    task.task_number = taskNumber;
    task.category = taskCategory;
    task.task_duedate = taskDuedate;
    task.task_duration = taskDuration;
    SpreadsheetDb.query("ProjectTasks").update(task.task_id, task);
    
    bachResult += i + ",";
    Utilities.sleep(300);
  }
  
  SpreadsheetDb.setPrimaryKey(TABLE_NAME, 'email_reference');
  
  Logger.log("Done");
  return bachResult;
}

function updateProjectactionTasknumber(taskId, taskCategory,taskNumber)
{
  SpreadsheetDb.setPrimaryKey('ProjectTasks', 'task_id');
  
  taskId = taskId.toString().trim();
  taskNumber = taskNumber.toString().trim();
  var tasks = SpreadsheetDb.query("ProjectTasks")
    .filter("task_id", SpreadsheetDb.Equal, taskId)
    .limit(1)
    .fetch();
  var task = tasks[0];
  task.task_number = taskNumber;
  task.category = taskCategory;
  //task.aijson = getAIIntent(task.project_name + " : " + task.task_description);
  SpreadsheetDb.query("ProjectTasks").update(task.task_id, task);
  //Utilities.sleep(3000);
  
  SpreadsheetDb.setPrimaryKey(TABLE_NAME, 'email_reference');
}


function updateProjectAction(task_id, projectname, taskdescription, taskstatus, taskcategory, taskduedate, taskduration)
{
  SpreadsheetDb.setPrimaryKey('ProjectTasks', 'task_id');
  
  var aiJsonResponse = "{}";
  
  var tasks = SpreadsheetDb.query("ProjectTasks")
    .filter("task_id", SpreadsheetDb.Equal, task_id)
    .limit(1)
    .fetch();
  
  /*var tasks = SpreadsheetDb.query("ProjectTasks")
    .filter("project_name", SpreadsheetDb.Equal, projectname)
    .filter("task_description", SpreadsheetDb.Equal, taskdescription)
    .limit(1)
    .fetch();
    */
  
  var task = tasks[0];
  
  Logger.log("Tasks : " + tasks);
  Logger.log("Task : " + task);
  
  
  if(task == undefined || task.task_description != taskdescription)
  {
    var aiResponse = getAIIntent(projectname + " : " + taskdescription);
    aiJsonResponse = aiResponse.getContentText();
  }
  
  if(task == undefined || task.task_id == undefined)
  {
    // Create a new task
    Logger.log("Creating new task");
    var now = new Date();
    var threedayslater = new Date(now.getTime() + 3*24*60*60);
    SpreadsheetDb.query("ProjectTasks").create({
      task_id: generateId(),
      timestamp: Utilities.formatDate(now, "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      creation_date: Utilities.formatDate(now, "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      project_name: projectname,
      task_description: taskdescription,
      status: taskstatus,
      category: taskcategory,
      task_duration: taskduration.trim(),
      task_tags: "",
      task_predecessors: "",
      task_duedate: Utilities.formatDate(threedayslater, "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'"),      
      aijson: aiJsonResponse,
      task_number: 1000
    });
    
  }
  else
  {
    Logger.log("Updating existing task");
    task.project_name = projectname;
    task.task_description = taskdescription;
    task.status = taskstatus;
    task.category = taskcategory;
    task.task_duedate = taskduedate;
    task.aijson = aiJsonResponse;
    task.task_duration = taskduration;
    SpreadsheetDb.query("ProjectTasks").update(task.task_id, task);    
  }
  
  // Set the primary key back to the original state
  SpreadsheetDb.setPrimaryKey(TABLE_NAME, 'email_reference');
}

function retrieveProjectTasksSortedbylastupdated()
{
  return SpreadsheetDb.query("ProjectTasks").orderBy("timestamp", 'ASC').fetch();  
}

function retrieveProjectTasks()
{
  return SpreadsheetDb.query("ProjectTasks").orderBy("task_number", 'ASC').fetch();  
}