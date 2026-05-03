const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZNUjZAYo6L2LvkaesPOppT2X_X2gs_R6PcOIVHXq6b4-NDJD3GH64bDp6i5fO7wblttWOLLf3uZqN/pub?gid=0&single=true&output=csv";
const SHEET_PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(SHEET_CSV_URL)}`;
const PAYMENT_URL = "https://docs.google.com/forms/d/e/1FAIpQLScErICeisE8GTs0_vDnELUWZEkK-v5KL7cypqDA0oSaMonIjw/viewform?usp=header";

const LOCAL_SHEET_SNAPSHOT = `CLASS,INSTRUMENT,MONTHLY FEE,ADMISSION FEE
PP-I,TABLA,500.00,700.00
PP-II,TABLA,500.00,700.00
PRATHAMA,TABLA,500.00,700.00
MADHYAMA PART-1,TABLA,500.00,700.00
MADHYAMA PART-2,TABLA,500.00,700.00
VISHARAD PART-1,TABLA,500.00,700.00
VISHARAD PART-2,TABLA,500.00,700.00
PP-I,VOCAL,500.00,700.00
PP-II,VOCAL,500.00,700.00
PRATHAMA,VOCAL,500.00,700.00
MADHYAMA PART-1,VOCAL,500.00,700.00
MADHYAMA PART-2,VOCAL,500.00,700.00
VISHARAD PART-1,VOCAL,500.00,700.00
VISHARAD PART-2,VOCAL,500.00,700.00
PP-I,VIOLIN,500.00,700.00
PP-II,VIOLIN,500.00,700.00
PRATHAMA,VIOLIN,500.00,700.00
MADHYAMA PART-1,VIOLIN,500.00,700.00
MADHYAMA PART-2,VIOLIN,500.00,700.00
VISHARAD PART-1,VIOLIN,500.00,700.00
VISHARAD PART-2,VIOLIN,500.00,700.00
PP-I,SATTRIYA,500.00,700.00
PP-II,SATTRIYA,500.00,700.00
PRATHAMA,SATTRIYA,500.00,700.00
MADHYAMA PART-1,SATTRIYA,500.00,700.00
MADHYAMA PART-2,SATTRIYA,500.00,700.00
VISHARAD PART-1,SATTRIYA,500.00,700.00
VISHARAD PART-2,SATTRIYA,500.00,700.00`;

const state = {
  rows: [],
  feeTypes: [],
  selectedClass: "",
  selectedFeeType: ""
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  elements.classSelect = document.getElementById("classSelect");
  elements.feeTypeSelect = document.getElementById("feeTypeSelect");
  elements.sheetStatus = document.getElementById("sheetStatus");
  elements.sheetTable = document.getElementById("sheetTable");
  elements.amountCard = document.getElementById("amountCard");
  elements.selectionSummary = document.getElementById("selectionSummary");
  elements.feeAmount = document.getElementById("feeAmount");
  elements.payButton = document.getElementById("payButton");

  elements.classSelect.addEventListener("change", handleClassChange);
  elements.feeTypeSelect.addEventListener("change", handleFeeTypeChange);
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
    elements.feeTypeSelect.innerHTML = '<option value="">Unavailable</option>';
    elements.classSelect.disabled = true;
    elements.feeTypeSelect.disabled = true;
    elements.sheetTable.innerHTML = '<p class="error-message">Unable to load Sangeet fee data from Google Sheets.</p>';
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
    return text.includes("CLASS") ? text : "";
  } catch (error) {
    console.warn("Sheet fetch failed:", url, error);
    return "";
  }
}

function normalizeRows(table) {
  if (table.length < 2) throw new Error("Sheet has no data rows.");

  const headers = table[0].map((header) => header.trim());
  const classIndex = findHeaderIndex(headers, "class");
  const instrumentIndex = findHeaderIndex(headers, "instrument");

  if (classIndex === -1) throw new Error("CLASS column is missing.");

  const feeColumns = headers
    .map((label, index) => ({ label, key: normalizeKey(label), index }))
    .filter((column) => column.index !== classIndex && column.index !== instrumentIndex);

  state.rows = table.slice(1).map((row) => {
    const fees = {};
    feeColumns.forEach((column) => {
      fees[column.key] = (row[column.index] || "").trim();
    });

    return {
      className: (row[classIndex] || "").trim(),
      instrument: instrumentIndex === -1 ? "" : (row[instrumentIndex] || "").trim(),
      fees
    };
  }).filter((row) => row.className);

  state.feeTypes = feeColumns.map((column) => ({
    key: column.key,
    label: column.label
  }));
}

function renderClassOptions() {
  const classNames = [...new Set(state.rows.map((row) => row.className))];

  elements.classSelect.innerHTML = '<option value="">-- Select Class --</option>';
  classNames.forEach((className) => {
    elements.classSelect.insertAdjacentHTML("beforeend", optionHTML(className, className));
  });

  elements.classSelect.disabled = classNames.length === 0;
  elements.feeTypeSelect.disabled = true;
  elements.feeTypeSelect.innerHTML = '<option value="">Select class first</option>';
}

function renderFeeTypeOptions() {
  const rowsForClass = state.rows.filter((row) => row.className === state.selectedClass);
  const availableTypes = state.feeTypes.filter((feeType) => {
    return rowsForClass.some((row) => hasAmount(row.fees[feeType.key]));
  });

  elements.feeTypeSelect.innerHTML = '<option value="">-- Select Fee Type --</option>';
  availableTypes.forEach((feeType) => {
    elements.feeTypeSelect.insertAdjacentHTML("beforeend", optionHTML(feeType.key, feeType.label));
  });

  elements.feeTypeSelect.disabled = availableTypes.length === 0;
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
  state.selectedFeeType = "";
  hideAmount();

  if (!state.selectedClass) {
    elements.feeTypeSelect.disabled = true;
    elements.feeTypeSelect.innerHTML = '<option value="">Select class first</option>';
    setStatus("Select a class.", "success");
    return;
  }

  renderFeeTypeOptions();
  setStatus("Now select a fee type.", "success");
}

function handleFeeTypeChange() {
  state.selectedFeeType = elements.feeTypeSelect.value;
  hideAmount();

  if (!state.selectedClass || !state.selectedFeeType) return;

  const rowsForClass = state.rows.filter((row) => row.className === state.selectedClass);
  const amounts = [...new Set(rowsForClass.map((row) => row.fees[state.selectedFeeType]).filter(hasAmount))];
  const instruments = rowsForClass.map((row) => row.instrument).filter(Boolean);

  if (amounts.length === 0) {
    setStatus("No amount found for this selection.", "error");
    return;
  }

  const feeTypeLabel = getFeeTypeLabel(state.selectedFeeType);
  const amountText = amounts.length === 1 ? formatAmount(amounts[0]) : amounts.map(formatAmount).join(" / ");
  const instrumentText = instruments.length ? ` Instruments: ${[...new Set(instruments)].join(", ")}.` : "";

  elements.selectionSummary.textContent = `Class: ${state.selectedClass}. Fee Type: ${feeTypeLabel}.${instrumentText}`;
  elements.feeAmount.textContent = amountText;
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
  if (!state.selectedClass || !state.selectedFeeType) {
    setStatus("Please select class and fee type before payment.", "error");
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
    .replace(/\s*fee\s*/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getFeeTypeLabel(key) {
  const feeType = state.feeTypes.find((item) => item.key === key);
  return feeType ? feeType.label : key;
}

function hasAmount(value) {
  const text = String(value || "").trim().toLowerCase();
  return Boolean(text && text !== "n/a" && text !== "na" && text !== "-");
}

function formatAmount(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^(rs\.?|₹)/i.test(text)) return text;
  if (/^\d/.test(text)) return `₹${text}`;
  return text;
}

function optionHTML(value, label) {
  return `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`;
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}
