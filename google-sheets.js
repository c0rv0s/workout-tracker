// Google Sheets Backup Integration
// Uses Google Apps Script as a proxy backend (see README for setup)

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzyg8vSRf0dVad-epB9T5eDv7KfMJcUWHskeobXTHrlXPQ5TBLw6pQyC0NJGra80AIUVQ/exec';

// Export data to Google Sheets via Apps Script
async function exportToGoogleSheets(state) {
  if (!GOOGLE_SCRIPT_URL) {
    updateGoogleStatus('⚠️ Please configure Google Script URL in google-sheets.js. See README for setup.');
    return;
  }

  if (!state.history || !state.history.length) {
    updateGoogleStatus('No workout data to backup.');
    return;
  }

  updateGoogleStatus('Backing up to Google Sheets...');

  try {
    const payload = {
      action: 'export',
      data: {
        version: 1,
        exportedAt: new Date().toISOString(),
        history: state.history,
      },
    };

    // Use GET with URL parameter (more reliable with Apps Script than POST)
    // Note: URL length limit is ~2000 chars, so for large data we'll use a workaround
    const payloadString = JSON.stringify(payload);
    
    if (payloadString.length > 1500) {
      // For large payloads, use form submission (doesn't wait for response but works reliably)
      updateGoogleStatus('Submitting large backup...');
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = GOOGLE_SCRIPT_URL;
      form.target = '_blank';
      form.style.display = 'none';
      
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'data';
      input.value = payloadString;
      form.appendChild(input);
      
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      // Since we can't get response, just update status
      updateGoogleStatus(`✓ Backup submitted! Check your Google Drive for "Rotation Workout Backup" spreadsheet. The data should appear shortly.`);
      return null;
    } else {
      // For smaller payloads, use GET
      const encodedData = encodeURIComponent(payloadString);
      const url = `${GOOGLE_SCRIPT_URL}?data=${encodedData}`;
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.url) {
        throw new Error('No URL returned from backup');
      }

      updateGoogleStatus(`✓ Backed up ${state.history.length} sessions. <a href="${result.url}" target="_blank" style="color: var(--accent);">Open Sheet</a>`);
      return result.url;
    }
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    
    // Provide helpful error message
    let errorMsg = error.message;
    if (error.message.includes('Failed to fetch') || error.message.includes('Load failed')) {
      errorMsg = 'Network error. The backup may have succeeded - check your Google Drive for "Rotation Workout Backup" spreadsheet.';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      errorMsg = 'Authorization error. Please run the script manually once in Apps Script to authorize it.';
    }
    
    updateGoogleStatus(`Error: ${errorMsg}`);
    throw error;
  }
}

// Import data from Google Sheets via Apps Script  
async function importFromGoogleSheets() {
  if (!GOOGLE_SCRIPT_URL) {
    updateGoogleStatus('⚠️ Please configure Google Script URL in google-sheets.js. See README for setup.');
    return;
  }

  updateGoogleStatus('Restoring from Google Sheets...');

  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=import`, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    if (!result.data || !result.data.history) {
      throw new Error('No data found in spreadsheet');
    }

    updateGoogleStatus(`✓ Restored ${result.data.history.length} sessions from spreadsheet`);
    return result.data.history;
  } catch (error) {
    console.error('Error importing from Google Sheets:', error);
    updateGoogleStatus(`Error: ${error.message}`);
    throw error;
  }
}

// Update status message
function updateGoogleStatus(message) {
  const statusEl = document.getElementById('google-status');
  if (statusEl) {
    statusEl.innerHTML = message;
  }
}

// Initialize (called after DOM loads)
function initGoogleSheets() {
  if (!GOOGLE_SCRIPT_URL) {
    updateGoogleStatus('⚠️ Google Sheets backup not configured. See README for setup instructions.');
  } else {
    updateGoogleStatus('Ready to backup/restore');
  }
}
