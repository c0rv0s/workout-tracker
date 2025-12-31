# Rotation Workout Tracker

A beautiful, modern workout tracking app with rotation-based training support. Track your upper/lower power and hypertrophy sessions with style.

## Features

- 🏋️ **Workout Rotation System** - Automatically rotates through Upper Power, Lower Power, Upper Hypertrophy, and Lower Hypertrophy
- 📅 **Calendar View** - Visual calendar showing all your workout sessions
- 📝 **Session Notes** - Add notes to each workout session
- 💾 **Local Storage** - All data stored locally in your browser
- ☁️ **Google Sheets Backup** - Optional cloud backup to Google Sheets
- 📱 **PWA Support** - Install as a Progressive Web App on your phone
- 🎨 **Award-Winning Design** - Modern dark theme with electric lime accents

## Quick Start

1. Open `index.html` in a web browser
2. Start logging your workouts!
3. (Optional) Set up Google Sheets backup for cloud storage

## Google Sheets Backup (Optional)

The app includes optional Google Sheets backup functionality. **Important**: The backup is tied to the Google account that deploys the script.

### Single User (Personal Use)

If you're the only user:
- Deploy the Google Apps Script once using your Google account
- All backups go to your Google Drive
- Setup instructions in `GOOGLE_SHEETS_SETUP.md`

### Multiple Users

**⚠️ Important**: If you share this app with others, each user needs their own Google Sheets backup setup to keep their data separate.

**How it works:**
- The Google Apps Script runs with the credentials of whoever deployed it
- All backups go to that person's Google Drive
- If multiple users share the same script URL, they'll all write to the same spreadsheet (not recommended)

**For each user:**
1. Each user needs to deploy their own Google Apps Script (using their own Google account)
2. Each user updates `google-sheets.js` with their own script URL
3. Each user gets their own separate spreadsheet in their own Google Drive

**Alternative:**
- Users can use the local JSON export/import feature instead
- This works independently per browser/device
- No Google account needed

## Data Storage

- **Local Storage**: All workout data is stored in your browser's localStorage
- **Google Sheets Backup**: Optional cloud backup (requires setup)
- **JSON Export**: Export/import your data as JSON files

## Browser Support

Works in all modern browsers:
- Chrome/Edge (recommended)
- Safari
- Firefox

## Development

To run locally:
```bash
python3 -m http.server 8000
# or
npx serve
```

Then open http://localhost:8000 in your browser.

## License

Personal use - feel free to modify and use for your own workouts!

