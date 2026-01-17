# Rotation Workout Tracker

A beautiful, modern workout tracking app with rotation-based training support. Track your upper/lower power and hypertrophy sessions with style.

## Features

- 🏋️ **Workout Rotation System** - Automatically rotates through Upper Power, Lower Power, Upper Hypertrophy, and Lower Hypertrophy
- 📅 **Calendar View** - Visual calendar showing all your workout sessions
- 📝 **Session Notes** - Add notes to each workout session
- 💾 **Local Storage** - All data stored locally in your browser
- ☁️ **Netlify Database Backup** - Optional cloud backup via Netlify Functions + Blobs
- 📱 **PWA Support** - Install as a Progressive Web App on your phone
- 🎨 **Award-Winning Design** - Modern dark theme with electric lime accents

## Quick Start

1. Open `index.html` in a web browser
2. Start logging your workouts!

## Netlify Database Backup (Optional)

The app can back up and restore workouts using a Netlify Function with Netlify Blobs storage.

**How it works:**
- Each device generates a backup key (stored locally)
- The same backup key can be used on another device to restore data
- Anyone with the key can access the backup, so keep it private
- No Google account is required

**Netlify setup:**
1. Deploy the site to Netlify with Functions enabled
2. Ensure `@netlify/blobs` is installed (see `package.json`)
3. Use the in-app Backup/Restore buttons

## Data Storage

- **Local Storage**: All workout data is stored in your browser's localStorage
- **Netlify Database Backup**: Optional cloud backup via Netlify Functions + Blobs

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

