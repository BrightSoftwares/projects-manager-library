/**
 * Creates an event in the user's default calendar.
 */
function createEvent() {
  var calendarId = CALENDAR_ID;
  var start = getRelativeDate(1, 12);
  var end = getRelativeDate(1, 13);
  var description = 'To discuss our plans for the presentation next week.';
  var summary = 'Lunch Meeting';
  var location = 'The Deli';
  var attendees = [
      {email: 'alice@example.com'},
      {email: 'bob@example.com'}
    ];
  
  var event = createEventInCalendar(calendarId, start, end, summary, location, description, attendees);
  
  Logger.log('Event ID: ' + event.id);
  return event.id;
}


/**
* Finds the best next slot of the event
* Either 09:30-10:30, 10:30-11:30, 15:30-16:30
*/
function scheduleActivitiesCalendar(){
  // Find the best time slot
  // Event duration. We default to 1 hour.
  var now = new Date();
  var oneweekago = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  var onemonthago = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  var nextmonth = new Date(now.getFullYear(), now.getMonth()+1, now.getDate());
  var batchid = getCurrentBatchId();
  
  var caleventsoptions = {
    timeMin: now.toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  }
  var calevents = getCalendarEvents(caleventsoptions);
  Logger.log("Got " + calevents.items.length + " events");
  
  Logger.log("Batch ID is " + batchid);
  var activities = SpreadsheetDb.query(TABLE_NAME).filter("last_updated", SpreadsheetDb.GreaterThan, onemonthago).fetch();
  Logger.log("Got " + activities.length + " activities");
  
  var processedCalEvents = [];
  var activity_event = undefined;
  var calevent = undefined;
  var eventId = undefined;
  var eventDescription = undefined;
  var activity = undefined;
  
  for(var i=0; i<activities.length; i++)
  {
    activity = activities[i];
    Logger.log("Processing activity id " + activity.activity_id);
    var foundMathingActivity = false;
    
    for(var j=0; j<calevents.items.length; j++){
      calevent = calevents.items[j];
      eventId = calevent.getId();
      
      if(eventId === activity.calendar_event_id){
        Logger.log("Found match with event. Update the activity's calendar event id " + eventId);        
        foundMathingActivity = true;
        processedCalEvents.push(eventId); // Save event Id for later differentiation
      }
    }
    
    Logger.log("No matching event found for the activity " + activity.activity_id);
    activity_event = scheduleAnActivityInCalendar(activity, tomorrow, batchid);
    tomorrow = new Date(activity_event['end']['dateTime']);
    
  }
  
  // Delete extra events that are not processed by activities
  for(var k=0; k<calevents.items.length; k++){
    calevent = calevents.items[k];
    eventId = calevent.getId();
    Logger.log(JSON.stringify(calevent));
    eventDescription = calevent.description;
    Logger.log("Attempt to clean the event " + eventId)
    
    if(eventDescription != undefined && eventDescription.indexOf("Activity id:") != -1 && processedCalEvents.indexOf(eventId) == -1){ 
      // The calendar event is not found, we delete it
      Logger.log("Event " + eventId + " 's activity not found. Deleting ...");
      Calendar.Events.remove(CALENDAR_ID, eventId);
    }
    else{
      Logger.log("Event " + eventId + " have been updated along side with activity");
    }
    
  }
  
  
  
  
  /**
  for(var j=0; j<calevents.items.length; j++)
  {
    calevent = calevents.items[j];
    eventId = calevent.getId();
    var foundMathingActivity = false;
    
    for(var i=0; i<activities.length; i++)
    {
      activity = activities[i];
      
      if(activity.calendar_event_id === eventId){
        foundMathingActivity = true;
        activity_event = scheduleAnActivityInCalendar(activity, tomorrow, batchid);
        tomorrow = new Date(activity_event['end']['dateTime']); //activity_event.getEndTime();
      }
    }
    
    //Delete the event if the activity is not found
    if(!foundMathingActivity)
    {
      Logger.log("Event " + eventId + "'s activity not found. Deleting ...");
      Calendar.Events.remove(CALENDAR_ID, eventId); 
    }
    
  }
  
  for(var k=0; k<activities.length; k++){
    foundMathingActivity = false
    
    activity = activities[k]
    for(var l=0; l<calevents.items.length; l++){
      calevent = calevents[l];
      
      if(calevent.getId() === activity.calendar_event_id){
        foundMathingActivity = true
      }      
    }
    
    // If there is no event matching that activity, schedule that activity
    if(!foundMathingActivity){ // foundMathingActivity = false
      activity_event = scheduleAnActivityInCalendar(activity, tomorrow, batchid);
      tomorrow = new Date(activity_event['end']['dateTime']); //activity_event.getEndTime();
    }
    
  }
  */
  
}

