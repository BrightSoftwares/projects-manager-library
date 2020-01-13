var authHeader = "Bearer EJTRTR5GFGZU4JVIMSPRHODVQFBJDQT6";
var ai_message_url = 'https://api.wit.ai/message?v=20190806&q=';
var ai_samples_url = 'https://api.wit.ai/samples?v=20190806';

function trainAIwithYesterdayActivities(){
  var today = new Date();
  var yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10);
  trainWitBot(Utilities.formatDate(yesterday, "GMT+1", "dd/MM:yyyy HH:mm:ss"));
}


function trainWitBot(cutoffdate){
  
  // Get all the activities that are Done on yesterday.
  // Sorted by effective end datetime
  Logger.log("Getting candidate activities with cutoffdate " + cutoffdate);
  var candidateActivities = SpreadsheetDb.query(TABLE_NAME)
  .filter("effective_end_date", SpreadsheetDb.LesserThan, cutoffdate)
  .filter("status", SpreadsheetDb.Equal, "Done")
  .orderBy("effective_end_date", "DESC")
  .fetch();
  
  Logger.log("Got %s activities", candidateActivities.length);
  
  
  // 1/3 is P1 - 2/3 is P2 - 3/3 is P3
  var firststop = Math.ceil((candidateActivities.length / 3) * 1);
  var secondstop = Math.ceil((candidateActivities.length / 3) * 2);
  Logger.log("First stop is %s, second stop is %s", firststop, secondstop);
  
  // Train the bot
  // P1
  Logger.log("P1 activities");
  for(var i=0; i<firststop; i++){
    var activity = candidateActivities[i];
    trainWitAiBot(activity.comment, activity.project_name, 1, activity.effective_time_spent);
  }
  
  // P2
  Logger.log("P2 activities");
  for(var j=firststop; j<secondstop; j++){
    var activity = candidateActivities[j];
    trainWitAiBot(activity.comment, activity.project_name, 2, activity.effective_time_spent);
  }
  
  // P3
  Logger.log("P3 activities");
  for(var k=secondstop; k<candidateActivities.length; k++){
    var activity = candidateActivities[k];
    trainWitAiBot(activity.comment, activity.project_name, 3, activity.effective_time_spent);
  }
  
}

function trainWitAiBot(doc_text, project, priority, effective_time_spent) 
{
  Logger.log("Training AI bot with doc_text %s, project %s, priority %s, effective time spent %s", doc_text, project, priority, effective_time_spent);
  
  //var textEncoded = encodeURI(taskDescription);
  if(doc_text.length >= 255){ 
    Logger.log("The text to submit to wit.ai is too long. Reducing it to max 255 characters.");
    doc_text = doc_text.substring(0, 254); 
  }
  
  var jsondata = [{
      "text": doc_text,
      "entities" : [
        { "entity": "project", "value": project },
        { "entity": "time_spent", "value": effective_time_spent },
        { "entity": "priority", "value": priority }
      ]
    }];
  

  var postdata = JSON.stringify(jsondata);
  var options = {
    'headers': {
      "Authorization": authHeader,
      "Content-Type": "application/json"
    },
    'method' : 'post',
    'payload' : postdata
  };
  
  try{
    
    Logger.log("Posting data to wit.ai : " + postdata);
    var response = UrlFetchApp.fetch(ai_samples_url, options);
    Logger.log("Response : " + response.getContentText());
    Utilities.sleep(300);
    
    return response;
  }
  catch(ex){
    MailApp.sendEmail(DEVELOPPER_EMAIL, "Tracking activity Stats Problem", ex + ' : ' + ex.stack);
  }
  
}

function estimateTimespentFromAI(taskDescription){
  
  try{
    Logger.log("Estimating time spent from task : " + taskDescription);
    var intent = getAIIntent(taskDescription);
    var estimatedTimeSpent = getEstimatedTimeSpentFromIntent(intent);
    Logger.log("Estimated time is " + estimatedTimeSpent);
    return estimatedTimeSpent;
  }
  catch(ex){
    MailApp.sendEmail(DEVELOPPER_EMAIL, "Tracking activity Stats Problem", ex + ' : ' + ex.stack);
    return 1;
  }
}

function estimatePriorityFromAI(taskDescription){
  
  try{
    var intent = getAIIntent(taskDescription);
    var estimatedPriority = getEstimatedPriorityFromIntent(intent);
    return estimatedPriority;
  }
  catch(ex){
    MailApp.sendEmail(DEVELOPPER_EMAIL, "Tracking activity Stats Problem", ex + ' : ' + ex.stack);
    return 5;
  }
}

function getAIIntent(taskDescription) 
{

  var taskDescriptionEncoded = encodeURI(taskDescription);
  
  var formData = {
    
  }
  
  var options = {
    'headers': {
      "Authorization": authHeader
    },
    'method' : 'get',
    'payload' : formData
  };
  
  Logger.log("Querying the request to wit.ai : " + taskDescriptionEncoded);
  var response = UrlFetchApp.fetch(ai_message_url + taskDescriptionEncoded, options);
  Utilities.sleep(300);
  
  return response;
  
}

function getEstimatedTimeSpentFromIntent(response)
{
  // Look for the category entity
  var estimatedTimeSpent = null;
  if(response.entities != undefined && response.entities.time_spent != undefined)
  { estimatedTimeSpent = response.entities.time_spent[0].value; }
  else { estimatedTimeSpent = null; }
  
  // if not found, return null
  return estimatedTimeSpent;
}


function getEstimatedPriorityFromIntent(response)
{
  // Look for the category entity
  var estimatedPriority = null;
  if(response.entities != undefined && response.entities.time_spent != undefined)
  { estimatedPriority = response.entities.priority[0].value; }
  else { estimatedPriority = null; }
  
  // if not found, return null
  return estimatedPriority;
}

  

function getPriorityFromIntent(response)
{
  // Look for the category entity
  var priority = null;
  if(response.entities != undefined && response.entities.priority != undefined)
  { priority = response.entities.priority[0].value; }
  else { priority = null; }
  
  // if not found, return null
  return priority;
}
