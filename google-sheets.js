// Google Sheets Backup Integration
// Uses Google Apps Script as a proxy backend (see README for setup)

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw53Zm2j40uDCi2qHI_Ry_fVgDz3YxzGwom1YPvg0nar4_4YeLLlHs41T83QN6R7gjvGw/exec';

// Export data to Google Sheets via Apps Script
async function exportToGoogleSheets(state) {
  if (!GOOGLE_SCRIPT_URL) {
    updateGoogleStatus('⚠️ Please configure Google Script URL in google-sheets.js. See README for setup.');
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

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Check if response is ok
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
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    
    // Provide helpful error message
    let errorMsg = error.message;
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      errorMsg = 'CORS error. Make sure deployment is set to "Anyone" (not "Anyone with Google account"). Also try running the script manually once to authorize it.';
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
