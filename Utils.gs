function printGmailLabels(labels){
  var plabels = "";
  for(var i=0; i<labels.length; i++){
    plabels += labels[i].getName() + ", ";    
  }
  return plabels;
}


function getTrackingActivityRange()
{
  var range = PropertiesService.getScriptProperties().getProperty(TRACKINGACTIVITY_RANGE_STRING);
  if(range == undefined) { range = 0; } else { range = parseInt(range); }
  return range;
}

function saveTrackingActivityRange(range)
{
 PropertiesService.getScriptProperties().setProperty(TRACKINGACTIVITY_RANGE_STRING, range);  
}

function createActivityTrackerTrigger()
{
  // if exists, get the old activity tracker trigger
  var oldTriggerId = PropertiesService.getScriptProperties().getProperty(TRACKINGACTIVITY_TRIGGER_STRING);
  
  // create a new one and save it if range is different from zero.
  if(oldTriggerId == undefined)
  {
    Logger.log("Tracking activity range is not zero. Creating a new trigger to pull data again.");
    var newTriggerId = ScriptApp.newTrigger('trackMyActivity').timeBased().everyMinutes(15).create().getUniqueId();
    PropertiesService.getScriptProperties().setProperty(TRACKINGACTIVITY_TRIGGER_STRING, newTriggerId);
  }
}

function deleteActivityTrackerTrigger()
{
  var range = PropertiesService.getScriptProperties().getProperty(TRACKINGACTIVITY_RANGE_STRING);
  var oldTriggerId = PropertiesService.getScriptProperties().getProperty(TRACKINGACTIVITY_TRIGGER_STRING);
  // remove it
  if(range == 0 && oldTriggerId != undefined) 
  {
    Logger.log("oldTriggerId exists. Removing it.");
    var projectTriggers = ScriptApp.getProjectTriggers();
    for(var i=0; i<projectTriggers.length; i++)
    {
      if(projectTriggers[i].getUniqueId() == oldTriggerId)
      {
        ScriptApp.deleteTrigger(projectTriggers[i]);
        Logger.log("oldTriggerId found and deleted.");
        break;
      }      
    }    
  }
}

function generateId()
{
 return Math.floor((1 + Math.random()) * 0x100000000000)
 .toString(16);
      //.substring(10);  
}


function getClearEmail_(formattedEmail) {
  if (formattedEmail.match(/</) != null) formattedEmail = formattedEmail.match(/<([^>]*)/)[1];
  return formattedEmail.trim();
}

function getWaitingTimeRange_(startDate, replyDate){
    var waitingTime = Math.round((replyDate.getTime() - startDate) / 60000);
    if (waitingTime < 5) {
      return 0;
    }
    else if (waitingTime < 15) {
      return 1;
    }
    else if (waitingTime < 60) {
      return 2;
    }
    else if (waitingTime < 240) {
      return 3;
    }
    else if (waitingTime < 1440) {
      return 4;
    }
    else {
      return 5;
    }
}


function getTimeSpentRange_(startDate, endDate){
    var waitingTime = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    if (waitingTime < 5) {
      return 0;
    }
    else if (waitingTime < 60) {
      return 1;
    }
    else if (waitingTime < 180) {
      return 3;
    }
    else if (waitingTime < 300) {
      return 5;
    }
    else if (waitingTime < 480) {
      return 8;
    }
    else if (waitingTime < 480) {
      return 8;
    }
    else if (waitingTime < 780) {
      return 13;
    }
    else if (waitingTime < 1260) {
      return 21;
    }
    else if (waitingTime < 2040) {
      return 34;
    }
    else if (waitingTime < 3300) {
      return 55;
    }
    else if (waitingTime < 5340) {
      return 89;
    }
    else {
      return 5;
    }
}


function getWordCountRange_(wordCount){
    if (wordCount < 10) {
      return 0;
    }
    else if (wordCount < 30) {
      return 1;
    }
    else if (wordCount < 50) {
      return 2;
    }
    else if (wordCount < 100) {
      return 3;
    }
    else if (wordCount < 200) {
      return 4;
    }
    else {
      return 5;
    }
}

function keys(obj)
{
    var keys = [];

    for(var key in obj)
    {
        if(obj.hasOwnProperty(key))
        {
            keys.push(key);
        }
    }

    return keys;
}

function clearTriggers()
{
  var allTriggers = ScriptApp.getScriptTriggers();
  // Loop over all triggers
  for(var i=0; i < allTriggers.length; i++) {
    if(allTriggers[i].getHandlerFunction() == "fetchActivity"){
      ScriptApp.deleteTrigger(allTriggers[i]); 
    }
  }
}

function clearTrigger(triggerName)
{
  var allTriggers = ScriptApp.getScriptTriggers();
  // Loop over all triggers
  for(var i=0; i < allTriggers.length; i++) {
    Logger.log("Found trigger " + allTriggers[i].getHandlerFunction() + ", Uniq Id is " + allTriggers[i].getUniqueId());
    if(allTriggers[i].getHandlerFunction() == triggerName){
      ScriptApp.deleteTrigger(allTriggers[i]);
      Logger.log("Trigger " + triggerName + " cleared.");
    }
  }
}

function createAutobackupRecurrentTrigger()
{
  ScriptApp.newTrigger("startAutoCloseActivities").timeBased().everyHours(6).create();
}

function clearAutobackupRecurrentTrigger()
{
  clearTrigger("autoCloseActivities"); 
}

function daysToMilliseconds(days) 
{
      return days * 24 * 60 * 60 * 1000;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}