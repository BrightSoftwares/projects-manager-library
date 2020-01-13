function startMaintenanceTasks()
{
  // Close activities that have been marked as done.
  autoCloseActivities();  
  
  // Convert projects to project actions - depreacated.
  //projectToProjectActions();
}

function autoCloseActivities()
{
  //var activities = SpreadsheetDb.query(TABLE_NAME).filter("status", SpreadsheetDb.NotEqual, CLOSE_STATUS_STRING).filter("status", SpreadsheetDb.NotEqual, "Done").filter("email_reference", SpreadsheetDb.NotEqual, "").fetch();
  var activities = SpreadsheetDb.query(TABLE_NAME).filter("email_reference", SpreadsheetDb.NotEqual, "").filter("status", SpreadsheetDb.NotEqual, CLOSE_STATUS_STRING).fetch();
  Logger.log("Processing " + activities.length + " activities for auto close or auto reopen.");
  
  //remove the label TrackingActivity once the activity is processed only if there is no actions label
  var tracklabel = GmailApp.getUserLabelByName(TRACK_LABEL_NAME);
  
  var nbClosed = 0;
  var nbReOpened = 0;
  var nbProcessed = 0;
  
  // start from where we have left off
  var startingpoint = PropertiesService.getScriptProperties().getProperty(AUTOCLOSE_STARTING_POINT_STRING) != undefined ? parseInt(PropertiesService.getScriptProperties().getProperty(AUTOCLOSE_STARTING_POINT_STRING)) : 0;
  
  Logger.log("Starting processing auto close from starting point " + startingpoint);
  
  for (var i = startingpoint; i < activities.length && nbProcessed < BATCH_SIZE ; i++) 
  {
    var activity = activities[i];
    var threadid = activity.email_reference;
    if(threadid.substring(0,1) == "'") { Logger.log("Modifying the threadid " + threadid); threadid = threadid.substring(1); Logger.log("New value : " + threadid); }
    var thread = GmailApp.getThreadById(threadid);
    Logger.log("Processing thread " + threadid + ", project name: " + activity.project_name);
    
    if(thread != undefined && thread != null)
    {
      var stillactive = false;
      var labels = thread.getLabels();
      for(var j=0; j < labels.length && !stillactive; j++)
      {        
        Logger.log("   Label : " + labels[j].getName());
        //if(labels[j].getName() == ACTIONS_LABEL_NAME || thread.isInInbox() || labels[j].getName() == WAITINGFORRESPONSE_LABEL_NAME){ stillactive = true }
        if(labels[j].getName() == ACTIONS_LABEL_NAME || thread.isInInbox()){ stillactive = true }
      }
      Logger.log("  Activity still active ? " + stillactive);
      
      if(!stillactive) 
      { 
        activity.status = CLOSE_STATUS_STRING;
        activity.effective_end_date = new Date();
        tracklabel.removeFromThread(thread);
        nbClosed++;
      }
      else
      {
        if(activity.status == CLOSE_STATUS_STRING)
        {
          Logger.log("  Reopening activity.");
          activity.status = thread.getMessages().length == 1 ? activity.status = NEW_STATUS_STRING : activity.status = PROGRESS_STATUS_STRING;
          nbReOpened++;
        }
        activity.effective_end_date = "";
        tracklabel.addToThread(thread); 
      }
      SpreadsheetDb.query(TABLE_NAME).update(activity.email_reference, activity);
      
      // wait 2 seconds, GmailApp is complaining otherwise.
      Utilities.sleep(2000);
    }
    else
    {
      // the conversation doesn't exist anymore.  
      Logger.log("  Cannot find thread " + threadid + ". Forcing activity to done.");
      activity.status = CLOSE_STATUS_STRING;
      activity.comment = activity.comment + " - Lost Email, forced to done"
      activity.effective_end_date = new Date();
      SpreadsheetDb.query(TABLE_NAME).update(activity.email_reference, activity);
      nbClosed++;
    }
    
    nbProcessed++;
  }
  
  // if we finished all the items to process, clear the autoclose starting point.
  // else, save the starting point for the next call
  if(nbProcessed < BATCH_SIZE)
  {
    PropertiesService.getScriptProperties().deleteProperty(AUTOCLOSE_STARTING_POINT_STRING);
    // remove scheduled task
    clearAutobackupRecurrentTrigger();
    //createAutobackupRecurrentTrigger();
  }
  else
  {
    Logger.log("Saving starting point to " + i);
    PropertiesService.getScriptProperties().setProperty(AUTOCLOSE_STARTING_POINT_STRING, i);
    // add scheduled task
    clearAutobackupRecurrentTrigger();
    var now = new Date();
    ScriptApp.newTrigger("autoCloseActivities")
      .timeBased()
      .at(new Date(now.getTime() + 120000))
      .create();
  }
  
  Logger.log("Nb processed : " + nbProcessed);
  Logger.log("Nb closed : " + nbClosed);
  Logger.log("Nb re opened : " + nbReOpened);
}


/** This function creates a new sheet with current month name */
function backupActivities()
{
  var monthDate = Utilities.formatDate(new Date(), "GMT+1", "MMMM yyyy");
  Logger.log(monthDate);
  
  var sSheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  //Bring the cuurrent sheet to the active state
  var oldsheet = sSheet.getSheetByName(TABLE_NAME);
  sSheet.setActiveSheet(oldsheet);
  // Wait 3 seconds
  Utilities.sleep(3000);
  //duplicate
  var newsheet = sSheet.duplicateActiveSheet();
  newsheet.setName(monthDate);
  
  // delete expired activities
  deleteExpiredClosedActivities()
}

/** This function deletes all the activities older than 1 month and with status closed */
function deleteExpiredClosedActivities()
{
  var BATCH_DELETE_SIZE = 6;
  var thisMonth = new Date();
  thisMonth.setDate(1);
  
  // fetch all the expired activities
  var expiredActivities = SpreadsheetDb.query(TABLE_NAME)
  .filter("email_reference", SpreadsheetDb.NotEqual, "")
  .filter("effective_end_date", SpreadsheetDb.LesserThan, thisMonth)
  .filter("status", SpreadsheetDb.Equal, "Done").fetch();
  
  Logger.log("deleteExpiredClosedActivities > Email reference not empty, Status=Done, Effective Date %s. Got %s activities", thisMonth, expiredActivities.length);
    
  // cycle through the activities and delete them
  for (var i = 0; i < expiredActivities.length; i++) 
  {
    var activity = expiredActivities[i];
    Logger.log("Removing activity " + activity.project_name + " - Status : " + activity.status + " (" + activity.effective_end_date + ")");
    SpreadsheetDb.query(TABLE_NAME).remove(activity.email_reference);
  }
}