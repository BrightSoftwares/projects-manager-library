/*
* Create a monthly report for the current month
*/
function yearlyReport(){
  var endDate = new Date();
  var beginDate = new Date();
  beginDate.setMonth(endDate.getMonth()-12);
  initStats_(beginDate, endDate, "Yearly");
}

/*
* Create a monthly report for the current month
*/
function monthlyReport(){
  var endDate = new Date();
  var beginDate = new Date();
  beginDate.setMonth(endDate.getMonth()-1);
  initStats_(beginDate, endDate, "Monthly");
}

/** Create a weekly report **/
function weeklyReport(){
  var endDate = new Date();
  var beginDate = new Date();  
  beginDate.setDate(endDate.getDate()-7);
  initStats_(beginDate, endDate, "Weekly");
  
  //write the backlog information to a spreasdheet for followup
  saveBacklogInformation();
}

/** Create a daily report **/
function dailyReport(){
  var endDate = new Date();
  var beginDate = new Date();  
  beginDate.setDate(endDate.getDate()-1);
  initStats_(beginDate, endDate, "Daily");
}

/** Create a custom report **/
function customReport(beginDate, endDate){
  beginDate.setDate(endDate.getDate()-1);
  initStats_(beginDate, endDate, "Custom");
}

/*
 * Init stats object
 */
function initStats_(beginDate, endDate, typeReport){
  try{
    
    var stats = {};
    stats.typeReport = typeReport;
    stats.nbrOfConversations = 0;
    stats.nbrOfConversationsStarred = 0;
    stats.nbrOfConversationsMarkedAsImportant = 0;
    stats.nbrOfConversationsInInbox = 0;
    stats.nbrOfConversationsInTrash = 0;
    stats.nbrOfConversationsArchived = 0;
    stats.nbrOfConversationsInLabels = 0;
    stats.nbrOfConversationsStarted = 0;
    stats.nbrOfConversationsReplied = 0;
    
    stats.nbrOfMessages = 0;
    stats.nbrOfMessagesReceived = 0;
    stats.nbrOfMessagesSent = 0;
    stats.nbrOfMessagesSentToMe = 0;
    
    stats.nbrOfAttachmentsSent = 0;
    stats.nbrOfAttachmentsReceived = 0;
    stats.attachments = {};
    
    stats.wordCount = [];
    for(var i = 0; i < 6; i++) stats.wordCount[i] = {"r":0,"s":0};
    
    stats.range = 0;
    stats.user = Session.getActiveUser().getEmail();
    stats.strBeginDate = Utilities.formatDate(beginDate, "GMT+1", "yyyy/MM/dd");
    stats.strEndDate = Utilities.formatDate(endDate, "GMT+1", "yyyy/MM/dd");
    stats.labels = {"inbox":0, "trashed":0, "archived":0};
    
    stats.senders = {};
    stats.recipients = {};
    stats.pendings = {};
    
    stats.timeYouRespond = [];
    stats.timePeopleRespondToYou = [];
    for(var i = 0; i < 6; i++) {
      stats.timeYouRespond[i] = 0;
      stats.timePeopleRespondToYou[i] = 0;
    }
    
    stats.dailytraffic = [];
    for(var i = 0; i < 24; i++) stats.dailytraffic[i] = {"r":0,"s":0};
    
    stats.monthlytraffic = [];
    for(var i = 0; i < 31; i++) stats.monthlytraffic[i] = {"r":0,"s":0};
    
    stats.burnupchart = [];
    for(var i = 0; i < 31; i++) stats.burnupchart[i] = {"capacity":0,"workinprogress":0};
        
    stats.weeklytraffic = [];
    for(var i = 0; i < 7; i++) stats.weeklytraffic[i] = {"r":0,"s":0};
    
    stats.projects = [];
    for(var i = 0; i < 31; i++) stats.projects[i] = {"total":0,"run":0 ,"build":0};
    
    stats.activityperstatus = {};
    stats.activityperstatusstacked = {};
    stats.activitypertype = {};    
    stats.backlogevolution = {};
    
    setSavedContent_(JSON.stringify(stats));
    
    //Go fetch activity
    fetchActivity();
  }
  catch(ex){
    MailApp.sendEmail(DEVELOPPER_EMAIL, "Tracking activity Stats Problem", ex + ' : ' + ex.stack);
  }
}