/**
* Schedule 1 activity in the calendar
*/
function scheduleAnActivityInCalendar(activity, startdate, batchid){
  Logger.log("scheduleAnActivityInCalendar > Activity Id = " + activity.activity_id);
  var summary = getCalendareventTitleFromActivity(activity);
  var description = getCalendareventDescriptionFromActivity(activity);
  var location = getCalendareventLocationFromActivity(activity);
  var attendees = []; //[{email: "afanousergio@gmail.com"}];
  var colorId = getActivityEventColorByPriority(activity.priority);
  
  Logger.log("Looking for a timeslot for " + description);
  var timeslot = getNextAvailableslot(CALENDAR_ID, startdate, batchid, 1);
  Logger.log("Found time slot " + timeslot);
  
  Logger.log("Activity calendar event id (" + activity.calendar_event_id + ")");
  var event = undefined;
  if(activity.calendar_event_id == "" || activity.calendar_event_id == "unknown"){
    event = createEventInCalendar(CALENDAR_ID, timeslot[0], timeslot[1], summary, location, description, attendees, colorId, batchid, activity);
  } else {
    event = updateEventInCalendar(CALENDAR_ID, activity.calendar_event_id, timeslot[0], timeslot[1], summary, location, description, attendees, colorId, batchid, activity);
  }
  
  // Set the color accourding to the priority
  //event.setColor(getActivityEventColorByPriority(activity.priority));
  
  return event;
}

function getCalendareventTitleFromActivity(activity){ return activity.project_name + " : " + activity.comment; }
function getCalendareventDescriptionFromActivity(activity)
{ 
  return getCalendareventTitleFromActivity(activity) + " // " + activity.email_link + "\nPriority: " + activity.priority + "\nActivity id: " + activity.activity_id; 
}
function getCalendareventLocationFromActivity(activity){ return ""; }


/**
* Get the next slot available in the calendar
*/
function getNextAvailableslot(calendarID, startdate, batchid, duration){
  
  var calEvents = [];
  var timeslot = undefined;
  var found = false;
  var tomorrow = startdate;
  
  while(!found){
    
    Logger.log("getNextAvailableslot > start date " + tomorrow);
    var slot1 = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    slot1.setHours(9); slot1.setMinutes(30); slot1.setSeconds(0); slot1.setMilliseconds(0);
    var slot1end = new Date(slot1.getFullYear(), slot1.getMonth(), slot1.getDate());
    slot1end.setHours(slot1.getHours() + duration); slot1end.setMinutes(30); slot1end.setSeconds(0); slot1end.setMilliseconds(0);
    calEvents = CalendarApp.getCalendarById(CALENDAR_ID).getEvents(slot1, slot1end);
    if(isFreeSlot(calEvents, batchid))
    { 
      timeslot = [slot1, slot1end]; found = true; 
    }else{
      var slot2 = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      slot2.setHours(10); slot2.setMinutes(30); slot2.setSeconds(0); slot2.setMilliseconds(0);
      var slot2end = new Date(slot2.getFullYear(), slot2.getMonth(), slot2.getDate());
      slot2end.setHours(slot2.getHours() + duration); slot2end.setMinutes(30); slot2end.setSeconds(0); slot2end.setMilliseconds(0);
      calEvents = CalendarApp.getCalendarById(CALENDAR_ID).getEvents(slot2, slot2end);
      if(isFreeSlot(calEvents, batchid))
      { 
        timeslot = [slot2, slot2end]; found = true; 
      } else {
        var slot3 = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        slot3.setHours(15); slot3.setMinutes(30); slot3.setSeconds(0); slot3.setMilliseconds(0);
        var slot3end = new Date(slot3.getFullYear(), slot3.getMonth(), slot3.getDate());
        slot3end.setHours(slot3.getHours() + duration); slot3end.setMinutes(30); slot3end.setSeconds(0); slot3end.setMilliseconds(0);
        calEvents = CalendarApp.getCalendarById(CALENDAR_ID).getEvents(slot3, slot3end);
        if(isFreeSlot(calEvents, batchid))
        { 
          timeslot = [slot3, slot3end]; found = true; 
        }else{
          // If we reach this stage, we look for another slot the next day
          tomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1);
          //getNextAvailableslot(calendarID, tomorrow, duration);
        }
      }
    }
  }
  
  return timeslot;
}


