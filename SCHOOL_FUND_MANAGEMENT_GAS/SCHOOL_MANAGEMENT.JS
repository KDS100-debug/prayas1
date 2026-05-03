/*
  SCHOOL MANAGEMENT SYSTEM
  This file contains two sections:
  1. Google Apps Script backend logic. Paste this backend section into Code.gs for Apps Script deployment.
  2. Browser frontend logic used by SCHOOL_MANAGEMENT.HTML.
*/

/* =========================
   GOOGLE APPS SCRIPT BACKEND
   ========================= */
// Published reference sheet. This URL is read-only and cannot be used for saving app data.
const PUBLISHED_REFERENCE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaXcu6PMuKnUxndRQkJJo8SIr5z5fvDARi9jLkCEsLPTjIiuVl50OirsTPh5GVL46Gv-ue6mn61k7K/pubhtml";
const PUBLISHED_REFERENCE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaXcu6PMuKnUxndRQkJJo8SIr5z5fvDARi9jLkCEsLPTjIiuVl50OirsTPh5GVL46Gv-ue6mn61k7K/pub?output=csv";
const PUBLISHED_BASE_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQaXcu6PMuKnUxndRQkJJo8SIr5z5fvDARi9jLkCEsLPTjIiuVl50OirsTPh5GVL46Gv-ue6mn61k7K/pub";
const PUBLISHED_SHEET_GIDS = {
  Departments: "0",
  FundRequests: "1173189745",
  Transactions: "352377997",
  Ledger: "1592014418",
  Users: "1501300339",
  AuditLog: "8072373"
};

// Paste the editable Google Sheet ID here. It looks like:
// https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
const SPREADSHEET_ID = "PASTE_EDITABLE_SPREADSHEET_ID_HERE";
const SESSION_TTL_SECONDS = 21600;

const SHEETS = {
  Departments: ["DepartmentID", "DepartmentName", "CurrentBalance", "HeadName", "Status", "CreatedAt", "UpdatedAt"],
  Users: ["UserID", "Name", "Role", "DepartmentID", "DepartmentName", "LoginID", "Password", "Status"],
  FundRequests: ["RequestID", "RequestedByDepartmentID", "RequestedByDepartmentName", "RequestedAmount", "Purpose", "RequestDate", "Status", "ApprovedBy", "ApprovedDate", "RejectedReason", "AssignedSenderDepartmentID", "AssignedSenderDepartmentName", "TransferredDate", "TransferredBy"],
  Transactions: ["TransactionID", "RequestID", "FromDepartmentID", "FromDepartmentName", "ToDepartmentID", "ToDepartmentName", "Amount", "TransactionDate", "ApprovedBy", "Status", "Remarks"],
  Ledger: ["LedgerID", "DepartmentID", "DepartmentName", "TransactionID", "Date", "Type", "Debit", "Credit", "BalanceAfterTransaction", "Description"],
  AuditLog: ["LogID", "UserID", "UserName", "Action", "EntityType", "EntityID", "Description", "Timestamp"]
};

const DEPARTMENTS = [
  ["D001", "ADMISSION DEPARTMENT", "ADMISSION"],
  ["D002", "EXAM DEPARTMENT", "EXAM"],
  ["D003", "TRAINING", "TRAINING"],
  ["D004", "LIBRARY AND SCIENCE LABORATORY", "LIBRARY"],
  ["D005", "ANNUAL FUNCTION", "FUNCTION"],
  ["D006", "DEVELOPMENT", "DEVELOPMENT"],
  ["D007", "CO-CURRICULUM", "COCURRICULUM"],
  ["D008", "SPORTS", "SPORTS"],
  ["D009", "ID", "ID"],
  ["D010", "OFFICE", "OFFICE"],
  ["D011", "ELECTRICITY", "ELECTRICITY"],
  ["D012", "OTHER", "OTHER"]
];

function doGet() {
  return HtmlService.createTemplateFromFile("SCHOOL_MANAGEMENT")
    .evaluate()
    .setTitle("School Fund Management System")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSpreadsheet_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === "PASTE_EDITABLE_SPREADSHEET_ID_HERE") {
    throw new Error("Set SPREADSHEET_ID to the editable Google Sheet ID. Published pubhtml/csv links are read-only references: " + PUBLISHED_REFERENCE_SHEET_URL + " and " + PUBLISHED_REFERENCE_CSV_URL);
  }
  if (String(SPREADSHEET_ID).indexOf("2PACX-") === 0 || String(SPREADSHEET_ID).indexOf("/pubhtml") !== -1 || String(SPREADSHEET_ID).indexOf("output=csv") !== -1) {
    throw new Error("Published pubhtml/csv links cannot be used as the writable database. Open the original Google Sheet and copy the editable ID from /spreadsheets/d/.../edit.");
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function hasEditableSpreadsheet_() {
  return SPREADSHEET_ID &&
    SPREADSHEET_ID !== "PASTE_EDITABLE_SPREADSHEET_ID_HERE" &&
    String(SPREADSHEET_ID).indexOf("2PACX-") !== 0 &&
    String(SPREADSHEET_ID).indexOf("/pubhtml") === -1 &&
    String(SPREADSHEET_ID).indexOf("output=csv") === -1;
}

function getSheet(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet: " + sheetName + ". Run setupSheets().");
  return sheet;
}

function generateId(prefix) {
  return prefix + "-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMddHHmmss") + "-" + Math.floor(Math.random() * 9000 + 1000);
}

function getTimestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function ok(data) {
  return { success: true, data: data };
}

function fail(message) {
  return { success: false, message: String(message) };
}

