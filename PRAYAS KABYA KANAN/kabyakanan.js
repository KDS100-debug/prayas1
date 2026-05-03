const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvXyxA7qptLf4u2DbwQIkl58EkZNMz5bvUP5E1Y9zjfAly0xh5F_MApaLZfpy3LUsMq0SJQ2OxgxFg/pub?gid=0&single=true&output=csv";
const SHEET_PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(SHEET_CSV_URL)}`;
const PAYMENT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc8MHN_Pldg2NKVdrKNSjCByeUctjd7pTorGG5lIc1hLWlrQw/viewform?usp=publish-editor";

const LOCAL_SHEET_SNAPSHOT = `CLASS,MONTHLY FEE
PP-1,Rs. 50.00
PP-2,Rs. 50.00
PP-3,Rs. 50.00
PRIMARY,Rs. 50.00
1ST YEAR,Rs. 100.00
2ND YEAR,Rs. 100.00
3RD YEAR,Rs. 100.00
4TH YEAR,Rs. 100.00
5TH YEAR,Rs. 100.00
6TH YEAR,Rs. 100.00
7TH YEAR,Rs. 100.00`;

const state = {
  rows: [],
  selectedClass: "",
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  elements.classSelect = document.getElementById("classSelect");
  elements.sheetStatus = document.getElementById("sheetStatus");
  elements.sheetTable = document.getElementById("sheetTable");
  elements.amountCard = document.getElementById("amountCard");
  elements.selectionSummary = document.getElementById("selectionSummary");
  elements.feeAmount = document.getElementById("feeAmount");
  elements.payButton = document.getElementById("payButton");

  elements.classSelect.addEventListener("change", handleClassChange);
  elements.payButton.addEventListener("click", handlePaymentClick);

  loadSheet();
});

async function loadSheet() {
  setStatus("Loading sheet...", "");
  hideAmount();

  try {
    const { csvText, source } = await fetchSheetCsv();
    const table = parseCSV(csvText);
    normalizeRows(table);
    renderTable(table);
    renderClassOptions();
    setStatus(source === "snapshot" ? "Using saved sheet copy. Select a class." : "Sheet loaded. Select a class.", "success");
  } catch (error) {
    console.error(error);
    elements.classSelect.innerHTML = '<option value="">Unable to load classes</option>';
    elements.classSelect.disabled = true;
    elements.sheetTable.innerHTML = '<p class="error-message">Unable to load Kabya Kanan fee data from Google Sheets.</p>';
    setStatus("Could not load Google Sheet.", "error");
  }
}

async function fetchSheetCsv() {
  const directResult = await tryFetchCsv(SHEET_CSV_URL);
  if (directResult) return { csvText: directResult, source: "direct" };

  const proxyResult = await tryFetchCsv(SHEET_PROXY_URL);
  if (proxyResult) return { csvText: proxyResult, source: "proxy" };

  return { csvText: LOCAL_SHEET_SNAPSHOT, source: "snapshot" };
}

async function tryFetchCsv(url) {
  try {
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "text/csv" } });
    if (!response.ok) return "";
    const text = await response.text();
    return text.toUpperCase().includes("CLASS") ? text : "";
  } catch (error) {
    console.warn("Sheet fetch failed:", url, error);
    return "";
  }
}

function normalizeRows(table) {
  if (table.length < 2) throw new Error("Sheet has no data rows.");

  const headers = table[0].map((header) => header.trim());
  const classIndex = findHeaderIndex(headers, "class");
  const monthlyFeeIndex = findHeaderIndex(headers, "monthly fee");

  if (classIndex === -1) throw new Error("CLASS column is missing.");
  if (monthlyFeeIndex === -1) throw new Error("MONTHLY FEE column is missing.");

  state.rows = table.slice(1).map((row) => ({
    className: (row[classIndex] || "").trim(),
    monthlyFee: (row[monthlyFeeIndex] || "").trim(),
  })).filter((row) => row.className);
}

function renderClassOptions() {
  elements.classSelect.innerHTML = '<option value="">-- Select Class --</option>';

  state.rows.forEach((row) => {
    elements.classSelect.insertAdjacentHTML("beforeend", optionHTML(row.className, row.className));
  });

  elements.classSelect.disabled = state.rows.length === 0;
}

function renderTable(table) {
  const headers = table[0];
  const bodyRows = table.slice(1);

  const thead = headers.map((header) => `<th>${escapeHTML(header)}</th>`).join("");
  const tbody = bodyRows.map((row) => {
    return `<tr>${headers.map((_, index) => `<td>${escapeHTML(formatAmount(row[index] || ""))}</td>`).join("")}</tr>`;
  }).join("");

  elements.sheetTable.innerHTML = `
    <table class="fee-table">
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody}</tbody>
    </table>
  `;
}

function handleClassChange() {
  state.selectedClass = elements.classSelect.value;
  hideAmount();

  if (!state.selectedClass) {
    setStatus("Select a class.", "success");
    return;
  }

  const selectedRow = state.rows.find((row) => row.className === state.selectedClass);
  if (!selectedRow || !hasAmount(selectedRow.monthlyFee)) {
    setStatus("No amount found for this class.", "error");
    return;
  }

  elements.selectionSummary.textContent = `Class: ${selectedRow.className}. Monthly Fee:`;
  elements.feeAmount.textContent = formatAmount(selectedRow.monthlyFee);
  elements.amountCard.hidden = false;
  elements.payButton.hidden = false;
  setStatus("Amount found.", "success");
}

function hideAmount() {
  elements.amountCard.hidden = true;
  elements.payButton.hidden = true;
  elements.selectionSummary.textContent = "";
  elements.feeAmount.textContent = "";
}

function handlePaymentClick() {
  if (!state.selectedClass) {
    setStatus("Please select class before payment.", "error");
    return;
  }

  window.open(PAYMENT_URL, "_blank", "noopener,noreferrer");
}

function setStatus(message, type) {
  elements.sheetStatus.textContent = message;
  elements.sheetStatus.classList.remove("success", "error");
  if (type) elements.sheetStatus.classList.add(type);
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

function findHeaderIndex(headers, name) {
  return headers.findIndex((header) => normalizeKey(header) === normalizeKey(name));
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function hasAmount(value) {
  const text = String(value || "").trim().toLowerCase();
  return Boolean(text && text !== "n/a" && text !== "na" && text !== "-");
}

function formatAmount(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = text.replace(/\u00e2\u0082\u00b9/g, "Rs. ").replace(/\u20b9/g, "Rs. ");
  if (/^(rs\.?|inr)/i.test(normalized)) return normalized;
  if (/^\d/.test(normalized)) return `Rs. ${normalized}`;
  return normalized;
}

function optionHTML(value, label) {
  return `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`;
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}