/**
* Returns true if the slot is free on the calendar
*/
function isFreeSlot(calEvents, batchid){
  
  Logger.log("isFreeSlot > Checking free slot for " + calEvents.length + " events, batchid " + batchid);
  // If the no events, return yes
  if(calEvents.length == 0){ return true; }
  else{
    // Analyse each event
    for(var k=0; k<calEvents.length; k++){
      var event = calEvents[k];
      
      var eventtag = event.getLocation(); //getTag("activitytracker");
      Logger.log("isFreeSlot > event : " + event.getTitle() + ", event tag : " + eventtag);
      
      if(eventtag == undefined || eventtag == null || eventtag == "" || eventtag == batchid){
        Logger.log("isFreeSlot > Found offending event (" + event.getTitle() + ") eventtag = " + eventtag + ", batchid = " + batchid);
        return false;
      }
    }
    return true; // if nothing offending found, return true.
  }
}

/**
*
*/
function getCurrentBatchId()
{
  return Utilities.formatDate(new Date(), "GMT", "YYYYMMddHHmm");
}
  
  
/**
* Return an event color based on the activity priority
*/
function getActivityEventColorByPriority(priority){
  if(priority = 1){
   return CalendarApp.EventColor.PALE_RED; 
  }
  if(priority = 2){
   return CalendarApp.EventColor.ORANGE; 
  }
  if(priority = 3){
   return CalendarApp.EventColor.YELLOW; 
  }
  if(priority = 4){
   return CalendarApp.EventColor.PALE_GREEN; 
  }
  else{
   return CalendarApp.EventColor.PALE_BLUE; 
  }
}

/**
 * Updates an event in the user's calendar.
 */
function updateEventInCalendar(calendarID, eventId, start, end, summary, location, description, attendees, colorId, batchid, activity) {
 
  Logger.log("updateEventInCalendar > " + summary + ", batchid = " + batchid);
  Logger.log("updateEventInCalendar > Date times :" + start + " => " + end);
  var calendar = CalendarApp.getCalendarById(calendarID);
  
  var calEvent = undefined;
  try{
    calEvent = Calendar.Events.get(calendarID, eventId); //calendar.getEventById(eventId);
    //Logger.log("Retrieved event tags : " + calEvent.getAllTagKeys());
    //Logger.log("Retrieved event title : '" + calEvent.getTitle() + "'");
    Logger.log("Retrieved event : " + JSON.stringify(calEvent));
    //displayEventTags(calEvent);
  }
  catch(ex){
    Logger.log("updateEventInCalendar > Event with ID " + eventId + " not found");
    Logger.log("updateEventInCalendar > Detailed error: " + ex + ' : ' + ex.stack)
  }
  
  Logger.log("updateEventInCalendar > CalEvent=" + calEvent);
  if(calEvent != undefined && calEvent['summary'] != ""){
    /*
    calEvent.setTime(start, end);
    calEvent.setTitle(summary);
    calEvent.setDescription(description);
    calEvent.setLocation(location);
    calEvent.setTag("activitytracker", batchid);*/
    var event = {
      summary: summary,
      description: description,
      location: batchid,
      start: {
        dateTime: start.toISOString()
      },
      end: {
        dateTime: end.toISOString()
      },
      attendees: attendees,
      colorId: colorId
    };
    
    Calendar.Events.update(event, calendarID, eventId);
    Logger.log("Event updated !");
  
  } else {
    Logger.log("Could not find the event with the ID " + eventId + ". Will create it.");
    calEvent = createEventInCalendar(CALENDAR_ID, start, end, summary, location, description, attendees, colorId, batchid, activity);
  }
  
  return calEvent;
}


/**
 * Creates an event in the user's calendar.
 */