/*
*/
function fetchActivity() {
  try {
    
    //jSon object containing all the statistics
    var stats = JSON.parse(getSavedContent_());
    
    Logger.log("Fetching activities from " + stats.strBeginDate + " to " + stats.strEndDate);
    var beginDate = new Date(stats.strBeginDate);
    var endDate = new Date(stats.strEndDate);
    Logger.log("Fetching activities from " + beginDate + " to " + endDate + " (converted dates)");
    
    // Pull backlog data
    stats.backlogevolution = SpreadsheetDb.query(BACKLOGTABLE_NAME).fetch();
    
    /*
    * Construct the query to retrieve emails
    * First, define date range
    */    
    var conversations = SpreadsheetDb.query(TABLE_NAME)
    .filter("email_reference", SpreadsheetDb.NotEqual, "")
    .filter("creation_date", SpreadsheetDb.GreaterThan, beginDate).filter("creation_date", SpreadsheetDb.LesserThan, endDate)
    .fetch();
    
    Logger.log(conversations.length + " conversations fetched.");
    
    /*
    * If there's no more conversations, schedule a trigger to make the report
    */
    if(conversations.length == 0){
      MailApp.sendEmail(stats.user, "Activity Tracker Stats", '', {
        htmlBody: "<h2>No activity to process.</h2>"
      });
    }
    /*
    * else, we process the statistics
    */
    else {
      stats.nbrOfConversations += conversations.length;
      
      //iterate over all conversations
      for (var i = 0; i < conversations.length; i++) 
      {
        var youStartedConversation = false;
        var youReplied = false;
        var someoneAnswered = false;
        
        //Labels -> Project status
        var labels = [conversations[i].status];
        
        if (labels.length == 0) {
          // Will never be true.
        }
        //Labels stats -> Project status
        else 
        {
          stats.nbrOfConversationsInLabels++;
          for (var j = 0; j < labels.length; j++) {
            if(stats.labels[labels[j]] == undefined)
              stats.labels[labels[j]] = 1;
            else
              stats.labels[labels[j]]++;
          }
          
          //In inbox -> Is New
          if (conversations[i].status == "New") {
            stats.nbrOfConversationsInInbox++;
          }
          //In trash -> Done
          else if (conversations[i].status == "Done") {
            stats.nbrOfConversationsInTrash++;
            stats.labels.trashed++;
          }
          //Starred -> In progress
          else if (conversations[i].status == "In progress") {
            stats.nbrOfConversationsStarred++;
          }
          //Archived -> Abandonned
          else {
            stats.nbrOfConversationsArchived++;
            stats.labels.archived++;
          }
        }
        
        // Activity per status
        if(stats.activityperstatus[conversations[i].status] == undefined)
        {
          stats.activityperstatus[conversations[i].status] = 0;
        }
        stats.activityperstatus[conversations[i].status]++;
        //Logger.log("Activity status is " + JSON.stringify(stats.activityperstatus));
        
        if(stats.activityperstatusstacked[conversations[i].project_name] == undefined) { stats.activityperstatusstacked[conversations[i].project_name] = {}; }
        if(stats.activityperstatusstacked[conversations[i].project_name][conversations[i].status] == undefined) { stats.activityperstatusstacked[conversations[i].project_name][conversations[i].status] = 0; }
        stats.activityperstatusstacked[conversations[i].project_name][conversations[i].status]++;
        
        
        
        // Activity per project type
        if(stats.activitypertype[conversations[i].project_type] == undefined)
        {
          stats.activitypertype[conversations[i].project_type] = 0;
        }
        stats.activitypertype[conversations[i].project_type]++;
        //Logger.log("Activity type is " + JSON.stringify(stats.activitypertype));
        
        //Messages -> Activities
        //  If creation date is undefined then set the create date to today, else fecth the creation date
        var firstMessageDate = conversations[i].creation_date == "" ? new Date() : firstMessageDate = conversations[i].creation_date;
        
        // userIs -> activity opened or closed. s -> open, r -> closed
        var userIs = (conversations[i].effective_end_date == ""?"s":"r");
        
        //  If undefined, effective end date is today // TODO - Change this rule. It is not accurate.
        var date = conversations[i].effective_end_date == "" ? new Date() : conversations[i].effective_end_date;
        
        var from = conversations[i].project_name;
        var to = conversations[i].project_name;
        /*
        * Increment daily, weekly and monthly traffic depending the message date and time
        */
        
            
        stats.dailytraffic[firstMessageDate.getHours()][userIs]++;
        stats.monthlytraffic[firstMessageDate.getDate()-1][userIs]++;
        stats.weeklytraffic[firstMessageDate.getDay()][userIs]++;
        
        if(stats.projects[firstMessageDate.getDate()-1][conversations[i].project_name] == undefined)
        {
          stats.projects[firstMessageDate.getDate()-1][conversations[i].project_name] = 0;
        }
        stats.projects[firstMessageDate.getDate()-1][conversations[i].project_name]++;
        if(conversations[i].project_type == "Run")
        {
          stats.projects[firstMessageDate.getDate()-1]['run']++;
          stats.projects[firstMessageDate.getDate()-1]['total']++;
        }
        
        if(conversations[i].project_type == "Build")
        {
          stats.projects[firstMessageDate.getDate()-1]['build']++;
          stats.projects[firstMessageDate.getDate()-1]['total']++;
        }
        //Logger.log(JSON.stringify(stats.projects));
        
        stats.wordCount[getWordCountRange_(conversations[i].comment.toString().split(' ').length)][userIs]++;
        
        
        //nbrOfMessagesReceived -> nb of activity closed
        if(conversations[i].effective_end_date != "") { stats.nbrOfMessagesReceived++; }
        if(conversations[i].creation_date != "") { stats.nbrOfMessagesSent++; }
        
        // timeYouRespond -> time you close an activity
        // timePeopleRespondToYou -> time activities spend opened.
        if(conversations[i].status != "Done") stats.timePeopleRespondToYou[getWaitingTimeRange_(firstMessageDate, date)]++;
        if(conversations[i].status == "Done") stats.timeYouRespond[getWaitingTimeRange_(firstMessageDate, date)]++; // Response time : count only if the activity is closed
        
        // senders -> Activities opened
        if(stats.senders[from] == undefined) stats.senders[from] = 0;
        if(conversations[i].status == "New")
        {
          stats.senders[from]++;
        }
        
        // recipients -> Activities closed
        if(conversations[i].status == "Done")
        {
          if(stats.recipients[to] == undefined) stats.recipients[to] = 0;
          stats.recipients[to]++;
          
          stats.burnupchart[firstMessageDate.getDate()-1]["capacity"]++;
        }        
        
        // pendings -> axtivities still opened
        if(stats.pendings[from] == undefined) stats.pendings[from] = 0;
        if(conversations[i].status == "In progress")
        {
          stats.pendings[from]++;
          
          stats.burnupchart[firstMessageDate.getDate()-1]["workinprogress"]++;
        }
      }
      stats.range += conversations.length; //stats.range += BATCH_SIZE;
      setSavedContent_(JSON.stringify(stats));
      
      // Build and send report
      makeReport();
    }
  }
  catch(ex){
    MailApp.sendEmail(DEVELOPPER_EMAIL, "Activity Tracker Stats Problem", 
                      "There is a problem processing the activity track." 
                      + " I can't tell if the problem occured while looping over the activities or somewhere else. " 
                      + "Here is the exception : " + ex + ' : ' + ex.stack);
  }
}


