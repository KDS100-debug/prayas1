(function () {
  const STUDENT_DETAILS_SHEETS = {
    bokakhat: {
      label: "Bokakhat Jatiya Bidyalay",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQoNbpVzKmBkNX_OYKYqOb96nKO2KJIOl-lRyu0rYrV5vMgTGqNkHcMFK0ILid2Vgx13MdhamM1jXJX/pub?gid=0&single=true&output=csv"
    },
    brahmaputra: {
      label: "Brahmaputra Jatiya Bidyalay",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSjvLGr6JH7hBTizrFyzJbvstF7ye2tx5C3115ZgpHKErwG-AP0dckJcc3blJeI1LoQ5rdnWwG23cbq/pub?gid=0&single=true&output=csv"
    },
    mohuramukh: {
      label: "Mohuramukh Jatiya Bidyalay",
      url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTK_4jKxfizTsnzqJC_F56lqTBi2wpgL1qxDW4wMvFzW6UD1EcB8xeWs8IT1aGMQViKTAVJ8BDVUy1R/pub?gid=0&single=true&output=csv"
    }
  };

  const FIELD_ALIASES = {
    admissionDate: ["ADMISSIONDATE"],
    studentId: ["STUDENTID"],
    name: ["NAME", "STUDENTNAME", "FULLNAME"],
    fatherName: ["FATHERNAME"],
    motherName: ["MOTHERNAME"],
    phoneNumber: ["PHONENUMBER", "PHONE", "MOBILE"],
    email: ["EMAIL"],
    className: ["CLASS", "CLASSNAME"],
    rollNumber: ["ROLLNUMBER", "ROLLNO", "ROLL"],
    dateOfBirth: ["DATEOFBIRTH", "DOB"],
    gender: ["GENDER"],
    caste: ["CASTE", "CATEGORY"],
    address: ["ADDRESS"],
    aadharNumber: ["AADHARNUMBER", "AADHAARNUMBER"]
  };

  const EXPORT_COLUMNS = [
    { key: "admissionDate", label: "Admission Date" },
    { key: "studentId", label: "Student ID" },
    { key: "name", label: "Name" },
    { key: "fatherName", label: "Father Name" },
    { key: "motherName", label: "Mother Name" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "email", label: "Email" },
    { key: "className", label: "Class" },
    { key: "rollNumber", label: "Roll Number" },
    { key: "dateOfBirth", label: "Date of Birth" },
    { key: "gender", label: "Gender" },
    { key: "caste", label: "Caste" },
    { key: "address", label: "Address" },
    { key: "aadharNumber", label: "Aadhar Number" }
  ];

  let currentAdmin = null;
  let fieldIndexes = {};
  let studentRows = [];
  let filteredRows = [];

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function compactHeader(value) {
    return String(value || "").replace(/^\uFEFF/, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function parseCSV(csvText) {
    const rows = [];
    let row = [];
    let field = "";
    let insideQuotes = false;

    for (let index = 0; index < csvText.length; index += 1) {
      const character = csvText[index];
      const nextCharacter = csvText[index + 1];

      if (character === '"') {
        if (insideQuotes && nextCharacter === '"') {
          field += '"';
          index += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (character === "," && !insideQuotes) {
        row.push(field.trim());
        field = "";
      } else if ((character === "\n" || character === "\r") && !insideQuotes) {
        if (character === "\r" && nextCharacter === "\n") index += 1;
        row.push(field.trim());
        if (row.some((cell) => cell)) rows.push(row);
        row = [];
        field = "";
      } else {
        field += character;
      }
    }

    row.push(field.trim());
    if (row.some((cell) => cell)) rows.push(row);
    return rows;
  }

  function mapFields(headers) {
    const headerMap = {};
    headers.forEach((header, index) => {
      headerMap[compactHeader(header)] = index;
    });

    fieldIndexes = {};
    Object.keys(FIELD_ALIASES).forEach((fieldName) => {
      const match = FIELD_ALIASES[fieldName].find((alias) => Object.prototype.hasOwnProperty.call(headerMap, alias));
      fieldIndexes[fieldName] = match ? headerMap[match] : -1;
    });
  }

  function getCell(row, fieldName) {
    const index = fieldIndexes[fieldName];
    if (index === undefined || index < 0) return "";
    return String(row[index] || "").trim();
  }

  function shapeRow(row) {
    return {
      admissionDate: getCell(row, "admissionDate"),
      studentId: getCell(row, "studentId"),
      name: getCell(row, "name"),
      fatherName: getCell(row, "fatherName"),
      motherName: getCell(row, "motherName"),
      phoneNumber: getCell(row, "phoneNumber"),
      email: getCell(row, "email"),
      className: getCell(row, "className"),
      rollNumber: getCell(row, "rollNumber"),
      dateOfBirth: getCell(row, "dateOfBirth"),
      gender: getCell(row, "gender"),
      caste: getCell(row, "caste"),
      address: getCell(row, "address"),
      aadharNumber: getCell(row, "aadharNumber")
    };
  }

  function setStatus(message, type) {
    const status = $("admin-student-status");
    if (!status) return;
    status.textContent = message;
    status.className = `admin-student-status${type ? ` ${type}` : ""}`;
  }

  function setCount(count) {
    const countEl = $("admin-student-record-count");
    if (countEl) countEl.textContent = `${count} ${count === 1 ? "record" : "records"}`;
  }

  function renderRows(rows) {
    const body = $("admin-student-results");
    if (!body) return;

    filteredRows = rows.slice();
    setCount(rows.length);

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="14" class="admin-student-empty">No matching student details found.</td></tr>';
      return;
    }

    body.innerHTML = rows.map((row) => `
      <tr>
        <td>${escapeHTML(row.admissionDate || "-")}</td>
        <td>${escapeHTML(row.studentId || "-")}</td>
        <td>${escapeHTML(row.name || "-")}</td>
        <td>${escapeHTML(row.fatherName || "-")}</td>
        <td>${escapeHTML(row.motherName || "-")}</td>
        <td>${escapeHTML(row.phoneNumber || "-")}</td>
        <td>${escapeHTML(row.email || "-")}</td>
        <td>${escapeHTML(row.className || "-")}</td>
        <td>${escapeHTML(row.rollNumber || "-")}</td>
        <td>${escapeHTML(row.dateOfBirth || "-")}</td>
        <td>${escapeHTML(row.gender || "-")}</td>
        <td>${escapeHTML(row.caste || "-")}</td>
        <td>${escapeHTML(row.address || "-")}</td>
        <td>${escapeHTML(row.aadharNumber || "-")}</td>
      </tr>
    `).join("");
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function matches(value, filter) {
    const normalizedFilter = normalize(filter);
    if (!normalizedFilter) return true;
    return normalize(value).includes(normalizedFilter);
  }

  function filterRows() {
    const nameFilter = $("admin-student-name")?.value || "";
    const classFilter = $("admin-student-class")?.value || "";
    const casteFilter = $("admin-student-caste")?.value || "";
    const results = studentRows.filter((row) => (
      matches(row.name, nameFilter) &&
      matches(row.className, classFilter) &&
      matches(row.caste, casteFilter)
    ));

    renderRows(results);
    setStatus("Search complete.", "success");
  }

  function getSelectedSource() {
    const selectedSchool = $("admin-student-school")?.value || "bokakhat";
    return {
      key: STUDENT_DETAILS_SHEETS[selectedSchool] ? selectedSchool : "bokakhat",
      source: STUDENT_DETAILS_SHEETS[selectedSchool] || STUDENT_DETAILS_SHEETS.bokakhat
    };
  }

  async function loadStudentDetails() {
    if (!currentAdmin) {
      hideSection();
      return;
    }

    const { source } = getSelectedSource();
    studentRows = [];
    filteredRows = [];
    setCount(0);
    setStatus(`Loading ${source.label} student details...`);
    $("admin-student-results").innerHTML = '<tr><td colspan="14" class="admin-student-empty">Loading student details...</td></tr>';

    try {
      const response = await fetch(source.url, { cache: "no-store" });
      if (!response.ok) throw new Error("Student details could not be loaded.");

      const rows = parseCSV(await response.text());
      if (!rows.length) throw new Error("Student details sheet has no headers.");

      mapFields(rows[0]);
      studentRows = rows.slice(1).map(shapeRow);
      renderRows(studentRows);
      setStatus(`Loaded ${studentRows.length} ${source.label} student records.`, "success");
    } catch (error) {
      studentRows = [];
      filteredRows = [];
      renderRows([]);
      setStatus(error.message || "Unable to load student details.", "error");
    }
  }

  function populateSchoolSelect() {
    const schoolSelect = $("admin-student-school");
    if (!schoolSelect || !currentAdmin) return;

    const allowedSchool = currentAdmin.role !== "superadmin" ? currentAdmin.school : "";
    const schools = Object.entries(STUDENT_DETAILS_SHEETS).filter(([schoolKey]) => !allowedSchool || schoolKey === allowedSchool);
    schoolSelect.innerHTML = schools.map(([schoolKey, source]) => (
      `<option value="${escapeHTML(schoolKey)}">${escapeHTML(source.label)}</option>`
    )).join("");
    schoolSelect.value = allowedSchool || "bokakhat";
    schoolSelect.disabled = Boolean(allowedSchool);
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function downloadCSV() {
    if (!filteredRows.length) {
      setStatus("No filtered student details to download.", "error");
      return;
    }

    const { key } = getSelectedSource();
    const headers = EXPORT_COLUMNS.map((column) => column.label);
    const rows = filteredRows.map((row) => EXPORT_COLUMNS.map((column) => row[column.key] || ""));
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `${key}-student-details-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    setStatus(`Downloaded ${filteredRows.length} filtered student records.`, "success");
  }

  function showSection(admin) {
    const section = $("admin-student-details-section");
    const message = $("admin-student-access-message");
    if (!section || !admin || !["superadmin", "school-admin"].includes(admin.role)) return;

    currentAdmin = admin;
    section.hidden = false;
    section.setAttribute("aria-hidden", "false");
    if (message) message.textContent = `Logged in as ${admin.displayName}. Student details are available below.`;
    populateSchoolSelect();
    loadStudentDetails();
  }

  function hideSection() {
    const section = $("admin-student-details-section");
    if (section) {
      section.hidden = true;
      section.setAttribute("aria-hidden", "true");
    }
    currentAdmin = null;
    studentRows = [];
    filteredRows = [];
    setCount(0);
    setStatus("Student details are locked.");
    const body = $("admin-student-results");
    if (body) body.innerHTML = '<tr><td colspan="14" class="admin-student-empty">Login as an admin to view student details.</td></tr>';
  }

  function init() {
    const section = $("admin-student-details-section");
    const form = $("admin-student-filter-form");
    const schoolSelect = $("admin-student-school");
    const clearButton = $("admin-student-clear");
    const reloadButton = $("admin-student-reload");
    const downloadButton = $("admin-student-download");
    if (!section || !form || !schoolSelect || !clearButton || !reloadButton || !downloadButton) return;

    hideSection();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      filterRows();
    });

    schoolSelect.addEventListener("change", loadStudentDetails);
    clearButton.addEventListener("click", () => {
      ["admin-student-name", "admin-student-class", "admin-student-caste"].forEach((id) => {
        const input = $(id);
        if (input) input.value = "";
      });
      renderRows(studentRows);
      setStatus("Filters cleared.");
    });
    reloadButton.addEventListener("click", loadStudentDetails);
    downloadButton.addEventListener("click", downloadCSV);

    document.addEventListener("prayas:admin-login", (event) => {
      showSection(event.detail);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