function createEventInCalendar(calendarID, start, end, summary, location, description, attendees, colorId, batchid, activity) {
 
  Logger.log("createEventInCalendar > " + summary + ", batchid = " + batchid);
  var event = {
    summary: summary,
    description: description,
    location: batchid,
    start: {
      dateTime: start.toISOString()
    },
    end: {
      dateTime: end.toISOString()
    },
    attendees: attendees,
    colorId: colorId
  };
  Logger.log("createEventInCalendar > Event to create : " + JSON.stringify(event));
  event = Calendar.Events.insert(event, calendarID);
  Logger.log("createEventInCalendar > Event created !");
  
  //var event = CalendarApp.getCalendarById(calendarID).createEvent(summary, start, end); //Events.insert(event, calendarId);
  //event.setColor(CalendarApp.EventColor.YELLOW).setDescription(description).setTag("activitytracker", batchid);
  
  Logger.log('createEventInCalendar > Event ID: ' + event.getId());
    
  activity.calendar_event_id = event.getId();
  Logger.log("Updating calendar event id on activity " + activity.activity_id + "(Email ref:" + activity.email_reference + ") => event id " + activity.calendar_event_id);
  SpreadsheetDb.query(TABLE_NAME).update(activity.email_reference, activity);
  
  return event;
}

/**
 * Helper function to get a new Date object relative to the current date.
 * @param {number} daysOffset The number of days in the future for the new date.
 * @param {number} hour The hour of the day for the new date, in the time zone
 *     of the script.
 * @return {Date} The new date.
 */
function getRelativeDate(daysOffset, hour) {
  var date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}


function displayEventTags(event){
  var alltags = event.getAllTagKeys();
  Logger.log("displayAllCalendarEventsTags > " + alltags.length + " tags found for event " + event.getTitle());
  
  for(var j=0; j<alltags.length; j++)
  {
    var tag = alltags[j];
    Logger.log("Tag " + tag + " : " + event.getTag(tag));      
  }  
}


/**
 * Lists the calendars shown in the user's calendar list.
 */
function listCalendars() {
  var calendars;
  var pageToken;
  do {
    calendars = Calendar.CalendarList.list({
      maxResults: 100,
      pageToken: pageToken
    });
    if (calendars.items && calendars.items.length > 0) {
      for (var i = 0; i < calendars.items.length; i++) {
        var calendar = calendars.items[i];
        Logger.log('%s (ID: %s)', calendar.summary, calendar.id);
      }
    } else {
      Logger.log('No calendars found.');
    }
    pageToken = calendars.nextPageToken;
  } while (pageToken);
}


/**
 * Lists the next 10 upcoming events in the user's default calendar.
 */
function listNext10Events() {
  
  var now = new Date();
  var events = getCalendarEvents({
    timeMin: now.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 10
  });
  if (events.items && events.items.length > 0) {
    for (var i = 0; i < events.items.length; i++) {
      var event = events.items[i];
      if (event.start.date) {
        // All-day event.
        var start = new Date(event.start.date);
        Logger.log('%s (%s)', event.summary, start.toLocaleDateString());
      } else {
        var start = new Date(event.start.dateTime);
        Logger.log('%s (%s)', event.summary, start.toLocaleString());
      }
    }
  } else {
    Logger.log('No events found.');
  }
}


/**
Get events from the Calendar.Events
*/
function getCalendarEvents(options)
{
  var calendarId = CALENDAR_ID;
  var events = Calendar.Events.list(calendarId, options);
  return events;
}


/**
 * Creates an event in the user's default calendar, waits 30 seconds, then
 * attempts to update the event's location, on the condition that the event
 * has not been changed since it was created.  If the event is changed during
 * the 30-second wait, then the subsequent update will throw a 'Precondition
 * Failed' error.
 *
 * The conditional update is accomplished by setting the 'If-Match' header
 * to the etag of the new event when it was created.
 */
