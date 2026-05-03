/* ============================================================
   BOKAKHAT CHITRAKALA BIDYALAY - SHEET-DRIVEN FEE PAYMENT

   Google Sheet schema:
   Class | Monthly Fee | Admission Fee

   Publish the sheet as CSV:
   File > Share > Publish to web > choose sheet tab > CSV
   Then paste the CSV URL in CONFIG.sheetCsvUrl below.
   ============================================================ */

const CONFIG = {
  // Live Chitrakala fee sheet. If you change the sheet, publish it as CSV and replace this URL.
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQvEWGbxPuu0kLUlqMhJTxUca_XTEaGO_vtnADLBvbLrBvIzdJ9yzL2URnnWgl0j3mwPRfPD4PHAZQ/pub?gid=0&single=true&output=csv",

  // Payment form opened after fee type, class, and amount are selected.
  paymentUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdVSKJ6d3q2nDeG4Sxg6-UDI0BNyrkQv1niGUve-uSJdOC1Jg/viewform?usp=header",

  // Optional: replace these with Google Form entry IDs if you want prefilled values.
  paymentPrefillFields: {
    className: "",
    feeType: "",
    amount: ""
  }
};

const state = {
  rows: [],
  feeTypes: [],
  selectedFeeType: "",
  selectedClass: "",
  selectedAmount: ""
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  initializeFeePage();
});

function cacheElements() {
  elements.feeType = document.getElementById("feeType");
  elements.classType = document.getElementById("classType");
  elements.amountDisplay = document.getElementById("amountDisplay");
  elements.payBtn = document.getElementById("payBtn");
  elements.feeStatus = document.getElementById("feeStatus");
  elements.feeSheetTable = document.getElementById("feeSheetTable");
  elements.selectedClass = document.getElementById("selectedClass");
  elements.selectedFeeType = document.getElementById("selectedFeeType");
  elements.feeAmount = document.getElementById("feeAmount");
}

function bindEvents() {
  elements.feeType.addEventListener("change", handleFeeTypeChange);
  elements.classType.addEventListener("change", handleClassChange);
  elements.payBtn.addEventListener("click", handlePaymentClick);
}

async function initializeFeePage() {
  setStatus("Loading fee structure...", "loading");
  resetSelections();

  try {
    const rows = await loadFeeRows();
    applyRows(rows);
    setStatus("Fee structure loaded. Select a fee type to continue.", "success");
  } catch (error) {
    console.error("Chitrakala fee sheet could not be loaded:", error);
    clearFeeData();
    setStatus("Fee structure could not be loaded from Google Sheets. Please check the published sheet URL.", "error");
  }
}

async function loadFeeRows() {
  if (!CONFIG.sheetCsvUrl || CONFIG.sheetCsvUrl.includes("PASTE_YOUR")) {
    throw new Error("Google Sheet CSV URL is not configured.");
  }

  const response = await fetch(CONFIG.sheetCsvUrl, {
    method: "GET",
    headers: { Accept: "text/csv" }
  });

  if (!response.ok) {
    throw new Error(`Sheet request failed with status ${response.status}`);
  }

  const csvText = await response.text();
  const table = parseCSV(csvText);

  if (table.length < 2) {
    throw new Error("Sheet is empty or missing data rows.");
  }

  return normalizeSheetRows(table);
}

function applyRows(rows) {
  state.rows = rows;
  state.feeTypes = extractFeeTypes(rows);

  renderFeeTypeOptions();
  renderFeeTable();

  elements.feeType.disabled = state.feeTypes.length === 0;
  elements.feeType.innerHTML = state.feeTypes.length
    ? '<option value="">-- Select Fee Type --</option>' + state.feeTypes.map((type) => optionHTML(type.key, type.label)).join("")
    : '<option value="">No fee types available</option>';
}

function clearFeeData() {
  state.rows = [];
  state.feeTypes = [];
  state.selectedFeeType = "";
  state.selectedClass = "";
  state.selectedAmount = "";

  elements.feeType.disabled = true;
  elements.feeType.innerHTML = '<option value="">Fee data unavailable</option>';
  elements.classType.disabled = true;
  elements.classType.innerHTML = '<option value="">-- Select Class --</option>';
  elements.feeSheetTable.innerHTML = '<p class="error-message">Unable to load fee data from Google Sheets.</p>';
  hideAmountAndPayment();
}

function normalizeSheetRows(table) {
  const headers = table[0].map((header) => header.trim()).filter(Boolean);
  const classIndex = headers.findIndex((header) => normalizeKey(header) === "class");

  if (classIndex === -1) {
    throw new Error('Sheet must include a "Class" column.');
  }

  const feeColumns = headers
    .map((header, index) => ({ label: header, key: normalizeKey(header), index }))
    .filter((column) => column.index !== classIndex);

  const rows = table.slice(1).map((row) => {
    const className = (row[classIndex] || "").trim();
    const fees = {};

    feeColumns.forEach((column) => {
      fees[column.key] = (row[column.index] || "").trim();
    });

    return { className, fees };
  }).filter((row) => row.className);

  if (rows.length === 0) {
    throw new Error("No valid class rows found in sheet.");
  }

  return rows;
}

function extractFeeTypes(rows) {
  const feeMap = new Map();

  rows.forEach((row) => {
    Object.keys(row.fees).forEach((key) => {
      if (!feeMap.has(key)) {
        feeMap.set(key, labelFromKey(key));
      }
    });
  });

  return Array.from(feeMap, ([key, label]) => ({ key, label }));
}

function renderFeeTypeOptions() {
  elements.feeType.innerHTML = '<option value="">-- Select Fee Type --</option>';
  state.feeTypes.forEach((feeType) => {
    elements.feeType.insertAdjacentHTML("beforeend", optionHTML(feeType.key, feeType.label));
  });
}

