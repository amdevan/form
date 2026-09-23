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
  "School Name",
  "Respondent",
  "Phone",
  "Palika Name",
  "Q1 Regular attendance & homework support",
  "Q1 Numbers",
  "Q2 Study environment & materials",
  "Q2 Numbers",
  "Q3 Love, respect & equal treatment",
  "Q3 Numbers",
  "Q4 Health, hygiene, nutrition & emotional alertness",
  "Q4 Numbers",
  "Q5 Protection from violence & online risk",
  "Q5 Numbers",
  "Q6 Adolescent dialogue on health & life skills",
  "Q6 Numbers",
  "Q7 Complaint response system",
  "Q7 Numbers",
  "Q8 School-teacher coordination & participation",
  "Q8 Numbers"
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
    payload.schoolName || "",
    payload.respondent || "",
    payload.phone || "",
    payload.palikaName || "",
    payload.q1 || "",
    payload.q1Num || "",
    payload.q2 || "",
    payload.q2Num || "",
    payload.q3 || "",
    payload.q3Num || "",
    payload.q4 || "",
    payload.q4Num || "",
    payload.q5 || "",
    payload.q5Num || "",
    payload.q6 || "",
    payload.q6Num || "",
    payload.q7 || "",
    payload.q7Num || "",
    payload.q8 || "",
    payload.q8Num || ""
  ];

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success", row: sheet.getLastRow() }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