/*
*
*/
function makeReport(){
  try {
    var stats = JSON.parse(getSavedContent_());
    
    var template = HtmlService.createTemplateFromFile('MailTemplate');
    var inlineImages = buildCharts();
    
    template.stats = stats;
    
    //Top senders
    var sortedSenders = [];
    for(var i = 0; i < keys(stats.senders).length; i++){
      sortedSenders[i] = [keys(stats.senders)[i], stats.senders[keys(stats.senders)[i]]];
    }
    qsort(sortedSenders, 1, "DESC");
    template.sortedSenders = sortedSenders;
    
    //Top pendings
    var sortedPendings = [];
    for(var i = 0; i < keys(stats.pendings).length; i++){
      sortedPendings[i] = [keys(stats.pendings)[i], stats.pendings[keys(stats.pendings)[i]]];
    }
    qsort(sortedPendings, 1, "DESC");
    template.sortedPendings = sortedPendings;
    
    //Top recipients
    var sortedRecipients = [];
    for(var i = 0; i < keys(stats.recipients).length; i++){
      sortedRecipients[i] = [keys(stats.recipients)[i], stats.recipients[keys(stats.recipients)[i]]];
    }
    qsort(sortedRecipients, 1, "DESC");
    template.sortedRecipients = sortedRecipients;
    
    var myHTMLBody = template.evaluate().getContent();
    MailApp.sendEmail(stats.user, "Activity Tracker Stats", '', {
      htmlBody: myHTMLBody,
      inlineImages: inlineImages
    });
    
  }
  catch(ex){
    MailApp.sendEmail(DEVELOPPER_EMAIL, "Activity Tracker Stats Problem", ex + ' : ' + ex.stack);
  }
}


