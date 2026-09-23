/**
 * The Google Apps Script source the user pastes into their Sheet's
 * Extensions > Apps Script editor. Kept in one place so the UI copy
 * and the expected field order always stay in sync.
 */
export const APPS_SCRIPT_CODE = `/**
 * Google Apps Script — Parent Commitment Form handler
 * Records each form submission as a new row in this Google Sheet.
 *
 * SETUP (one time):
 * 1. Create a new Google Sheet (or use an existing one).
 * 2. Extensions > Apps Script. Delete any code in the editor.
 * 3. Paste this entire file. Save (name it anything).
 * 4. Click Deploy > New deployment.
 * 5. Select type: "Web app".
 * 6. Description: Parent commitment form
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Click Deploy, then Authorize access when prompted.
 * 10. Copy the "Web app URL" (ends in /exec) and paste it into the
 *     form's Setup dialog.
 */

var HEADERS = [
  "Timestamp",
  "Student Name",
  "Class",
  "Phone",
  "Q1 Regular attendance & study support",
  "Q2 Study environment & materials",
  "Q3 Respect & equal treatment",
  "Q4 Abuse / harassment prevention & reporting",
  "Q5 Learning methods & positive support",
  "Q6 School volunteer / safety system",
  "Q7 Parent-teacher engagement (multi)",
  "Q8 Health, hygiene, nutrition & emotional check"
];

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", service: "commitment-form" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];

  // Write header row the first time
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  var payload = {};
  try {
    payload = JSON.parse(e.postData.contents || "{}");
  } catch (err) {
    payload = {};
  }

  var row = [
    new Date(),
    payload.studentName || "",
    payload.className || "",
    payload.phone || "",
    payload.q1 || "",
    payload.q2 || "",
    payload.q3 || "",
    payload.q4 || "",
    payload.q5 || "",
    payload.q6 || "",
    payload.q7 || "",
    payload.q8 || ""
  ];

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success", row: sheet.getLastRow() }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
