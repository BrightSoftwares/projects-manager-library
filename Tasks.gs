/**
* For each activity in the spreadsheet, 
* if the status is done, mark the corresponding task as done too
*/
function markDoneActivitiesTasks(){
  var activities = SpreadsheetDb.query(TABLE_NAME).filter("status", SpreadsheetDb.Equal, "Done").filter("task_id", SpreadsheetDb.NotEqual, "").fetch();
  
  Logger.log("Got " + activities.length + " activities");
  
  for(var i=0; i<activities.length; i++)
  {
    var activity = activities[i];
    
    setTaskAsDone(TASKLIST_ID, activity.task_id);
  }
}


/**
 * Adds a task to a tasklist.
 * @param {string} taskListId The tasklist to add to.
 * @param {string} tasksTitle The tasklist to add to.
 * @param {string} taskNote The tasklist to add to.
 */
function addTask(taskListId, tasksTitle, taskNote) {
  var task = {
    title: tasksTitle,
    notes: taskNote
  };
  
  var gmailLink = "https://thebestui.io";
  var gmailLinkDescription = "The link to the best";
  gmailLinkItem = Tasks.newTaskLinks(); //{link: gmailLink, description: gmailLinkDescription, type: 'email'};
  gmailLinkItem.type = 'email';
  gmailLinkItem.link = gmailLink;
  gmailLinkItem.description = gmailLinkDescription;
  
  Logger.log("Adding gmail link to task id %s. Link item is %s", task.id, gmailLinkItem);
  
  if (task.links === undefined) { Logger.log("This task links was undefined."); task.links = []; }
  
  task.links.push(gmailLinkItem);
  Logger.log("Old task is %s", task);
  
  
  task = Tasks.Tasks.insert(task, taskListId);
  
  Logger.log('Task with ID "%s" was created.', task.id);
  return task.id;
}

/**
* Set a task to completed.
*
*/
function setTaskAsDone(taskListId, taskId){
  
  Logger.log("Set task as Done to task list id %s and task Id %s", taskListId, taskId);
  
  if(taskId == "unknown" || taskId == "")
  {
    return "unknown";
  }
  else
  {
    task = Tasks.Tasks.get(taskListId, taskId);
    var now = new Date(); now.setDate(now.getDate() +2);
    var twodayslater = now; //new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    var completedDate = formatDateForTaskDue(twodayslater);
    Logger.log("Setting task id %s to completed date %s", task.id, completedDate);
    task.completed = completedDate;
    task.status = 'completed';
    var newtask = Tasks.Tasks.patch(task, taskListId, taskId);
    
    Logger.log("New task is %s", newtask);
    
    return newtask.id;
  }
}

/**
* Set a task to TODO.
*
*/
function setTaskAsTodo(taskListId, taskId){
  
  Logger.log("Set task as TODO to task list id %s and task Id %s", taskListId, taskId);
  if(taskId == "unknown" || taskId == ""){
    return "unknown";
  }
  else
  {
    task = Tasks.Tasks.get(taskListId, taskId);
    //var now = new Date(); now.setDate(now.getDate() +2);
    //var twodayslater = now; //new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    //var completedDate = formatDateForTaskDue(twodayslater);
    //Logger.log("Setting task id %s to completed date %s", task.id, completedDate);
    //task.completed = completedDate;
    task.status = 'needsAction';
    var newtask = Tasks.Tasks.patch(task, taskListId, taskId);
    
    Logger.log("New task is %s", newtask);
    
    return newtask.id;
  }
}



function setDueDate(taskListId, taskId, taskDueDate){
  
  Logger.log("Set Due date to task list id %s and task Id %s", taskListId, taskId);
  task = Tasks.Tasks.get(taskListId, taskId);
  var duedate = formatDateForTaskDue(taskDueDate);
  Logger.log("Setting task id %s due date to %s", task.id, duedate);
  task.due = duedate;
  var newtask = Tasks.Tasks.update(task, taskListId, taskId);
  
  Logger.log("New task is %s", newtask);
  
  return newtask.id;
}