/*
*
*/
function makeReportInGoogleDocument(){
  try {
    var stats = JSON.parse(getSavedContent_());
    
    var template = HtmlService.createTemplateFromFile('MailTemplate');
    var inlineImages = buildCharts();
    
    template.stats = stats;
    
    //Top senders
    var sortedSenders = [];
    for(var i = 0; i < keys(stats.senders).length; i++){
      sortedSenders[i] = [keys(stats.senders)[i], stats.senders[keys(stats.senders)[i]]];
    }
    qsort(sortedSenders, 1, "DESC");
    template.sortedSenders = sortedSenders;
    
    //Top pendings
    var sortedPendings = [];
    for(var i = 0; i < keys(stats.pendings).length; i++){
      sortedPendings[i] = [keys(stats.pendings)[i], stats.pendings[keys(stats.pendings)[i]]];
    }
    qsort(sortedPendings, 1, "DESC");
    template.sortedPendings = sortedPendings;
    
    //Top recipients
    var sortedRecipients = [];
    for(var i = 0; i < keys(stats.recipients).length; i++){
      sortedRecipients[i] = [keys(stats.recipients)[i], stats.recipients[keys(stats.recipients)[i]]];
    }
    qsort(sortedRecipients, 1, "DESC");
    template.sortedRecipients = sortedRecipients;
    
    var myHTMLBody = template.evaluate().getContent();
    
    // Append the content in the document
    var newDocTitle = "Détail du suivi des projets - " + Utilities.formatDate(new Date(), "GMT+2", "dd/MM/yyyy")
    var theDoc = DocumentApp.openById("1ypyQ9Jx2nExBc_9hDhyGdobiNbIbOme_-o5aPlK_KfU").setName(newDocTitle);
    var theDocBody = theDoc.getBody();
    theDocBody.appendHorizontalRule();
    theDocBody.appendPageBreak();
    theDocBody.appendParagraph(myHTMLBody);
    
  }
  catch(ex){
    MailApp.sendEmail(DEVELOPPER_EMAIL, "Activity Tracker Stats Problem in make report in Docs", ex + ' : ' + ex.stack);
  }
}