function sheetToObjects_(sheetName) {
  if (!hasEditableSpreadsheet_() && PUBLISHED_SHEET_GIDS[sheetName]) {
    return publishedSheetToObjects_(sheetName);
  }
  const values = getSheet(sheetName).getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(row => row.some(cell => cell !== "")).map((row, index) => {
    const obj = { _row: index + 2 };
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

function publishedSheetToObjects_(sheetName) {
  const gid = PUBLISHED_SHEET_GIDS[sheetName];
  if (!gid) return [];
  const url = PUBLISHED_BASE_CSV_URL + "?gid=" + gid + "&single=true&output=csv";
  const csv = UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText();
  const values = Utilities.parseCsv(csv);
  if (values.length < 2) return [];
  const headers = values[0].map(header => String(header).trim());
  return values.slice(1).filter(row => row.some(cell => cell !== "")).map((row, index) => {
    const obj = { _row: index + 2 };
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
}

function appendObject_(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = SHEETS[sheetName];
  sheet.appendRow(headers.map(header => obj[header] === undefined ? "" : obj[header]));
}

function updateRow_(sheetName, rowNumber, patch) {
  const sheet = getSheet(sheetName);
  const headers = SHEETS[sheetName];
  const row = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  headers.forEach((header, index) => {
    if (Object.prototype.hasOwnProperty.call(patch, header)) row[index] = patch[header];
  });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
}

function findBy_(sheetName, key, value) {
  return sheetToObjects_(sheetName).find(row => String(row[key]) === String(value));
}

function numeric_(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error("Amount must be numeric.");
  return n;
}

function loginUser(loginId, password) {
  try {
    const login = String(loginId || "").trim();
    const pass = String(password || "");
    const users = publishedSheetToObjects_("Users").concat(hasEditableSpreadsheet_() ? sheetToObjects_("Users") : []);
    const user = users.find(row => {
      const loginCandidates = [row.LoginID, row.LogID, row.UserID]
        .filter(value => value !== undefined && value !== null)
        .map(value => String(value).trim().toUpperCase());
      const status = String(row.Status || "Active").trim().toLowerCase();
      return loginCandidates.includes(login.toUpperCase()) &&
        String(row.Password) === pass &&
        status === "active";
    });
    if (!user) return fail("Invalid login ID or password.");
    const sessionToken = Utilities.getUuid();
    const safeUser = sanitizeUser_(user);
    CacheService.getScriptCache().put("session:" + sessionToken, JSON.stringify(safeUser), SESSION_TTL_SECONDS);
    logAudit(user.UserID, user.Name, "LOGIN", "User", user.UserID, "User logged in.");
    return ok({ sessionToken: sessionToken, user: safeUser });
  } catch (error) {
    return fail(error.message);
  }
}

function logoutUser(sessionToken) {
  const user = validateSession(sessionToken);
  if (user) {
    CacheService.getScriptCache().remove("session:" + sessionToken);
    logAudit(user.UserID, user.Name, "LOGOUT", "User", user.UserID, "User logged out.");
  }
  return ok(true);
}

function getCurrentUser(sessionToken) {
  const user = validateSession(sessionToken);
  return user ? ok(user) : fail("Session expired. Please login again.");
}

function validateSession(sessionToken) {
  if (!sessionToken) return null;
  const raw = CacheService.getScriptCache().get("session:" + sessionToken);
  return raw ? JSON.parse(raw) : null;
}

function sanitizeUser_(user) {
  const loginId = String(user.LoginID || user.LogID || user.UserID || "").trim().toUpperCase();
  const matchedDepartment = DEPARTMENTS.find(row => row[2] === loginId || row[0] === loginId);
  const rawRole = String(user.Role || "").trim().toUpperCase();
  const inferredRole = rawRole === "HEAD" ? "HEAD" : (rawRole === "DEPT" || rawRole === "DEPARTMENT" ? "DEPARTMENT" : (loginId === "HEAD" || String(user.UserID).toUpperCase() === "U-HEAD" ? "HEAD" : "DEPARTMENT"));
  const inferredDepartmentId = user.DepartmentID || (matchedDepartment ? matchedDepartment[0] : "");
  const inferredDepartmentName = user.DepartmentName || (matchedDepartment ? matchedDepartment[1] : (inferredRole === "HEAD" ? "HEAD DEPARTMENT" : ""));
  return {
    UserID: user.UserID,
    Name: user.Name || inferredDepartmentName || loginId,
    Role: inferredRole,
    DepartmentID: inferredDepartmentId,
    DepartmentName: inferredDepartmentName,
    LoginID: user.LoginID || user.LogID || user.UserID,
    Status: user.Status || "Active"
  };
}

function requireHead(user) {
  if (!user || user.Role !== "HEAD") throw new Error("Head access required.");
}

function requireDepartment(user) {
  if (!user || (user.Role !== "DEPARTMENT" && user.Role !== "DEPT")) throw new Error("Department access required.");
}

function getDepartmentDashboardData(departmentId, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireDepartment(user);
    if (user.DepartmentID !== departmentId) throw new Error("You can only view your own department.");
    const dept = findBy_("Departments", "DepartmentID", departmentId);
    const requests = getMyFundRequestsRaw_(departmentId);
    const ledger = getMyLedgerRaw_(departmentId);
    const assigned = getAssignedTransferRequestsRaw_(departmentId);
    const transactions = getTransactionsForDepartment_(departmentId);
    const totalReceived = ledger.reduce((sum, row) => sum + moneyNumber_(row.Credit), 0);
    const totalSent = ledger.reduce((sum, row) => sum + moneyNumber_(row.Debit), 0);
    return ok({
      user: user,
      department: dept,
      summary: {
        balance: moneyNumber_(dept.CurrentBalance),
        totalReceived: totalReceived,
        totalSent: totalSent,
        pending: requests.filter(r => r.Status === "Pending").length,
        approved: requests.filter(r => r.Status === "Approved").length,
        rejected: requests.filter(r => r.Status === "Rejected").length,
        transferred: requests.filter(r => r.Status === "Transferred").length
      },
      requests: requests,
      assignedTransfers: assigned,
      ledger: ledger,
      transactions: transactions
    });
  } catch (error) {
    return fail(error.message);
  }
}

function createFundRequest(departmentId, amount, purpose, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireDepartment(user);
    if (user.DepartmentID !== departmentId) throw new Error("Invalid department request.");
    const numericAmount = numeric_(amount);
    if (numericAmount <= 0) throw new Error("Amount must be greater than 0.");
    if (!String(purpose || "").trim()) throw new Error("Purpose cannot be empty.");
    const dept = findBy_("Departments", "DepartmentID", departmentId);
    const requestId = generateId("REQ");
    appendObject_("FundRequests", {
      RequestID: requestId,
      RequestedByDepartmentID: departmentId,
      RequestedByDepartmentName: dept.DepartmentName,
      RequestedAmount: numericAmount,
      Purpose: String(purpose).trim(),
      RequestDate: getTimestamp(),
      Status: "Pending"
    });
    logAudit(user.UserID, user.Name, "CREATE_REQUEST", "FundRequests", requestId, "Requested " + numericAmount + " for " + purpose + ".");
    return ok({ RequestID: requestId });
  } catch (error) {
    return fail(error.message);
  }
}

function getMyFundRequests(departmentId, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireDepartment(user);
    if (user.DepartmentID !== departmentId) throw new Error("Access denied.");
    return ok(getMyFundRequestsRaw_(departmentId));
  } catch (error) {
    return fail(error.message);
  }
}

function getMyFundRequestsRaw_(departmentId) {
  return sheetToObjects_("FundRequests").filter(row => row.RequestedByDepartmentID === departmentId);
}

function getMyLedger(departmentId, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireDepartment(user);
    if (user.DepartmentID !== departmentId) throw new Error("Access denied.");
    return ok(getMyLedgerRaw_(departmentId));
  } catch (error) {
    return fail(error.message);
  }
}

function getMyLedgerRaw_(departmentId) {
  return sheetToObjects_("Ledger").filter(row => row.DepartmentID === departmentId);
}

function getAssignedTransferRequests(departmentId, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireDepartment(user);
    if (user.DepartmentID !== departmentId) throw new Error("Access denied.");
    return ok(getAssignedTransferRequestsRaw_(departmentId));
  } catch (error) {
    return fail(error.message);
  }
}