/**
* Add a gmail link to the task
*
*/
function addGmailLink(taskListId, taskId, gmailLink, gmailLinkDescription){
  
  Logger.log("Add Gmail link to task list id %s and task Id %s", taskListId, taskId);
  task = Tasks.Tasks.get(taskListId, taskId);
  
  gmailLinkItem = Tasks.newTaskLinks(); //{link: gmailLink, description: gmailLinkDescription, type: 'email'};
  gmailLinkItem.type = 'email';
  gmailLinkItem.link = gmailLink;
  gmailLinkItem.description = gmailLinkDescription;
  
  Logger.log("Adding gmail link to task id %s. Link item is %s", task.id, gmailLinkItem);
  
  if (task.links === undefined) { Logger.log("This task links was undefined."); task.links = []; }
  
  task.links.push(gmailLinkItem);
  Logger.log("Old task is %s", task);
  
  
  
  var newtask = Tasks.Tasks.insert(task, taskListId);
  Logger.log("New task is %s", newtask);
  
  return newtask.id;
}

/**
 * Update a task to a tasklist.
 * @param {string} taskListId The tasklist to add to.
 */
function updateTask(taskListId, taskId, tasksTitle, taskNote) {
  
  task = Tasks.Tasks.get(taskListId, taskId);
  task.title = tasksTitle;
  task.notes = taskNote;
  Logger.log('Task with ID "%s" was updated.', task.id);
  return task.id;
}

/**
 * Lists the user's tasks.
 */
function listTaskLists() {
  var optionalArgs = {
    maxResults: 100,
    showCompleted: true,
    showDeleted: true,
    showHidden: true
  };
  var response = Tasks.Tasklists.list(optionalArgs);
  var taskLists = response.items;
  if (taskLists && taskLists.length > 0) {
    Logger.log('Task lists:');
    for (var i = 0; i < taskLists.length; i++) {
      var taskList = taskLists[i];
      Logger.log('%s (%s)', taskList.title, taskList.id);
      
      //listTasks(taskList.id);
    }
  } else {
    Logger.log('No task lists found.');
  }
}
          

/**
 * Lists task items for a provided tasklist ID.
 * @param  {string} taskListId The tasklist ID.
 */
function listTasks(taskListId) {
  var optionalArgs = {
    maxResults: 100,
    showCompleted: true,
    showDeleted: true,
    showHidden: true
  };
  
  var tasks = Tasks.Tasks.list(taskListId, optionalArgs);
  if (tasks.items) {
    for (var i = 0; i < tasks.items.length; i++) {
      var task = tasks.items[i];
      //Logger.log('Task with title "%s" and ID "%s", Due "%s", Etag: "%s", Kind: "%s", Links: "%s", Completed: "%s" was found.',
      //           task.title, task.id, task.due, task.etag, task.kind, task.links, task.completed);
      
      Logger.log("Task : %s", task);
    }
  } else {
    Logger.log('No tasks found.');
  }
}

function formatDateForTaskDue(date){
  //'2019-08-06T00:00:00.000Z'
  return ISODateString(date);
}

function formatDateForTaskCompletion(date){
  //2019-08-05T13:50:53.000Z
  return ISODateString(date);
}

/**
* Generate an RFC 3339 timestamp format for the dates
*
*/
function ISODateString(d){
 function pad(n){return n<10 ? '0'+n : n}
 return d.getUTCFullYear()+'-'
      + pad(d.getUTCMonth()+1)+'-'
      + pad(d.getUTCDate())+'T'
      + pad(d.getUTCHours())+':'
      + pad(d.getUTCMinutes())+':'
      + pad(d.getUTCSeconds())+'Z'}

function geTaskListId(taskListName){
  
  return Tasks.Tasklists.get(taskListName).id;
  
}