function buildCharts(){
  try {
    var stats = JSON.parse(getSavedContent_()); //TODO
    var inlineImages = {};
    //Daily traffic
    var dataTable = Charts.newDataTable();
    dataTable.addColumn(Charts.ColumnType['STRING'], 'Time');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'New activity');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'Closed activity');
    var time = '';
    for (var i = 0; i < stats.dailytraffic.length; i++) { //create the rows
      switch (i) {
        case 0:
          time = 'Midnight';
          break;
        case 6:
          time = '6 AM';
          break;
        case 12:
          time = 'NOON';
          break;
        case 18:
          time = '6 PM';
          break;
        default:
          time = '';
          break;
      }
      dataTable.addRow([time, stats.dailytraffic[i].r, stats.dailytraffic[i].s]);
    }
    dataTable.build();
    inlineImages["dailytraffic"] = Charts.newAreaChart().setDataTable(dataTable).setDimensions(650, 400).build();
    
    //Monthly traffic
    var dataTable = Charts.newDataTable();
    dataTable.addColumn(Charts.ColumnType['STRING'], 'Date');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'New activity');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'Closed activity');
    
    for (var i = 0; i < stats.monthlytraffic.length; i++) { //create the rows
      dataTable.addRow([(i + 1).toString(), stats.monthlytraffic[i].r, stats.monthlytraffic[i].s]);
    }
    dataTable.build();
    inlineImages["monthlytraffic"] = Charts.newAreaChart().setDataTable(dataTable).setDimensions(650, 400).build();
    
    
    //Burn Up Chart
    var dataTable = Charts.newDataTable();
    dataTable.addColumn(Charts.ColumnType['STRING'], 'Date');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], '#capacity');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], '#work in progress');
    
    for (var i = 0; i < stats.burnupchart.length; i++) { //create the rows
      dataTable.addRow([(i + 1).toString(), stats.burnupchart[i].capacity, stats.burnupchart[i].workinprogress]);
    }
    dataTable.build();
    inlineImages["burnupchart"] = Charts.newLineChart().setDataTable(dataTable)
                                                       .setDimensions(650, 400)
                                                       .setOption("pointShape", 'circle')
                                                       .setOption("pointSize", 3)
                                                       .setOption("interpolateNulls", true)
                                                       .setOption("isStacked", true)
                                                       .build();
    //Workload Chart
    var dataTable = Charts.newDataTable();
    dataTable.addColumn(Charts.ColumnType['STRING'], 'Date');
    
    var projectskeys = [];
    for(var j = 0; j<stats.projects.length; j++){
      var projectlinekeys = keys(stats.projects[j]);
      
      for (var k = 0; k < projectlinekeys.length; k++)
      {
        
        if(projectskeys.indexOf(projectlinekeys[k]) == -1 && projectlinekeys[k] != "total" && projectlinekeys[k] != "run" && projectlinekeys[k] != "build" )
        {
          projectskeys.push(projectlinekeys[k]);
          dataTable.addColumn(Charts.ColumnType['NUMBER'], projectlinekeys[k]);
        } 
      }
    }
    
    for (var i = 0; i < stats.projects.length; i++) { //create the rows
      var rowToAdd = [];
      rowToAdd.push((i + 1).toString());
      
      for(var j = 0; j < projectskeys.length; j++){
        var projectkeyitem = projectskeys[j];        
        if(stats.projects[i][projectkeyitem] == undefined || stats.projects[i][projectkeyitem] == ""){ rowToAdd.push(0); }
        else{ rowToAdd.push(stats.projects[i][projectkeyitem]); }
      }
      dataTable.addRow(rowToAdd);
    }
    
    dataTable.build();
    inlineImages["workloadchart"] = Charts.newBarChart().setDataTable(dataTable)
                                                       .setDimensions(650, 600)
                                                       .setOption("isStacked", true)
                                                       .setOption("pointShape", 'circle')
                                                       .setOption("pointSize", 3)
                                                       .setOption("orientation", 'vertical')
                                                       .build();
    
    //Backlog evolution
    
    var dataTable = Charts.newDataTable();
    dataTable.addColumn(Charts.ColumnType['DATE'], 'Date');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'Nb in progress tasks');
    for (var i = 0; i < stats.backlogevolution.length; i++) {
      var curdate = new Date(Date.parse(stats.backlogevolution[i].timestamp));
      dataTable.addRow([curdate, stats.backlogevolution[i].nb_in_progress_tasks]);
    }
    dataTable.build();
    inlineImages["backlogevolution"] = Charts.newLineChart().setDataTable(dataTable)
                                                       .setDimensions(650, 400)
                                                       .setOption("pointShape", 'circle')
                                                       .setOption("pointSize", 3)
                                                       .setOption("interpolateNulls", true)
                                                       .setOption("isStacked", true)
                                                       .setYAxisTitle("nb in progress tasks")
                                                       .build();
    //Charts.newColumnChart().setDataTable(dataTable).setYAxisTitle("nb in progress tasks").setDimensions(650, 400).build();
    
    //Weekly traffic
    var dataTable = Charts.newDataTable();
    dataTable.addColumn(Charts.ColumnType['STRING'], 'dayOfWeek');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'New activity');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'Closed activity');
    var dayTags = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (var i = 0; i < dayTags.length; i++) {
      dataTable.addRow([dayTags[i], stats.weeklytraffic[i].r * 100 / (stats.nbrOfMessagesReceived + 1), stats.weeklytraffic[i].s * 100 / (stats.nbrOfMessagesSent + 1)]);
    }
    dataTable.build();
    inlineImages["weeklytraffic"] = Charts.newColumnChart().setDataTable(dataTable).setYAxisTitle("in % of messages").setDimensions(650, 400).build();
    
    //Activity per type
    var dataTable = Charts.newDataTable();
    var projecttypekeys = keys(stats.activitypertype);
    dataTable.addColumn(Charts.ColumnType['STRING'], 'Project type');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'Number of activities');
    
    for(var i = 0; i < projecttypekeys.length; i++)
    {
      var projecttypekey = projecttypekeys[i];
      //Logger.log("Processing project key " + projecttypekey + ", project value is " + stats.activitypertype[projecttypekey]);
      dataTable.addRow([projecttypekey, stats.activitypertype[projecttypekey]]);
    }
    dataTable.build();
    inlineImages["activitypertype"] = Charts.newPieChart()
                                                      .setDataTable(dataTable)
                                                      .setOption('pieHole', '0.4')
                                                      .setDimensions(650, 400).build();
   
    
    // activitypertypestacked
    // columns = projectname, new, in progress, done
    // rows = gsm, 2, 4, 8
    // TODO = implements the above
    
    Logger.log(JSON.stringify(stats.activityperstatus))
    
    var dataTable = Charts.newDataTable();
    dataTable.addColumn(Charts.ColumnType['STRING'], 'Project name');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'New');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'In progress');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'Done');
    
    var projectlines = keys(stats.activityperstatusstacked);
    
    for(var m = 0; m < projectlines.length; m++)
    {
      var projectline_name = projectlines[m];
      Logger.log("Processing project line " + projectline_name);
      
      var projectline_status_new = stats.activityperstatusstacked[projectline_name]["New"] == undefined ? 0 : stats.activityperstatusstacked[projectline_name]["New"] ;
      var projectline_status_inprogress = stats.activityperstatusstacked[projectline_name]["In progress"] == undefined ? 0 : stats.activityperstatusstacked[projectline_name]["In progress"] ;
      var projectline_status_done = stats.activityperstatusstacked[projectline_name]["Done"] == undefined ? 0 : stats.activityperstatusstacked[projectline_name]["Done"] ;
      
      dataTable.addRow([projectline_name, projectline_status_new, projectline_status_inprogress, projectline_status_done]);
    }
    
    dataTable.build();
    inlineImages["activitypertypestacked"] = Charts.newBarChart().setDataTable(dataTable)
    .setDimensions(650, 600)
    .setOption("isStacked", true)
    .setOption("pointShape", 'circle')
    .setOption("pointSize", 3)
    .setOption("orientation", 'vertical')
    .build();
    
    
    
    // Gantt chart
    var data = Charts.newDataTable();
    data.addColumn(Charts.ColumnType['STRING'], 'Task ID');
    data.addColumn(Charts.ColumnType['STRING'], 'Task Name');
    data.addColumn(Charts.ColumnType['DATE'], 'Start Date');
    data.addColumn(Charts.ColumnType['DATE'], 'End Date');
    data.addColumn(Charts.ColumnType['NUMBER'], 'Duration');
    data.addColumn(Charts.ColumnType['NUMBER'], 'Percent Complete');
    data.addColumn(Charts.ColumnType['STRING'], 'Dependencies');

    //
    data.addRow(['Research', 'Find sources', new Date(2015, 0, 1), new Date(2015, 0, 5), null,  100,  null]);
    data.addRow(['Write', 'Write paper', null, new Date(2015, 0, 9), daysToMilliseconds(3), 25, 'Research,Outline']);
    data.addRow(['Cite', 'Create bibliography', null, new Date(2015, 0, 7), daysToMilliseconds(1), 20, 'Research']);
    data.addRow(['Complete', 'Hand in paper', null, new Date(2015, 0, 10), daysToMilliseconds(1), 0, 'Cite,Write']);
    data.addRow(['Outline', 'Outline paper', null, new Date(2015, 0, 6), daysToMilliseconds(1), 100, 'Research']);

    inlineImages["projectgantt"] = Charts.newLineChart().setDataTable(dataTable).setDimensions(650, 400).build();
    
    //Labels
    if(keys(stats.labels).length != 0){
      var dataTable = Charts.newDataTable();
      dataTable.addColumn(Charts.ColumnType['STRING'], 'Words');
      dataTable.addColumn(Charts.ColumnType['NUMBER'], 'Number of conversations');    
      for (var i = 0; i < keys(stats.labels).length; i++) {
        var key = keys(stats.labels)[i];
        if(key != "inbox" && key != "archived" && key != "trashed")
          dataTable.addRow([key, stats.labels[key]]);
      }
      dataTable.build();
      inlineImages["labelized"] = Charts.newPieChart().setDataTable(dataTable)
                                                      .setDimensions(650, 400)
                                                      .setOption('pieHole', '0.4')
                                                      .build();
    }
    
    //Attachments
    if(keys(stats.attachments).length != 0){
      var dataTable = Charts.newDataTable();
      dataTable.addColumn(Charts.ColumnType['STRING'], 'Words');
      dataTable.addColumn(Charts.ColumnType['NUMBER'], 'Attachments received');
      dataTable.addColumn(Charts.ColumnType['NUMBER'], 'Attachments sent');
      
      for (var i = 0; i < keys(stats.attachments).length; i++) {
        var key = keys(stats.attachments)[i];
        dataTable.addRow([key, stats.attachments[key].r, stats.attachments[key].s]);
      }
      dataTable.build();
      inlineImages["attachments"] = Charts.newColumnChart().setDataTable(dataTable).setYAxisTitle("types of Attachments").setLegendPosition(Charts.Position.BOTTOM).setDimensions(650, 400).build();
    }
    
    //Subect word count -> Word count
    var dataTable = Charts.newDataTable();
    dataTable.addColumn(Charts.ColumnType['STRING'], 'Words');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'In activity opened subject');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'In activity closed subject');
    for(var i = 0; i < 6; i++) {
      var label;
      switch (i) {
        case 0:
          label = '< 10 words';
          break;
        case 1:
          label = '< 30';
          break;
        case 2:
          label = '< 50';
          break;
        case 3:
          label = '< 100';
          break;
        case 4:
          label = '< 200';
          break;
        case 5:
          label = 'More';
          break;
      }
      dataTable.addRow([label, stats.wordCount[i].r, stats.wordCount[i].s]);
    }
    dataTable.build();
    inlineImages["messageslength"] = Charts.newColumnChart().setDataTable(dataTable).setYAxisTitle("in % of messages").setLegendPosition(Charts.Position.BOTTOM).setDimensions(650, 400).build();
    
    //Time to close activity -> Time before first response
    var dataTable = Charts.newDataTable();
    dataTable.addColumn(Charts.ColumnType['STRING'], 'Time');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'When the activity is still open');
    dataTable.addColumn(Charts.ColumnType['NUMBER'], 'When you close the activity');
    for(var i = 0; i < 6; i++) {
      var label;
      switch (i) {
        case 0:
          label = '< 5min';
          break;
        case 1:
          label = '< 15min';
          break;
        case 2:
          label = '< 1hr';
          break;
        case 3:
          label = '< 4hrs';
          break;
        case 4:
          label = '< 1day';
          break;
        case 5:
          label = 'More';
          break;
      }
      dataTable.addRow([label, stats.timePeopleRespondToYou[i], stats.timeYouRespond[i]]);
    }
    dataTable.build();
    inlineImages["responsetime"] = Charts.newColumnChart().setDataTable(dataTable).setYAxisTitle("number of activities").setLegendPosition(Charts.Position.BOTTOM).setDimensions(650, 400).build();
    return inlineImages;
  }
  catch(ex){
    MailApp.sendEmail(DEVELOPPER_EMAIL, "Activity Tracker Build charts Problem", ex + ' : ' + ex.stack);
  }
}