function conditionalUpdate() {
  var calendarId = CALENDAR_ID;
  var start = getRelativeDate(1, 12);
  var end = getRelativeDate(1, 13);
  var event = {
    summary: 'Lunch Meeting',
    location: 'The Deli',
    description: 'To discuss our plans for the presentation next week.',
    start: {
      dateTime: start.toISOString()
    },
    end: {
      dateTime: end.toISOString()
    },
    attendees: [
      {email: 'alice@example.com'},
      {email: 'bob@example.com'}
    ],
    // Red background. Use Calendar.Colors.get() for the full list.
    colorId: 11
  };
  event = Calendar.Events.insert(event, calendarId);
  Logger.log('Event ID: ' + event.getId());
  // Wait 30 seconds to see if the event has been updated outside this script.
  Utilities.sleep(30 * 1000);
  // Try to update the event, on the condition that the event state has not
  // changed since the event was created.
  event.location = 'The Coffee Shop';
  try {
    event = Calendar.Events.update(
      event,
      calendarId,
      event.id,
      {},
      {'If-Match': event.etag}
    );
    Logger.log('Successfully updated event: ' + event.id);
  } catch (e) {
    Logger.log('Fetch threw an exception: ' + e);
  }
}



/**
 * Creates an event in the user's default calendar, then re-fetches the event
 * every second, on the condition that the event has changed since the last
 * fetch.
 *
 * The conditional fetch is accomplished by setting the 'If-None-Match' header
 * to the etag of the last known state of the event.
 */
function conditionalFetch() {
  var calendarId = CALENDAR_ID;
  var start = getRelativeDate(1, 12);
  var end = getRelativeDate(1, 13);
  var event = {
    summary: 'Lunch Meeting',
    location: 'The Deli',
    description: 'To discuss our plans for the presentation next week.',
    start: {
      dateTime: start.toISOString()
    },
    end: {
      dateTime: end.toISOString()
    },
    attendees: [
      {email: 'alice@example.com'},
      {email: 'bob@example.com'}
    ],
    // Red background. Use Calendar.Colors.get() for the full list.
    colorId: 11
  };
  event = Calendar.Events.insert(event, calendarId);
  Logger.log('Event ID: ' + event.getId());
  // Re-fetch the event each second, but only get a result if it has changed.
  for (var i = 0; i < 30; i++) {
    Utilities.sleep(1000);
    try {
      event = Calendar.Events.get(calendarId, event.id, {}, {'If-None-Match': event.etag});
      Logger.log('New event description: ' + event.description);
    } catch (e) {
      Logger.log('Fetch threw an exception: ' + e);
    }
  }
}



/**
 * Retrieve and log events from the given calendar that have been modified
 * since the last sync. If the sync token is missing or invalid, log all
 * events from up to a month ago (a full sync).
 *
 * @param {string} calendarId The ID of the calender to retrieve events from.
 * @param {boolean} fullSync If true, throw out any existing sync token and
 *        perform a full sync; if false, use the existing sync token if possible.
 */
function logSyncedEvents(calendarId, fullSync) {
  var properties = PropertiesService.getUserProperties();
  var options = {
    maxResults: 100
  };
  var syncToken = properties.getProperty('syncToken');
  if (syncToken && !fullSync) {
    options.syncToken = syncToken;
  } else {
    // Sync events up to thirty days in the past.
    options.timeMin = getRelativeDate(-30, 0).toISOString();
  }

  // Retrieve events one page at a time.
  var events;
  var pageToken;
  do {
    try {
      options.pageToken = pageToken;
      events = Calendar.Events.list(calendarId, options);
    } catch (e) {
      // Check to see if the sync token was invalidated by the server;
      // if so, perform a full sync instead.
      if (e.message === 'Sync token is no longer valid, a full sync is required.') {
        properties.deleteProperty('syncToken');
        logSyncedEvents(calendarId, true);
        return;
      } else {
        throw new Error(e.message);
      }
    }

    if (events.items && events.items.length > 0) {
      for (var i = 0; i < events.items.length; i++) {
         var event = events.items[i];
         if (event.status === 'cancelled') {
           console.log('Event id %s was cancelled.', event.id);
         } else if (event.start.date) {
           // All-day event.
           var start = new Date(event.start.date);
           console.log('%s (%s)', event.summary, start.toLocaleDateString());
         } else {
           // Events that don't last all day; they have defined start times.
           var start = new Date(event.start.dateTime);
           console.log('%s (%s)', event.summary, start.toLocaleString());
         }
      }
    } else {
      console.log('No events found.');
    }

    pageToken = events.nextPageToken;
  } while (pageToken);

  properties.setProperty('syncToken', events.nextSyncToken);
}