function getAssignedTransferRequestsRaw_(departmentId) {
  return sheetToObjects_("FundRequests").filter(row =>
    row.AssignedSenderDepartmentID === departmentId && row.Status === "Approved"
  );
}

function markRequestTransferred(requestId, loggedInDepartmentId, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireDepartment(user);
    if (user.DepartmentID !== loggedInDepartmentId) throw new Error("Access denied.");
    return processTransfer(requestId, loggedInDepartmentId, user);
  } catch (error) {
    return fail(error.message);
  }
}

function getHeadDashboardData(sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireHead(user);
    const departments = getAllDepartmentsRaw_();
    const requests = getAllFundRequestsRaw_();
    const transactions = getAllTransactionsRaw_();
    const ledger = getAllLedgerEntriesRaw_();
    return ok({
      user: user,
      totalBalance: departments.reduce((sum, row) => sum + moneyNumber_(row.CurrentBalance), 0),
      departments: departments,
      requests: requests,
      pending: requests.filter(r => r.Status === "Pending"),
      approved: requests.filter(r => r.Status === "Approved"),
      rejected: requests.filter(r => r.Status === "Rejected"),
      transferred: requests.filter(r => r.Status === "Transferred"),
      transactions: transactions,
      ledger: ledger
    });
  } catch (error) {
    return fail(error.message);
  }
}

function getPendingRequests(sessionToken) {
  return headList_(sessionToken, () => getAllFundRequestsRaw_().filter(r => r.Status === "Pending"));
}

function getApprovedRequests(sessionToken) {
  return headList_(sessionToken, () => getAllFundRequestsRaw_().filter(r => r.Status === "Approved"));
}

function getRejectedRequests(sessionToken) {
  return headList_(sessionToken, () => getAllFundRequestsRaw_().filter(r => r.Status === "Rejected"));
}

function getTransferredRequests(sessionToken) {
  return headList_(sessionToken, () => getAllFundRequestsRaw_().filter(r => r.Status === "Transferred"));
}

function headList_(sessionToken, producer) {
  try {
    const user = validateSession(sessionToken);
    requireHead(user);
    return ok(producer());
  } catch (error) {
    return fail(error.message);
  }
}

function approveFundRequest(requestId, senderDepartmentId, approvedBy, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireHead(user);
    const request = findBy_("FundRequests", "RequestID", requestId);
    if (!request) throw new Error("Request not found.");
    if (request.Status !== "Pending") throw new Error("Only pending requests can be approved.");
    const sender = findBy_("Departments", "DepartmentID", senderDepartmentId);
    if (!sender) throw new Error("Sender department not found.");
    if (sender.DepartmentID === request.RequestedByDepartmentID) throw new Error("Sender and receiver cannot be same.");
    if (moneyNumber_(sender.CurrentBalance) < moneyNumber_(request.RequestedAmount)) throw new Error("Sender has insufficient balance.");
    updateRow_("FundRequests", request._row, {
      Status: "Approved",
      ApprovedBy: approvedBy || user.Name,
      ApprovedDate: getTimestamp(),
      AssignedSenderDepartmentID: sender.DepartmentID,
      AssignedSenderDepartmentName: sender.DepartmentName
    });
    logAudit(user.UserID, user.Name, "APPROVE_REQUEST", "FundRequests", requestId, "Approved and assigned sender " + sender.DepartmentName + ".");
    return ok(true);
  } catch (error) {
    return fail(error.message);
  }
}

function rejectFundRequest(requestId, reason, rejectedBy, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireHead(user);
    if (!String(reason || "").trim()) throw new Error("Rejection reason is required.");
    const request = findBy_("FundRequests", "RequestID", requestId);
    if (!request) throw new Error("Request not found.");
    if (request.Status !== "Pending") throw new Error("Only pending requests can be rejected.");
    updateRow_("FundRequests", request._row, {
      Status: "Rejected",
      RejectedReason: String(reason).trim()
    });
    logAudit(user.UserID, user.Name, "REJECT_REQUEST", "FundRequests", requestId, "Rejected: " + reason + ".");
    return ok(true);
  } catch (error) {
    return fail(error.message);
  }
}