function renderClassOptions(feeTypeKey) {
  const availableRows = state.rows.filter((row) => hasValidAmount(row.fees[feeTypeKey]));

  elements.classType.innerHTML = '<option value="">-- Select Class --</option>';

  availableRows.forEach((row) => {
    elements.classType.insertAdjacentHTML("beforeend", optionHTML(row.className, row.className));
  });

  elements.classType.disabled = availableRows.length === 0;

  if (availableRows.length === 0) {
    elements.classType.innerHTML = '<option value="">No classes available</option>';
    setStatus("No classes have an amount for the selected fee type.", "error");
  }
}

function renderFeeTable() {
  if (state.rows.length === 0 || state.feeTypes.length === 0) {
    elements.feeSheetTable.innerHTML = '<p class="error-message">No fee data available.</p>';
    return;
  }

  const headerCells = [
    "<th>Class</th>",
    ...state.feeTypes.map((feeType) => `<th>${escapeHTML(feeType.label)}</th>`)
  ].join("");

  const bodyRows = state.rows.map((row) => {
    const feeCells = state.feeTypes.map((feeType) => {
      const value = row.fees[feeType.key];
      return `<td>${escapeHTML(formatAmount(value))}</td>`;
    }).join("");

    return `<tr><td>${escapeHTML(row.className)}</td>${feeCells}</tr>`;
  }).join("");

  elements.feeSheetTable.innerHTML = `
    <table class="fee-sheet-table">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}

function handleFeeTypeChange() {
  state.selectedFeeType = elements.feeType.value;
  state.selectedClass = "";
  state.selectedAmount = "";

  hideAmountAndPayment();

  if (!state.selectedFeeType) {
    elements.classType.disabled = true;
    elements.classType.innerHTML = '<option value="">-- Select Class --</option>';
    setStatus("Select a fee type to load available classes.", "success");
    return;
  }

  renderClassOptions(state.selectedFeeType);
  setStatus("Class list loaded. Select a class to view the amount.", "success");
}

function handleClassChange() {
  state.selectedClass = elements.classType.value;
  state.selectedAmount = "";
  hideAmountAndPayment();

  if (!state.selectedFeeType || !state.selectedClass) {
    return;
  }

  const row = state.rows.find((item) => item.className === state.selectedClass);
  const amount = row ? row.fees[state.selectedFeeType] : "";

  if (!hasValidAmount(amount)) {
    setStatus("Amount is not available for this selection.", "error");
    return;
  }

  state.selectedAmount = amount;
  showAmountAndPayment();
  setStatus("Amount found. You can proceed to payment.", "success");
}

function showAmountAndPayment() {
  const feeTypeLabel = getFeeTypeLabel(state.selectedFeeType);

  elements.selectedClass.textContent = `Class: ${state.selectedClass}`;
  elements.selectedFeeType.textContent = `Type: ${feeTypeLabel}`;
  elements.feeAmount.textContent = formatAmount(state.selectedAmount);

  elements.amountDisplay.hidden = false;
  elements.payBtn.hidden = false;
}

function hideAmountAndPayment() {
  elements.amountDisplay.hidden = true;
  elements.payBtn.hidden = true;
  elements.selectedClass.textContent = "";
  elements.selectedFeeType.textContent = "";
  elements.feeAmount.textContent = "";
}

function handlePaymentClick() {
  if (!state.selectedClass || !state.selectedFeeType || !state.selectedAmount) {
    setStatus("Please select fee type and class before payment.", "error");
    return;
  }

  if (!CONFIG.paymentUrl || CONFIG.paymentUrl.includes("PASTE_YOUR")) {
    setStatus("Payment link is not configured. Paste your payment URL in chitrakala.js.", "error");
    return;
  }

  window.open(buildPaymentUrl(), "_blank", "noopener,noreferrer");
}

function buildPaymentUrl() {
  const url = new URL(CONFIG.paymentUrl);
  const fields = CONFIG.paymentPrefillFields;

  if (fields.className) url.searchParams.set(fields.className, state.selectedClass);
  if (fields.feeType) url.searchParams.set(fields.feeType, getFeeTypeLabel(state.selectedFeeType));
  if (fields.amount) url.searchParams.set(fields.amount, formatAmount(state.selectedAmount));

  return url.toString();
}

function resetSelections() {
  elements.feeType.disabled = true;
  elements.feeType.innerHTML = '<option value="">Loading fee types...</option>';
  elements.classType.disabled = true;
  elements.classType.innerHTML = '<option value="">-- Select Class --</option>';
  hideAmountAndPayment();
}

function setStatus(message, type) {
  elements.feeStatus.textContent = message;
  elements.feeStatus.classList.remove("success", "error");

  if (type === "success") elements.feeStatus.classList.add("success");
  if (type === "error") elements.feeStatus.classList.add("error");
}

function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        field += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);

  return rows;
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s*fee\s*/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function labelFromKey(key) {
  return key
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") + " Fee";
}

function getFeeTypeLabel(key) {
  const feeType = state.feeTypes.find((item) => item.key === key);
  return feeType ? feeType.label : labelFromKey(key);
}

function hasValidAmount(amount) {
  const value = String(amount || "").trim().toLowerCase();
  return Boolean(value && value !== "n/a" && value !== "na" && value !== "-");
}

function formatAmount(amount) {
  const value = String(amount || "").trim();

  if (!hasValidAmount(value)) {
    return "N/A";
  }

  if (/^(rs\.?|₹)/i.test(value)) {
    return value;
  }

  return `₹${value}`;
}

function optionHTML(value, label) {
  return `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`;
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}
