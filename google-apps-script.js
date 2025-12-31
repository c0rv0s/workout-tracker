/**
 * Google Apps Script Code for Rotation Workout Backup
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Replace the default code with this file's contents
 * 4. Deploy as Web App:
 *    - Click "Deploy" > "New deployment"
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click "Deploy"
 * 5. Copy the Web App URL
 * 6. Paste the URL into google-sheets.js as GOOGLE_SCRIPT_URL
 * 
 * NOTE: You'll need to authorize the script on first run (run doGet or doPost manually once)
 */

const SPREADSHEET_NAME = 'Rotation Workout Backup';
const SHEET_NAME = 'Workouts';

function doPost(e) {
  return handleRequest(e.postData.contents, 'POST');
}

function doGet(e) {
  const data = e.parameter.data;
  if (data) {
    return handleRequest(decodeURIComponent(data), 'GET');
  } else if (e.parameter.action === 'import') {
    return importData();
  } else {
    return ContentService.createTextOutput(JSON.stringify({
      error: 'Invalid request. Use ?action=import or ?data=...'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRequest(requestData, method) {
  try {
    let payload;
    try {
      payload = JSON.parse(requestData);
    } catch (e) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Invalid JSON: ' + e.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === 'export') {
      return exportData(payload.data);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Invalid action. Use action: "export"'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function findOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  
  // Create new spreadsheet
  const ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  
  // Delete default sheet and create our named sheet
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) {
    ss.deleteSheet(defaultSheet);
  }
  ss.insertSheet(SHEET_NAME);
  
  return ss;
}

function exportData(data) {
  try {
    const ss = findOrCreateSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }
    
    // Clear existing data
    sheet.clear();
    
    // Write header
    const header = ['Date', 'Workout ID', 'Workout Name', 'Note', 'Exercise Name', 'Weight', 'Reps'];
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    
    // Prepare data rows
    const rows = [];
    if (data.history && Array.isArray(data.history)) {
      data.history.forEach(function(entry) {
        if (entry.exercises && entry.exercises.length > 0) {
          entry.exercises.forEach(function(exercise, idx) {
            rows.push([
              entry.date || '',
              entry.workoutId || '',
              entry.workoutId || '',
              idx === 0 ? (entry.note || '') : '',
              exercise.name || '',
              exercise.weight || '',
              exercise.reps || ''
            ]);
          });
        } else {
          rows.push([
            entry.date || '',
            entry.workoutId || '',
            entry.workoutId || '',
            entry.note || '',
            '',
            '',
            ''
          ]);
        }
      });
    }
    
    // Write data
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, header.length).setValues(rows);
    }
    
    // Format header
    const headerRange = sheet.getRange(1, 1, 1, header.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, header.length);
    
    const result = {
      success: true,
      url: ss.getUrl(),
      count: data.history ? data.history.length : 0
    };
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function importData() {
  try {
    const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
    if (!files.hasNext()) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'No backup spreadsheet found. Please backup first.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = SpreadsheetApp.open(files.next());
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Sheet "' + SHEET_NAME + '" not found in spreadsheet'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'No data found in spreadsheet (only header row)'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Parse data back into sessions
    const sessions = [];
    let currentSession = null;
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const [date, workoutId, workoutName, note, exerciseName, weight, reps] = row;
      
      if (!date || !workoutId) continue;
      
      // Check if new session
      if (!currentSession || currentSession.date !== date.toString() || currentSession.workoutId !== workoutId.toString()) {
        if (currentSession) {
          sessions.push(currentSession);
        }
        
        currentSession = {
          date: date.toString(),
          workoutId: workoutId.toString(),
          note: note ? note.toString() : '',
          exercises: []
        };
      }
      
      // Add exercise
      if (exerciseName) {
        currentSession.exercises.push({
          name: exerciseName.toString(),
          weight: weight ? weight.toString() : '',
          reps: reps ? reps.toString() : ''
        });
      } else if (note && !currentSession.note) {
        currentSession.note = note.toString();
      }
    }
    
    // Add last session
    if (currentSession) {
      sessions.push(currentSession);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: {
        version: 1,
        history: sessions
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