function getAllDepartments(sessionToken) {
  return headList_(sessionToken, getAllDepartmentsRaw_);
}

function getAllTransactions(sessionToken) {
  return headList_(sessionToken, getAllTransactionsRaw_);
}

function getAllLedgerEntries(sessionToken) {
  return headList_(sessionToken, getAllLedgerEntriesRaw_);
}

function getAllFundRequests(sessionToken) {
  return headList_(sessionToken, getAllFundRequestsRaw_);
}

function getAllDepartmentsRaw_() {
  return sheetToObjects_("Departments");
}

function getAllTransactionsRaw_() {
  return sheetToObjects_("Transactions");
}

function getAllLedgerEntriesRaw_() {
  return sheetToObjects_("Ledger");
}

function getAllFundRequestsRaw_() {
  return sheetToObjects_("FundRequests");
}

function validateTransfer(request, senderDepartmentId) {
  if (!request) throw new Error("Request not found.");
  if (request.Status !== "Approved") throw new Error("Only approved requests can be transferred.");
  if (request.AssignedSenderDepartmentID !== senderDepartmentId) throw new Error("This request is assigned to another department.");
  if (request.AssignedSenderDepartmentID === request.RequestedByDepartmentID) throw new Error("Sender and receiver cannot be same.");
  const sender = findBy_("Departments", "DepartmentID", senderDepartmentId);
  if (!sender) throw new Error("Sender department not found.");
  if (moneyNumber_(sender.CurrentBalance) < moneyNumber_(request.RequestedAmount)) throw new Error("Sender has insufficient balance.");
  return sender;
}

function moneyNumber_(value) {
  if (typeof value === "number") return value;
  const cleaned = String(value || "0").replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function processTransfer(requestId, senderDepartmentId, user) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  let transactionRow = null;
  const ledgerRows = [];
  let senderOriginal = null;
  let receiverOriginal = null;
  let sender = null;
  let receiver = null;
  try {
    const request = findBy_("FundRequests", "RequestID", requestId);
    sender = validateTransfer(request, senderDepartmentId);
    receiver = findBy_("Departments", "DepartmentID", request.RequestedByDepartmentID);
    if (!receiver) throw new Error("Receiver department not found.");

    const amount = moneyNumber_(request.RequestedAmount);
    senderOriginal = moneyNumber_(sender.CurrentBalance);
    receiverOriginal = moneyNumber_(receiver.CurrentBalance);
    const senderNew = senderOriginal - amount;
    const receiverNew = receiverOriginal + amount;

    updateDepartmentBalance(sender.DepartmentID, senderNew);
    updateDepartmentBalance(receiver.DepartmentID, receiverNew);

    const txId = generateId("TXN");
    addTransaction({
      TransactionID: txId,
      RequestID: requestId,
      FromDepartmentID: sender.DepartmentID,
      FromDepartmentName: sender.DepartmentName,
      ToDepartmentID: receiver.DepartmentID,
      ToDepartmentName: receiver.DepartmentName,
      Amount: amount,
      TransactionDate: getTimestamp(),
      ApprovedBy: request.ApprovedBy,
      Status: "Completed",
      Remarks: "Fund transferred for request " + requestId
    });
    transactionRow = getSheet("Transactions").getLastRow();

    addLedgerEntry({
      LedgerID: generateId("LED"),
      DepartmentID: sender.DepartmentID,
      DepartmentName: sender.DepartmentName,
      TransactionID: txId,
      Date: getTimestamp(),
      Type: "Fund Sent",
      Debit: amount,
      Credit: 0,
      BalanceAfterTransaction: senderNew,
      Description: "Fund sent to " + receiver.DepartmentName + " for RequestID " + requestId
    });
    ledgerRows.push(getSheet("Ledger").getLastRow());

    addLedgerEntry({
      LedgerID: generateId("LED"),
      DepartmentID: receiver.DepartmentID,
      DepartmentName: receiver.DepartmentName,
      TransactionID: txId,
      Date: getTimestamp(),
      Type: "Fund Received",
      Debit: 0,
      Credit: amount,
      BalanceAfterTransaction: receiverNew,
      Description: "Fund received from " + sender.DepartmentName + " for RequestID " + requestId
    });
    ledgerRows.push(getSheet("Ledger").getLastRow());

    updateRow_("FundRequests", request._row, {
      Status: "Transferred",
      TransferredDate: getTimestamp(),
      TransferredBy: sender.DepartmentName
    });
    logAudit(user.UserID, user.Name, "TRANSFERRED", "FundRequests", requestId, sender.DepartmentName + " transferred " + amount + " to " + receiver.DepartmentName + ".");
    return ok(true);
  } catch (error) {
    try {
      ledgerRows.sort((a, b) => b - a).forEach(row => getSheet("Ledger").deleteRow(row));
      if (sender && senderOriginal !== null) updateDepartmentBalance(sender.DepartmentID, senderOriginal);
      if (receiver && receiverOriginal !== null) updateDepartmentBalance(receiver.DepartmentID, receiverOriginal);
      if (transactionRow) getSheet("Transactions").deleteRow(transactionRow);
    } catch (rollbackError) {
      logAudit(user.UserID, user.Name, "ROLLBACK_FAILED", "FundRequests", requestId, rollbackError.message);
    }
    return fail(error.message);
  } finally {
    lock.releaseLock();
  }
}

function updateDepartmentBalance(departmentId, newBalance) {
  const dept = findBy_("Departments", "DepartmentID", departmentId);
  if (!dept) throw new Error("Department not found.");
  updateRow_("Departments", dept._row, { CurrentBalance: Number(newBalance), UpdatedAt: getTimestamp() });
}

function addTransaction(data) {
  appendObject_("Transactions", data);
}

function addLedgerEntry(data) {
  appendObject_("Ledger", data);
}

function getTransactionsForDepartment_(departmentId) {
  return sheetToObjects_("Transactions").filter(row =>
    row.FromDepartmentID === departmentId || row.ToDepartmentID === departmentId
  );
}