function saveBacklogInformation()
{  
  try
  {
    SpreadsheetDb.setPrimaryKey(BACKLOGTABLE_NAME, 'timestamp');    
    var stats = JSON.parse(getSavedContent_());
    
    var backlog = {};
    backlog.timestamp = new Date();
    backlog.nb_in_progress_tasks = stats.nbrOfConversationsStarred == undefined ? 0 : stats.nbrOfConversationsStarred;
    backlog.nb_total_tasks = stats.nbrOfConversations == undefined ? 0 : stats.nbrOfConversations;	
    backlog.nb_new_tasks = stats.nbrOfConversationsInInbox == undefined ? 0 : stats.nbrOfConversationsInInbox;
    
    SpreadsheetDb.query(BACKLOGTABLE_NAME).create(backlog);
  }
  catch(ex){
    MailApp.sendEmail(DEVELOPPER_EMAIL, "Activity Tracker Save to backlog problem", ex + ' : ' + ex.stack);
  }
  
  // Set the primary key back to the original state
  SpreadsheetDb.setPrimaryKey(TABLE_NAME, 'email_reference');
}

/*
* Get the id of the Google Document in whoch are saved the stats
* Create one if not exists
*/
function getSavedDocument_(){
  var fileId = PropertiesService.getScriptProperties().getProperty('save'); //UserProperties.getProperty('save');
  if(fileId != undefined){
    try{
      return DriveApp.getFileById(fileId).getId(); //DocsList.getFileById(fileId).getId();
    }catch(ex){}
  }
  var file = DriveApp.createFile("Activity Tracker Stats - DO NOT DELETE", ""); //DocsList.createFile("Activity Tracker Stats - DO NOT DELETE", "");
  PropertiesService.getScriptProperties().setProperty('save', file.getId()); //UserProperties.setProperty('save', file.getId());
  return file.getId();  
}

/*
* Get the content of the saved document
*/
function getSavedContent_() {
  return DriveApp.getFileById(getSavedDocument_()).getBlob().getDataAsString(); //DocsList.getFileById(getSavedDocument_()).getContentAsString();
}

/*
* Set the content of the saved document
*/
function setSavedContent_(content){
  //DriveApp.getFileById(getSavedDocument_()).clear(); //DocsList.getFileById(getSavedDocument_()).clear();
  DriveApp.getFileById(getSavedDocument_()).setContent(content); //DocsList.getFileById(getSavedDocument_()).append(content);
}