
function fetchProjects()
{
  var projects = SpreadsheetDb.query(PROJECT_REPORTING_TABLE_NAME)
    .filter("status", SpreadsheetDb.NotEqual, "Archived")
    .orderBy("status", 'DESC')
    .fetch();
  
  for(var i=0; i<projects.length; i++)
  {
    var project = projects[i];
    
    project.done = project.done.trim() == "" ? [] : project.done.trim().split("-");
    project.in_progress = project.in_progress.trim() == "" ? [] : project.in_progress.trim().split("-");
    project.todo = project.todo.trim() == "" ? [] : project.todo.trim().split("-");
    project.blocking_points = project.blocking_points.trim() == "" ? [] : project.blocking_points.trim().split("-");    
  }
  
  return JSON.stringify(projects);
  
}