function generateDepartmentReport(departmentId, startDate, endDate, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    if (!user) throw new Error("Login required.");
    const selectedDepartmentId = departmentId || "";
    if (user.Role !== "HEAD" && user.DepartmentID !== selectedDepartmentId) throw new Error("Access denied.");
    let rows = filterByDate_(getAllLedgerEntriesRaw_(), "Date", startDate, endDate);
    if (user.Role === "HEAD" && selectedDepartmentId) rows = rows.filter(row => row.DepartmentID === selectedDepartmentId);
    if (user.Role !== "HEAD") rows = rows.filter(row => row.DepartmentID === user.DepartmentID);
    return ok({ title: "Department Ledger Report - " + (selectedDepartmentId || "All Departments"), rows: rows });
  } catch (error) {
    return fail(error.message);
  }
}

function generateTransactionReport(startDate, endDate, departmentId, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    if (!user) throw new Error("Login required.");
    let rows = filterByDate_(getAllTransactionsRaw_(), "TransactionDate", startDate, endDate);
    if (departmentId) rows = rows.filter(row => row.FromDepartmentID === departmentId || row.ToDepartmentID === departmentId);
    if (user.Role !== "HEAD") rows = rows.filter(row => row.FromDepartmentID === user.DepartmentID || row.ToDepartmentID === user.DepartmentID);
    return ok({ title: "Transaction Report", rows: rows });
  } catch (error) {
    return fail(error.message);
  }
}

function generateBalanceSummaryReport(sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireHead(user);
    return ok({ title: "Balance Summary Report", rows: getAllDepartmentsRaw_() });
  } catch (error) {
    return fail(error.message);
  }
}

function generateRequestStatusReport(status, sessionToken) {
  try {
    const user = validateSession(sessionToken);
    requireHead(user);
    const rows = getAllFundRequestsRaw_().filter(row => !status || row.Status === status);
    return ok({ title: "Request Status Report - " + (status || "All"), rows: rows });
  } catch (error) {
    return fail(error.message);
  }
}

function filterByDate_(rows, key, startDate, endDate) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate + "T23:59:59") : null;
  return rows.filter(row => {
    const date = new Date(row[key]);
    return (!start || date >= start) && (!end || date <= end);
  });
}

function logAudit(userId, userName, action, entityType, entityId, description) {
  try {
    appendObject_("AuditLog", {
      LogID: generateId("LOG"),
      UserID: userId,
      UserName: userName,
      Action: action,
      EntityType: entityType,
      EntityID: entityId,
      Description: description,
      Timestamp: getTimestamp()
    });
  } catch (error) {
    console.warn("Audit log skipped: " + error.message);
  }
}

function setupSheets() {
  const ss = getSpreadsheet_();
  Object.keys(SHEETS).forEach(name => {
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    sheet.clear();
    sheet.getRange(1, 1, 1, SHEETS[name].length).setValues([SHEETS[name]]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, SHEETS[name].length);
  });
  seedDepartments();
  seedUsers();
  seedSampleBalances();
}

function seedDepartments() {
  const now = getTimestamp();
  DEPARTMENTS.forEach(([id, name]) => {
    appendObject_("Departments", {
      DepartmentID: id,
      DepartmentName: name,
      CurrentBalance: 0,
      HeadName: "",
      Status: "Active",
      CreatedAt: now,
      UpdatedAt: now
    });
  });
}

function seedUsers() {
  appendObject_("Users", {
    UserID: "U-HEAD",
    Name: "Head Department",
    Role: "HEAD",
    DepartmentID: "",
    DepartmentName: "HEAD DEPARTMENT",
    LoginID: "HEAD",
    Password: "1234",
    Status: "Active"
  });
  DEPARTMENTS.forEach(([departmentId, departmentName, loginId], index) => {
    appendObject_("Users", {
      UserID: "U" + String(index + 1).padStart(3, "0"),
      Name: departmentName,
      Role: "DEPARTMENT",
      DepartmentID: departmentId,
      DepartmentName: departmentName,
      LoginID: loginId,
      Password: "1234",
      Status: "Active"
    });
  });
}

function seedSampleBalances() {
  getAllDepartmentsRaw_().forEach((dept, index) => {
    updateDepartmentBalance(dept.DepartmentID, 10000 + index * 1000);
  });
}


/* =========================
   BROWSER FRONTEND SCRIPT
   ========================= */
const app = {
  token: localStorage.getItem("fundSessionToken") || "",
  user: null,
  departments: [],
  currentAction: null
};

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", init);

function init() {
  $("loginButton").addEventListener("click", login);
  $("loginPassword").addEventListener("keydown", event => {
    if (event.key === "Enter") login();
  });
  document.querySelectorAll(".logout-button").forEach(button => button.addEventListener("click", logout));
  document.querySelectorAll("[data-scroll]").forEach(button => {
    button.addEventListener("click", () => document.querySelector(button.dataset.scroll).scrollIntoView({ behavior: "smooth" }));
  });
  $("requestFundButton").addEventListener("click", createRequest);
  $("refreshDept").addEventListener("click", loadDepartmentDashboard);
  $("refreshHead").addEventListener("click", loadHeadDashboard);
  $("actionCancel").addEventListener("click", closeModal);
  $("actionConfirm").addEventListener("click", confirmAction);
  $("departmentReportButton").addEventListener("click", departmentReport);
  $("transactionReportButton").addEventListener("click", transactionReport);
  $("balanceReportButton").addEventListener("click", balanceReport);
  $("statusReportButton").addEventListener("click", statusReport);

  if (app.token) {
    server("getCurrentUser", [app.token], (res) => {
      if (res.success) {
        app.user = res.data;
        showDashboard();
      } else {
        localStorage.removeItem("fundSessionToken");
        showLogin();
      }
    });
  } else {
    showLogin();
  }
}

