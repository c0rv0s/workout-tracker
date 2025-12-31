# Google Sheets Backup Setup Instructions

This app can backup and restore your workout data to/from Google Sheets. Follow these steps to set it up:

## ⚠️ Important: Multi-User Setup

**If you're sharing this app with others**, each user needs to deploy their own Google Apps Script. The script runs with the credentials of whoever deploys it, so:
- All backups go to **your** Google Drive (the deployer's account)
- Multiple users sharing the same script URL will all write to the **same spreadsheet**
- Each user should deploy their own script and use their own script URL in `google-sheets.js`

See `README.md` for more details on multi-user setup.

## Step 1: Create Google Apps Script

1. Go to https://script.google.com
2. Click "New Project"
3. Delete the default code in the editor
4. Copy the entire contents of `google-apps-script.js` file
5. Paste it into the Google Apps Script editor
6. Save the project (give it a name like "Rotation Workout Backup")

## Step 2: Authorize the Script (IMPORTANT - Do This First!)

1. In the Apps Script editor, click the function dropdown (top center) and select `doGet`
2. Click the "Run" button ▶️
3. You'll be prompted to authorize:
   - Click "Review Permissions"
   - Choose your Google account
   - Click "Advanced" > "Go to [Project Name] (unsafe)" (this is safe, it's your own script)
   - Click "Allow"
   - Grant permissions to access Google Drive and Sheets
4. The script will run and show an error - that's OK! It just needs authorization.

## Step 3: Deploy as Web App

1. Click the "Deploy" button (top right)
2. Select "New deployment"
3. Click the gear icon ⚙️ next to "Select type" and choose "Web app"
4. Configure the deployment:
   - **Description**: "Rotation Workout Backup API" (optional)
   - **Execute as**: Me
   - **Who has access**: **"Anyone"** (IMPORTANT: This must be "Anyone" for CORS to work from localhost!)
   - Click "Deploy"
5. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

## Step 4: Configure the App

1. Open `google-sheets.js` in your code editor
2. Find this line near the top:
   ```javascript
   const GOOGLE_SCRIPT_URL = '';
   ```
3. Paste your Web App URL between the quotes:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. Save the file

## Step 5: Test It

1. Make sure you have some workout data in the app
2. Click "Backup to Google Sheets" button
3. You should see a success message with a link to open the spreadsheet
4. Click the link to verify your data is in Google Sheets

## How It Works

- **Backup**: Exports all your workout sessions to a Google Sheet named "Rotation Workout Backup"
- **Restore**: Imports all data from the same spreadsheet back into the app
- **Reinstall**: After reinstalling the app, just click "Restore from Google Sheets" to get all your data back

## Notes

- The spreadsheet is created automatically in your Google Drive on first backup
- The spreadsheet format is: Date | Workout ID | Workout Name | Note | Exercise Name | Weight | Reps
- Each workout session can have multiple rows (one per exercise)
- Restoring will **replace** all current data in the app

## Troubleshooting

**"Failed to fetch" or CORS errors**
- **MOST COMMON**: Make sure "Who has access" is set to **"Anyone"** (not "Anyone with Google account")
- Make sure you've authorized the script (Step 2 above) - run `doGet` manually once
- Try redeploying as a new version after changing access settings

**"Error: HTTP error! status: 403"**
- The script needs authorization - run `doGet` manually in the Apps Script editor once
- Make sure "Who has access" is set to "Anyone" in the deployment settings

**"Error: No backup spreadsheet found"**
- Make sure you've run a backup at least once before trying to restore

**"Authorization required"**
- You need to authorize the script first (Step 2)
- Run `doGet` or `doPost` manually in the Apps Script editor to trigger authorization
