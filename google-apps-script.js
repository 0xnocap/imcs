// GOOGLE APPS SCRIPT - Copy this to your Google Sheet's Apps Script editor
// Go to: Extensions > Apps Script > paste this > Save > Deploy as Web App

const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);
    
    const name = data.name?.trim().toLowerCase();
    const info = data.info?.trim();
    const wallet = data.wallet?.trim().toLowerCase();
    const ip = data.ip || 'unknown';
    
    // Validate required fields
    if (!name || !info || !wallet) {
      return createResponse(false, 'Missing required fields');
    }
    
    // Get existing data to check for duplicates
    const existingData = sheet.getDataRange().getValues();
    
    // Check for duplicate name or wallet (skip header row)
    for (let i = 1; i < existingData.length; i++) {
      const existingName = existingData[i][0]?.toString().toLowerCase();
      const existingWallet = existingData[i][2]?.toString().toLowerCase();
      const existingIp = existingData[i][3]?.toString();
      
      if (existingName === name) {
        return createResponse(false, 'dat naem alredy taken! try anuther 1');
      }
      
      if (existingWallet === wallet) {
        return createResponse(false, 'dat wallet alredy on da lisssst!');
      }
      
      if (ip !== 'unknown' && existingIp === ip) {
        return createResponse(false, 'u alredy submitd from dis compooter!');
      }
    }
    
    // Add new row (original case for display, we only lowercase for comparison)
    sheet.appendRow([data.name.trim(), data.info.trim(), data.wallet.trim(), ip, new Date()]);
    
    return createResponse(true, 'ur now on da savant lisssst! 🎉');
    
  } catch (error) {
    return createResponse(false, 'sumthin went wrong: ' + error.message);
  }
}

function createResponse(success, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success, message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Required for CORS
function doGet(e) {
  return createResponse(false, 'POST requests only plz');
}

/*
DEPLOYMENT INSTRUCTIONS:
========================
1. Save this script (Ctrl+S or Cmd+S)
2. Click "Deploy" > "New deployment"
3. Click the gear icon next to "Select type" and choose "Web app"
4. Set:
   - Description: "Savant List Form"
   - Execute as: "Me"
   - Who has access: "Anyone"
5. Click "Deploy"
6. Authorize the app when prompted
7. Copy the Web App URL - you'll need it for the frontend!

SHEET SETUP:
============
Make sure your Google Sheet has these column headers in Row 1:
| name | info | wallet-address | ip | timestamp |

(ip and timestamp are added automatically for tracking)
*/