function server(fn, args, onSuccess) {
  if (!window.google || !google.script || !google.script.run) {
    setLoading(true);
    localServer(fn, args || [])
      .then((res) => {
        setLoading(false);
        onSuccess(res);
      })
      .catch((err) => {
        setLoading(false);
        toast(err.message || err);
      });
    return;
  }
  setLoading(true);
  google.script.run
    .withSuccessHandler((res) => {
      setLoading(false);
      onSuccess(res);
    })
    .withFailureHandler((err) => {
      setLoading(false);
      toast(err.message || err);
    })[fn](...(args || []));
}

async function localServer(fn, args) {
  if (fn === "loginUser") return localLoginUser(args[0], args[1]);
  if (fn === "getCurrentUser") return localGetCurrentUser();
  if (fn === "logoutUser") return localLogoutUser();
  if (fn === "getDepartmentDashboardData") return localDepartmentDashboard(args[0]);
  if (fn === "getHeadDashboardData") return localHeadDashboard();
  if (fn === "generateDepartmentReport") return localDepartmentReport(args[0], args[1], args[2]);
  if (fn === "generateTransactionReport") return localTransactionReport(args[0], args[1], args[2]);
  if (fn === "generateBalanceSummaryReport") return localBalanceSummaryReport();
  if (fn === "generateRequestStatusReport") return localRequestStatusReport(args[0]);
  return { success: false, message: "This published CSV database is read-only. Use an editable Google Sheet ID for saving requests, approvals, transfers, and ledger entries." };
}

async function localLoginUser(loginId, password) {
  const users = await clientCsvObjects("Users");
  const login = String(loginId || "").trim().toUpperCase();
  const pass = String(password || "");
  const user = users.find(row => {
    const candidates = [row.LoginID, row.LogID, row.UserID].filter(Boolean).map(value => String(value).trim().toUpperCase());
    const status = String(row.Status || "Active").trim().toLowerCase();
    return candidates.includes(login) && String(row.Password) === pass && status === "active";
  });
  if (!user) return { success: false, message: "Invalid LoginID or Password in published Users CSV." };
  const safeUser = clientNormalizeUser(user);
  app.token = "LOCAL-" + Date.now();
  localStorage.setItem("fundSessionToken", app.token);
  localStorage.setItem("fundSessionUser", JSON.stringify(safeUser));
  return { success: true, data: { sessionToken: app.token, user: safeUser } };
}

async function localGetCurrentUser() {
  const raw = localStorage.getItem("fundSessionUser");
  return raw ? { success: true, data: JSON.parse(raw) } : { success: false, message: "Session expired. Please login again." };
}

async function localLogoutUser() {
  localStorage.removeItem("fundSessionUser");
  localStorage.removeItem("fundSessionToken");
  return { success: true, data: true };
}

async function localDepartmentDashboard(departmentId) {
  const [departments, requests, ledger, transactions] = await Promise.all([
    clientCsvObjects("Departments"),
    clientCsvObjects("FundRequests"),
    clientCsvObjects("Ledger"),
    clientCsvObjects("Transactions")
  ]);
  const dept = departments.find(row => row.DepartmentID === departmentId) || { DepartmentID: departmentId, DepartmentName: app.user.DepartmentName, CurrentBalance: 0 };
  const myRequests = requests.filter(row => row.RequestedByDepartmentID === departmentId);
  const myLedger = ledger.filter(row => row.DepartmentID === departmentId);
  const assigned = requests.filter(row => row.AssignedSenderDepartmentID === departmentId && row.Status === "Approved");
  const myTransactions = transactions.filter(row => row.FromDepartmentID === departmentId || row.ToDepartmentID === departmentId);
  return {
    success: true,
    data: {
      user: app.user,
      department: dept,
      summary: {
        balance: parseMoneyClient(dept.CurrentBalance),
        totalReceived: myLedger.reduce((sum, row) => sum + parseMoneyClient(row.Credit), 0),
        totalSent: myLedger.reduce((sum, row) => sum + parseMoneyClient(row.Debit), 0),
        pending: myRequests.filter(row => row.Status === "Pending").length,
        approved: myRequests.filter(row => row.Status === "Approved").length,
        rejected: myRequests.filter(row => row.Status === "Rejected").length,
        transferred: myRequests.filter(row => row.Status === "Transferred").length
      },
      requests: myRequests,
      assignedTransfers: assigned,
      ledger: myLedger,
      transactions: myTransactions
    }
  };
}

async function localHeadDashboard() {
  const [departments, requests, transactions, ledger] = await Promise.all([
    clientCsvObjects("Departments"),
    clientCsvObjects("FundRequests"),
    clientCsvObjects("Transactions"),
    clientCsvObjects("Ledger")
  ]);
  return {
    success: true,
    data: {
      user: app.user,
      totalBalance: departments.reduce((sum, row) => sum + parseMoneyClient(row.CurrentBalance), 0),
      departments,
      requests,
      pending: requests.filter(row => row.Status === "Pending"),
      approved: requests.filter(row => row.Status === "Approved"),
      rejected: requests.filter(row => row.Status === "Rejected"),
      transferred: requests.filter(row => row.Status === "Transferred"),
      transactions,
      ledger
    }
  };
}

async function localDepartmentReport(departmentId, startDate, endDate) {
  let rows = await clientCsvObjects("Ledger");
  if (departmentId) rows = rows.filter(row => row.DepartmentID === departmentId);
  rows = clientFilterByDate(rows, "Date", startDate, endDate);
  return { success: true, data: { title: `Department Ledger Report - ${departmentId || "All Departments"}`, rows } };
}

async function localTransactionReport(startDate, endDate, departmentId) {
  let rows = await clientCsvObjects("Transactions");
  if (departmentId) rows = rows.filter(row => row.FromDepartmentID === departmentId || row.ToDepartmentID === departmentId);
  rows = clientFilterByDate(rows, "TransactionDate", startDate, endDate);
  return { success: true, data: { title: "Transaction Report", rows } };
}

async function localBalanceSummaryReport() {
  return { success: true, data: { title: "Balance Summary Report", rows: await clientCsvObjects("Departments") } };
}

async function localRequestStatusReport(status) {
  let rows = await clientCsvObjects("FundRequests");
  if (status) rows = rows.filter(row => row.Status === status);
  return { success: true, data: { title: `Request Status Report - ${status || "All"}`, rows } };
}

async function clientCsvObjects(sheetName) {
  const url = `${PUBLISHED_BASE_CSV_URL}?gid=${PUBLISHED_SHEET_GIDS[sheetName]}&single=true&output=csv`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${sheetName} CSV.`);
  const rows = parseCsvText(await response.text());
  if (rows.length < 2) return [];
  const headers = rows[0].map(header => String(header).trim());
  return rows.slice(1).filter(row => row.some(cell => cell !== "")).map((row, index) => {
    const obj = { _row: index + 2 };
    headers.forEach((header, i) => obj[header] = row[i] || "");
    return obj;
  });
}

function parseCsvText(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function clientNormalizeUser(user) {
  const rawRole = String(user.Role || "").trim().toUpperCase();
  const role = rawRole === "HEAD" ? "HEAD" : "DEPARTMENT";
  return {
    UserID: user.UserID,
    Name: user.Name || user.DepartmentName || user.LoginID,
    Role: role,
    DepartmentID: user.DepartmentID || "",
    DepartmentName: user.DepartmentName || (role === "HEAD" ? "HEAD" : ""),
    LoginID: user.LoginID || user.UserID,
    Status: user.Status || "Active"
  };
}

function parseMoneyClient(value) {
  const cleaned = String(value || "0").replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function clientFilterByDate(rows, key, startDate, endDate) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
  return rows.filter(row => {
    if (!row[key]) return true;
    const date = new Date(row[key]);
    return (!start || date >= start) && (!end || date <= end);
  });
}

function setLoading(isLoading) {
  document.body.classList.toggle("loading", isLoading);
}

function login() {
  $("loginAlert").hidden = true;
  const loginId = $("loginId").value.trim();
  const password = $("loginPassword").value;
  server("loginUser", [loginId, password], (res) => {
    if (!res.success) return showLoginAlert(res.message);
    app.token = res.data.sessionToken;
    app.user = res.data.user;
    localStorage.setItem("fundSessionToken", app.token);
    showDashboard();
  });
}

function logout() {
  server("logoutUser", [app.token], () => {
    localStorage.removeItem("fundSessionToken");
    app.token = "";
    app.user = null;
    showLogin();
  });
}

function showLogin() {
  $("loginView").hidden = false;
  $("departmentView").hidden = true;
  $("headView").hidden = true;
}

function showDashboard() {
  $("loginView").hidden = true;
  if (app.user.Role === "HEAD") {
    $("headView").hidden = false;
    $("departmentView").hidden = true;
    loadHeadDashboard();
  } else {
    $("departmentView").hidden = false;
    $("headView").hidden = true;
    loadDepartmentDashboard();
  }
}

function showLoginAlert(message) {
  $("loginAlert").textContent = message;
  $("loginAlert").hidden = false;
}

function loadDepartmentDashboard() {
  server("getDepartmentDashboardData", [app.user.DepartmentID, app.token], (res) => {
    if (!res.success) return toast(res.message);
    const data = res.data;
    $("deptTitle").textContent = data.department.DepartmentName;
    $("deptSidebarName").textContent = data.department.DepartmentName;
    renderCards("deptSummary", [
      ["Current Balance", money(data.summary.balance)],
      ["Funds Received", money(data.summary.totalReceived)],
      ["Funds Sent", money(data.summary.totalSent)],
      ["Pending", data.summary.pending],
      ["Approved", data.summary.approved],
      ["Rejected", data.summary.rejected],
      ["Transferred", data.summary.transferred]
    ]);
    renderTable("myRequestsTable", data.requests, ["RequestID", "RequestedAmount", "Purpose", "RequestDate", "Status", "ApprovedBy", "ApprovedDate", "RejectedReason", "AssignedSenderDepartmentName", "TransferredDate"]);
    renderAssignedTransfers(data.assignedTransfers);
    renderTable("myTransactionsTable", data.transactions, ["TransactionID", "RequestID", "FromDepartmentName", "ToDepartmentName", "Amount", "TransactionDate", "ApprovedBy", "Status", "Remarks"]);
    renderTable("myLedgerTable", data.ledger, ["LedgerID", "Date", "Type", "Debit", "Credit", "BalanceAfterTransaction", "Description"]);
  });
}

function createRequest() {
  server("createFundRequest", [app.user.DepartmentID, $("requestAmount").value, $("requestPurpose").value, app.token], (res) => {
    if (!res.success) return toast(res.message);
    $("requestAmount").value = "";
    $("requestPurpose").value = "";
    toast("Fund request created.");
    loadDepartmentDashboard();
  });
}

function renderAssignedTransfers(rows) {
  const mapped = rows.map(row => ({
    ...row,
    Action: `<button onclick="markTransferred('${esc(row.RequestID)}')" type="button">Transferred</button>`
  }));
  renderTable("assignedTransfersTable", mapped, ["RequestID", "RequestedByDepartmentName", "RequestedAmount", "Purpose", "ApprovedBy", "ApprovedDate", "Status", "Action"], true);
}

window.markTransferred = function(requestId) {
  if (!confirm("Confirm that this fund has been transferred?")) return;
  server("markRequestTransferred", [requestId, app.user.DepartmentID, app.token], (res) => {
    if (!res.success) return toast(res.message);
    toast("Transfer completed.");
    loadDepartmentDashboard();
  });
};

function loadHeadDashboard() {
  server("getHeadDashboardData", [app.token], (res) => {
    if (!res.success) return toast(res.message);
    const data = res.data;
    app.departments = data.departments;
    renderCards("headSummary", [
      ["Total School Balance", money(data.totalBalance)],
      ["Pending", data.pending.length],
      ["Approved", data.approved.length],
      ["Rejected", data.rejected.length],
      ["Transferred", data.transferred.length]
    ]);
    renderTable("departmentBalancesTable", data.departments, ["DepartmentID", "DepartmentName", "CurrentBalance", "Status", "UpdatedAt"]);
    renderPendingRequests(data.pending);
    renderTable("approvedRequestsTable", data.approved, ["RequestID", "RequestedByDepartmentName", "RequestedAmount", "Purpose", "ApprovedBy", "ApprovedDate", "AssignedSenderDepartmentName", "Status"]);
    renderTable("rejectedRequestsTable", data.rejected, ["RequestID", "RequestedByDepartmentName", "RequestedAmount", "Purpose", "RequestDate", "RejectedReason", "Status"]);
    renderTable("transferredRequestsTable", data.transferred, ["RequestID", "RequestedByDepartmentName", "AssignedSenderDepartmentName", "RequestedAmount", "Purpose", "TransferredDate", "TransferredBy", "Status"]);
    renderTable("allRequestsTable", data.requests, ["RequestID", "RequestedByDepartmentName", "RequestedAmount", "Purpose", "RequestDate", "Status", "ApprovedBy", "AssignedSenderDepartmentName", "TransferredDate"]);
    renderTable("allTransactionsTable", data.transactions, ["TransactionID", "RequestID", "FromDepartmentName", "ToDepartmentName", "Amount", "TransactionDate", "ApprovedBy", "Status", "Remarks"]);
    renderTable("globalLedgerTable", data.ledger, ["LedgerID", "DepartmentName", "TransactionID", "Date", "Type", "Debit", "Credit", "BalanceAfterTransaction", "Description"]);
    renderReportDepartmentOptions(data.departments);
  });
}

function renderPendingRequests(rows) {
  const mapped = rows.map(row => ({
    ...row,
    Action: `<button onclick="openApprove('${esc(row.RequestID)}')" type="button">Approve</button> <button class="secondary" onclick="openReject('${esc(row.RequestID)}')" type="button">Reject</button>`
  }));
  renderTable("pendingRequestsTable", mapped, ["RequestID", "RequestedByDepartmentName", "RequestedAmount", "Purpose", "RequestDate", "Status", "Action"], true);
}

window.openApprove = function(requestId) {
  app.currentAction = { type: "approve", requestId };
  $("actionModalTitle").textContent = "Approve Request";
  $("actionModalBody").innerHTML = `<label>Sender Department<select id="senderDepartment">${app.departments.map(d => `<option value="${esc(d.DepartmentID)}">${esc(d.DepartmentName)} - ${money(d.CurrentBalance)}</option>`).join("")}</select></label>`;
  $("actionModal").hidden = false;
};

window.openReject = function(requestId) {
  app.currentAction = { type: "reject", requestId };
  $("actionModalTitle").textContent = "Reject Request";
  $("actionModalBody").innerHTML = `<label>Rejection Reason<textarea id="rejectReason" rows="4"></textarea></label>`;
  $("actionModal").hidden = false;
};

function closeModal() {
  $("actionModal").hidden = true;
  app.currentAction = null;
}

function confirmAction() {
  if (!app.currentAction) return;
  if (app.currentAction.type === "approve") {
    server("approveFundRequest", [app.currentAction.requestId, $("senderDepartment").value, app.user.Name, app.token], (res) => {
      if (!res.success) return toast(res.message);
      closeModal();
      toast("Request approved.");
      loadHeadDashboard();
    });
    return;
  }

  server("rejectFundRequest", [app.currentAction.requestId, $("rejectReason").value, app.user.Name, app.token], (res) => {
    if (!res.success) return toast(res.message);
    closeModal();
    toast("Request rejected.");
    loadHeadDashboard();
  });
}

function renderCards(id, cards) {
  $(id).innerHTML = cards.map(([text, value]) => `<div class="summary-card"><span>${esc(text)}</span><strong>${value}</strong></div>`).join("");
}

function renderTable(id, rows, columns, html = false) {
  if (!rows || rows.length === 0) {
    $(id).innerHTML = "<p>No records found.</p>";
    return;
  }
  $(id).innerHTML = `<table><thead><tr>${columns.map(c => `<th>${esc(label(c))}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${columns.map(c => `<td>${html && c === "Action" ? row[c] : formatCell(c, row[c])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function formatCell(key, value) {
  if (key === "Status") return statusBadge(value);
  if (["CurrentBalance", "RequestedAmount", "Amount", "Debit", "Credit", "BalanceAfterTransaction"].includes(key)) return money(value);
  return esc(value ?? "");
}

function statusBadge(status) {
  const cls = `status-${String(status).toLowerCase()}`;
  return `<span class="badge ${cls}">${esc(status)}</span>`;
}

function label(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).trim();
}

function money(value) {
  return `Rs. ${moneyNumber_(value).toFixed(2)}`;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]));
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  setTimeout(() => {
    $("toast").hidden = true;
  }, 3500);
}

function renderReportDepartmentOptions(departments) {
  $("reportDepartment").innerHTML = `<option value="">All Departments</option>` + departments.map(d => `<option value="${esc(d.DepartmentID)}">${esc(d.DepartmentName)}</option>`).join("");
}

function departmentReport() {
  server("generateDepartmentReport", [$("reportDepartment").value, $("reportStart").value, $("reportEnd").value, app.token], renderReport);
}

function transactionReport() {
  server("generateTransactionReport", [$("reportStart").value, $("reportEnd").value, $("reportDepartment").value, app.token], renderReport);
}

function balanceReport() {
  server("generateBalanceSummaryReport", [app.token], renderReport);
}

function statusReport() {
  server("generateRequestStatusReport", [$("reportStatus").value, app.token], renderReport);
}

function renderReport(res) {
  if (!res.success) return toast(res.message);
  const rows = res.data.rows || [];
  const cols = rows[0] ? Object.keys(rows[0]).filter(k => k !== "_row") : [];
  $("reportOutput").innerHTML = `<div class="button-row"><button onclick="window.print()" type="button">Print Report</button></div><h3>${esc(res.data.title)}</h3><div class="table-wrap">${rows.length ? `<table><thead><tr>${cols.map(c => `<th>${esc(label(c))}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${formatCell(c, r[c])}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "<p>No records found.</p>"}</div>`;
}

