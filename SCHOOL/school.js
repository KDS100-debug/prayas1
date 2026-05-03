// School data with sheet URLs
const schoolSheets = {
  bokakhat: {
    name: "Bokakhat Jatiya Bidyalaya",
    iframe: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRnsSrQcl2zaBoUJmEMCt-nfXb9cOySewd8NJVOrx3T2LZmcXLIVjNeawXx60wjqMw6xH5pBwfGeMFE/pubhtml?gid=0&single=true",
    csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRnsSrQcl2zaBoUJmEMCt-nfXb9cOySewd8NJVOrx3T2LZmcXLIVjNeawXx60wjqMw6xH5pBwfGeMFE/pub?gid=0&single=true&output=csv",
    paymentForm: "https://docs.google.com/forms/d/e/1FAIpQLSdgu-ufGQ3jgq5I7TIt_EyXFg5zE6TIB_k-BOTvU6ExYX3ERw/viewform?usp=header"
  },
  brahmaputra: {
    name: "Brahmaputra Jatiya Bidyalaya",
    iframe: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRnsSrQcl2zaBoUJmEMCt-nfXb9cOySewd8NJVOrx3T2LZmcXLIVjNeawXx60wjqMw6xH5pBwfGeMFE/pubhtml?gid=0&single=true",
    csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRnsSrQcl2zaBoUJmEMCt-nfXb9cOySewd8NJVOrx3T2LZmcXLIVjNeawXx60wjqMw6xH5pBwfGeMFE/pub?gid=0&single=true&output=csv",
    paymentForm: "https://docs.google.com/forms/d/e/1FAIpQLSf4_TAq-aFbUKZrb7AawrvQVGdTdtSjjsQUHqu8cmjtG-BVwg/viewform?usp=header"
  },
  mohuramukh: {
    name: "Mohuramukh Jatiya Bidyalaya",
    iframe: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-f7w1L-P2QS3y4eqCMg-vEOyJ8C_vpW5pdoMmYcTJN2Tr7VD06bxBYaU6Fxq-XCv1S3R4kfoexJQe/pubhtml?gid=0&single=true",
    csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR-f7w1L-P2QS3y4eqCMg-vEOyJ8C_vpW5pdoMmYcTJN2Tr7VD06bxBYaU6Fxq-XCv1S3R4kfoexJQe/pub?gid=0&single=true&output=csv",
    paymentForm: "https://docs.google.com/forms/d/e/1FAIpQLSeo7pKTGKffakhVcygqMaG6pCfCgklUgrE3UBJNLTPSWcvk4Q/viewform?usp=header"
  }
};
schoolSheets.braghmaputra = schoolSheets.brahmaputra;

// Notification sheets
const notificationSheets = {
  bokakhat: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBb677M3RDJJFXunBiToYZayYrkoncuvWB5cyBxkCphM0BX6JHvWVV5PM5klyVaYBn586r47vS6aKI/pub?gid=283068528&single=true&output=csv",
  brahmaputra: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBb677M3RDJJFXunBiToYZayYrkoncuvWB5cyBxkCphM0BX6JHvWVV5PM5klyVaYBn586r47vS6aKI/pub?gid=0&single=true&output=csv",
  mohuramukh: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBb677M3RDJJFXunBiToYZayYrkoncuvWB5cyBxkCphM0BX6JHvWVV5PM5klyVaYBn586r47vS6aKI/pub?gid=2144609581&single=true&output=csv"
};
notificationSheets.braghmaputra = notificationSheets.brahmaputra;

const RANKERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ73qhhOy_IpRxrWWoFt-33Uar8VmcVNFlYsSAkdmex6jlyai6cC866p3Cin232ujjP9B5Y7DEhbDSU/pub?gid=0&single=true&output=csv";

// Store parsed sheet data for fee lookup
let feeData = {};
let rankerData = [];

// CSV Parser - Handles quoted values and commas
function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      }
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Fetch and parse CSV data from Google Sheets
async function fetchSchoolData(csvUrl) {
  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('Error fetching CSV:', error);
    return null;
  }
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function renderCellContent(value) {
  const text = String(value ?? '').trim();
  const urlPattern = /https?:\/\/[^\s<>"']+/g;
  let lastIndex = 0;
  let html = '';
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    const url = match[0].replace(/[),.;]+$/, '');
    const trailingText = match[0].slice(url.length);

    html += escapeHTML(text.slice(lastIndex, match.index));
    html += `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">Open Link</a>`;
    html += escapeHTML(trailingText);
    lastIndex = match.index + match[0].length;
  }

  html += escapeHTML(text.slice(lastIndex));
  return html;
}

function renderCsvTable(rows, container, emptyMessage) {
  const visibleRows = rows
    .map(row => row.map(cell => cell.trim()))
    .filter(row => row.some(Boolean));

  if (visibleRows.length === 0) {
    container.innerHTML = `<p class="data-empty">${escapeHTML(emptyMessage)}</p>`;
    return;
  }

  const headerRow = visibleRows[0];
  const bodyRows = visibleRows.slice(1);
  const hasBodyRows = bodyRows.length > 0;

  const tableHead = `
    <thead>
      <tr>${headerRow.map(cell => `<th>${escapeHTML(cell || 'Details')}</th>`).join('')}</tr>
    </thead>
  `;
  const tableBodyRows = (hasBodyRows ? bodyRows : [headerRow]).map(row => `
    <tr>${headerRow.map((_, index) => `<td>${renderCellContent(row[index] || '')}</td>`).join('')}</tr>
  `).join('');
  const tableHeadMarkup = hasBodyRows ? tableHead : '';

  container.innerHTML = `
    <div class="data-table-wrap">
      <table class="data-table">
        ${tableHeadMarkup}
        <tbody>${tableBodyRows}</tbody>
      </table>
    </div>
  `;
}

function renderNotificationTable(rows, container) {
  renderCsvTable(rows, container, 'No notifications found for this school.');
}

function getColumnIndex(headerRow, columnName) {
  return headerRow.findIndex(header => String(header || '').trim().toLowerCase() === columnName.toLowerCase());
}

function renderRankers(selectedYear = '') {
  const rankerResults = document.getElementById('ranker-results');
  if (!rankerResults) return;

  if (!rankerData || rankerData.length === 0) {
    rankerResults.innerHTML = '<p class="data-empty">No ranker data found.</p>';
    return;
  }

  const headerRow = rankerData[0];
  const yearColumnIndex = getColumnIndex(headerRow, 'YEAR');

  if (yearColumnIndex === -1) {
    renderCsvTable(rankerData, rankerResults, 'No ranker data found.');
    return;
  }

  const filteredRows = selectedYear
    ? [headerRow, ...rankerData.slice(1).filter(row => String(row[yearColumnIndex] || '').trim() === selectedYear)]
    : rankerData;

  renderCsvTable(filteredRows, rankerResults, 'No rankers found for this year.');
}

function formatFeeAmount(amount) {
  const value = String(amount ?? '').trim();
  if (!value) return '';
  return /^(Rs\.?|INR|₹)/i.test(value) ? value : `Rs. ${value}`;
}

// Extract classes from CSV data
function extractClasses(data) {
  if (!data || data.length < 2) {
    console.error('Sheet is empty or missing data');
    return [];
  }

  const classes = [];
  // Skip header row (row 0)
  for (let i = 1; i < data.length; i++) {
    const className = data[i][0];
    if (className) {
      classes.push(className);
    }
  }
  return classes;
}

// Get fee amount from parsed data
function getFeeAmount(className, feeType, data) {
  if (!data || data.length < 2) {
    console.error('No data available');
    return null;
  }

  // Find the row matching the class name
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === className) {
      // Column B (index 1) = Monthly Fee
      // Column C (index 2) = Yearly Fee
      if (feeType === 'monthly' && data[i][1]) {
        return data[i][1];
      } else if (feeType === 'yearly' && data[i][2]) {
        return data[i][2];
      }
    }
  }

  console.error(`Class "${className}" not found or fee missing for type "${feeType}"`);
  return null;
}

// Update amount display
function updateAmountDisplay() {
  const schoolSelect = document.getElementById('school-select');
  const classSelect = document.getElementById('class-select');
  const feeTypeSelect = document.getElementById('fee-type-select');
  const amountDisplay = document.getElementById('amount-display');
  const payButton = document.getElementById('pay-button');

  const selectedSchool = schoolSelect.value;
  const selectedClass = classSelect.value;
  const selectedFeeType = feeTypeSelect.value;

  // Reset display
  amountDisplay.textContent = 'Amount: ';
  payButton.disabled = true;

  // Check if all selections are made
  if (!selectedSchool || !selectedClass || !selectedFeeType) {
    return;
  }

  // Get fee data for selected school
  const data = feeData[selectedSchool];
  if (!data) {
    console.error('Fee data not available for school');
    return;
  }

  // Get fee amount
  const amount = getFeeAmount(selectedClass, selectedFeeType, data);
  if (amount) {
    amountDisplay.textContent = `Amount: ${formatFeeAmount(amount)}`;
    payButton.disabled = false;
  } else {
    amountDisplay.textContent = 'Amount: Not Available';
  }
}

// Initialize navigation toggle
function initializeNavToggle() {
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    const setMenuOpen = (open) => {
      navMenu.classList.toggle('active', open);
      navToggle.classList.toggle('active', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    };

    navToggle.addEventListener('click', () => {
      setMenuOpen(!navMenu.classList.contains('active'));
    });

    // Close menu when a link is clicked
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        setMenuOpen(false);
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    });
  }
}

// Initialize school sheet preview
function initializeSchoolPreview() {
  const schoolViewSelect = document.getElementById('school-view-select');
  const schoolResults = document.getElementById('school-results');

  if (!schoolViewSelect || !schoolResults) return;

  schoolViewSelect.addEventListener('change', async (event) => {
    const selectedSchool = event.target.value;

    if (selectedSchool && schoolSheets[selectedSchool]) {
      schoolResults.innerHTML = '<p class="data-empty">Loading school data...</p>';
      const rows = await fetchSchoolData(schoolSheets[selectedSchool].csv);

      if (rows) {
        renderCsvTable(rows, schoolResults, 'No data found for this school.');
      } else {
        schoolResults.innerHTML = '<p class="data-error">Unable to load school data. Please try again later.</p>';
      }
    } else {
      schoolResults.innerHTML = '<p class="data-empty">Please select a school to view data.</p>';
    }
  });
}

// Initialize notifications
function initializeNotifications() {
  const notificationSelect = document.getElementById('notification-school-select');
  const notificationResults = document.getElementById('notification-results');

  if (!notificationSelect || !notificationResults) return;

  notificationSelect.addEventListener('change', async (event) => {
    const selectedSchool = event.target.value;

    if (selectedSchool && notificationSheets[selectedSchool]) {
      notificationResults.innerHTML = '<p class="notification-empty">Loading notifications...</p>';
      const rows = await fetchSchoolData(notificationSheets[selectedSchool]);

      if (rows) {
        renderNotificationTable(rows, notificationResults);
      } else {
        notificationResults.innerHTML = '<p class="notification-error">Unable to load notifications. Please try again later.</p>';
      }
    } else {
      notificationResults.innerHTML = '<p class="notification-empty">Please select a school to view notifications.</p>';
    }
  });
}

async function initializeRankers() {
  const yearSelect = document.getElementById('ranker-year-select');
  const rankerResults = document.getElementById('ranker-results');

  if (!yearSelect || !rankerResults) return;

  rankerResults.innerHTML = '<p class="data-empty">Loading rankers...</p>';
  rankerData = await fetchSchoolData(RANKERS_CSV_URL);

  if (!rankerData) {
    rankerResults.innerHTML = '<p class="data-error">Unable to load rankers. Please try again later.</p>';
    return;
  }

  const headerRow = rankerData[0] || [];
  const yearColumnIndex = getColumnIndex(headerRow, 'YEAR');
  const years = yearColumnIndex === -1
    ? []
    : [...new Set(rankerData.slice(1).map(row => String(row[yearColumnIndex] || '').trim()).filter(Boolean))]
      .sort((a, b) => Number(b) - Number(a));

  yearSelect.innerHTML = '<option value="">All Years</option>';
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });
  yearSelect.disabled = years.length === 0;

  yearSelect.addEventListener('change', () => {
    renderRankers(yearSelect.value);
  });

  renderRankers('');
}

// Initialize fee payment section
function initializeFeePayment() {
  const schoolSelect = document.getElementById('school-select');
  const classSelect = document.getElementById('class-select');
  const feeTypeSelect = document.getElementById('fee-type-select');
  const payButton = document.getElementById('pay-button');

  if (!schoolSelect || !classSelect || !feeTypeSelect || !payButton) return;

  // School selection handler
  schoolSelect.addEventListener('change', async (event) => {
    const selectedSchool = event.target.value;

    // Reset dependent selects
    classSelect.innerHTML = '<option value="">--Select Class--</option>';
    classSelect.disabled = true;
    feeTypeSelect.innerHTML = '<option value="">--Select Fee Type--</option><option value="monthly">Monthly Fee</option><option value="yearly">Yearly Fee</option>';
    feeTypeSelect.disabled = true;
    document.getElementById('amount-display').textContent = 'Amount: ';
    payButton.disabled = true;

    if (!selectedSchool || !schoolSheets[selectedSchool]) {
      return;
    }

    // Fetch and parse CSV data
    const csvUrl = schoolSheets[selectedSchool].csv;
    const data = await fetchSchoolData(csvUrl);

    if (!data) {
      alert('Error: Failed to fetch school data. Please try again.');
      return;
    }

    // Store data for later use
    feeData[selectedSchool] = data;

    // Extract and populate classes
    const classes = extractClasses(data);

    if (classes.length === 0) {
      alert('Error: No classes found in the sheet.');
      return;
    }

    // Populate class select
    classSelect.innerHTML = '<option value="">--Select Class--</option>';
    classes.forEach(className => {
      const option = document.createElement('option');
      option.value = className;
      option.textContent = className;
      classSelect.appendChild(option);
    });

    classSelect.disabled = false;
    feeTypeSelect.disabled = false;
  });

  // Class selection handler
  classSelect.addEventListener('change', () => {
    updateAmountDisplay();
  });

  // Fee type selection handler
  feeTypeSelect.addEventListener('change', () => {
    updateAmountDisplay();
  });

  // Pay button handler
  payButton.addEventListener('click', () => {
    const selectedSchool = schoolSelect.value;

    // Validate school selection and payment form
    if (!selectedSchool || !schoolSheets[selectedSchool]) {
      alert('Error: Please select a valid school.');
      return;
    }

    const paymentUrl = schoolSheets[selectedSchool].paymentForm;

    if (!paymentUrl) {
      alert('Error: Payment form not available for this school.');
      return;
    }

    // Redirect to payment form in new tab
    window.open(paymentUrl, '_blank');
  });
}

// ============================================
// BOOK STORE FUNCTIONALITY
// ============================================

// Google Form Configuration
// Replace ENTRY_ID with the actual entry ID for Book ID field in Google Form
const BOOK_STORE_CONFIG = {
  BOOK_DATA_CSV: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRT97MXB1cS-uyr4w96fdWIwoYC44SR2qlSZ1Abyph9F-GXYzxzwoUGWBGplBHvjkksmJoE_PcPqZhE/pub?gid=0&single=true&output=csv',
  ORDER_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSfCwDIB120Xv0oUYELzURMo6vayWyPWEd7TqdrEOkDOhbf1rA/viewform',
  BOOK_ID_ENTRY_ID: 'entry.831204892' // Entry ID for Book ID field
};

// Bookstore state
const bookStoreState = {
  allBooks: [],
  filteredBooks: [],
  displayedBooksCount: 10,
  booksPerPage: 10,
  currentSearchTerm: ''
};

// Initialize bookstore
function initializeBookstore() {
  const loadingDiv = document.getElementById('bookstore-loading');
  const errorDiv = document.getElementById('bookstore-error');
  const contentDiv = document.getElementById('bookstore-content');
  const searchBtn = document.getElementById('bookstore-search-btn');
  const clearBtn = document.getElementById('bookstore-clear-btn');
  const showMoreBtn = document.getElementById('bookstore-show-more');
  const searchInput = document.getElementById('bookstore-search');

  if (!loadingDiv || !errorDiv || !contentDiv) return;

  // Show loading message
  loadingDiv.style.display = 'block';
  contentDiv.style.display = 'none';
  errorDiv.style.display = 'none';

  // Fetch book data
  fetchBookData();

  // Event listeners
  if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClear);
  }
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', handleShowMore);
  }
}

// Fetch book data from Google Sheet
async function fetchBookData() {
  try {
    const response = await fetch(BOOK_STORE_CONFIG.BOOK_DATA_CSV);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvText = await response.text();
    const bookData = parseCSV(csvText);
    
    if (!bookData || bookData.length < 2) {
      showBookstoreError('No book data found. Please try again later.');
      return;
    }

    // Parse books (skip header row)
    bookStoreState.allBooks = bookData.slice(1).map((row, index) => ({
      name: row[0] || '',
      author: row[1] || '',
      description: row[2] || '',
      image: row[3] || '',
      pdfLink: row[4] || '',
      quantity: row[5] || '0',
      rate: row[6] || '0',
      bookId: row[7] || `BOOK${String(index + 1).padStart(4, '0')}`
    })).filter(book => book.name); // Filter out empty rows

    bookStoreState.filteredBooks = [...bookStoreState.allBooks];
    bookStoreState.displayedBooksCount = 10;

    // Display initial books
    displayBooks();
    showBookstoreContent();
  } catch (error) {
    console.error('Error fetching book data:', error);
    showBookstoreError('Failed to load book data. Please try again later.');
  }
}

// Display books based on current state
function displayBooks() {
  const grid = document.getElementById('bookstore-books-grid');
  const countDisplay = document.getElementById('bookstore-books-count');
  const showMoreBtn = document.getElementById('bookstore-show-more');

  if (!grid) return;

  // Clear grid
  grid.innerHTML = '';

  // Get books to display
  const booksToDisplay = bookStoreState.filteredBooks.slice(0, bookStoreState.displayedBooksCount);

  // Create book cards
  booksToDisplay.forEach((book) => {
    const card = createBookCard(book);
    grid.appendChild(card);
  });

  // Update count
  if (countDisplay) {
    const total = bookStoreState.filteredBooks.length;
    const displayed = bookStoreState.displayedBooksCount;
    countDisplay.textContent = `Showing ${Math.min(displayed, total)} of ${total} book${total !== 1 ? 's' : ''}`;
  }

  // Update Show More button
  if (showMoreBtn) {
    if (bookStoreState.displayedBooksCount >= bookStoreState.filteredBooks.length) {
      showMoreBtn.disabled = true;
      showMoreBtn.textContent = 'All Books Loaded';
    } else {
      showMoreBtn.disabled = false;
      showMoreBtn.textContent = 'Show More';
    }
  }
}

// Create a book card element
function createBookCard(book) {
  const card = document.createElement('div');
  card.className = 'bookstore-card';

  // Image with fallback
  const imageHtml = book.image ? 
    `<img src="${book.image}" alt="${book.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22280%22%3E%3Crect fill=%22%23e0e0e0%22 width=%22280%22 height=%22280%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Arial%22 font-size=%2216%22 fill=%22%23999%22%3EBook Image%3C/text%3E%3C/svg%3E'">` :
    `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #e0e0e0; color: #999;">No Image</div>`;

  // PDF/View link button
  const viewBtn = book.pdfLink ? 
    `<a href="${book.pdfLink}" target="_blank" class="bookstore-view-btn">View PDF</a>` :
    `<button class="bookstore-view-btn" disabled>No PDF</button>`;

  card.innerHTML = `
    <div class="bookstore-card-image">
      ${imageHtml}
    </div>
    <div class="bookstore-card-content">
      <div class="bookstore-card-title">${escapeHtml(book.name)}</div>
      <div class="bookstore-card-author">by ${escapeHtml(book.author)}</div>
      <div class="bookstore-card-description">${escapeHtml(book.description)}</div>
      <div class="bookstore-card-meta">
        <div class="bookstore-card-meta-item">
          <span class="bookstore-card-meta-label">Qty</span>
          <span class="bookstore-card-meta-value">${escapeHtml(book.quantity)}</span>
        </div>
        <div class="bookstore-card-meta-item">
          <span class="bookstore-card-meta-label">Rate</span>
          <span class="bookstore-card-meta-value">₹${escapeHtml(book.rate)}</span>
        </div>
      </div>
      <div class="bookstore-card-id"><strong>ID:</strong> ${escapeHtml(book.bookId)}</div>
      <div class="bookstore-card-buttons">
        <button class="bookstore-order-btn" onclick="openOrderForm('${book.bookId}')">Order</button>
        ${viewBtn}
      </div>
    </div>
  `;

  return card;
}

// Open order form with auto-filled Book ID
function openOrderForm(bookId) {
  // Construct URL with prefilled Book ID
  const formUrl = `${BOOK_STORE_CONFIG.ORDER_FORM_URL}?${BOOK_STORE_CONFIG.BOOK_ID_ENTRY_ID}=${encodeURIComponent(bookId)}`;
  window.open(formUrl, '_blank');
}

// Handle search
function handleSearch() {
  const searchInput = document.getElementById('bookstore-search');
  if (!searchInput) return;

  const searchTerm = searchInput.value.trim().toLowerCase();
  bookStoreState.currentSearchTerm = searchTerm;

  if (!searchTerm) {
    bookStoreState.filteredBooks = [...bookStoreState.allBooks];
  } else {
    bookStoreState.filteredBooks = bookStoreState.allBooks.filter(book => 
      book.name.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm) ||
      book.bookId.toLowerCase().includes(searchTerm)
    );
  }

  // Reset pagination
  bookStoreState.displayedBooksCount = 10;
  displayBooks();

  if (bookStoreState.filteredBooks.length === 0) {
    const grid = document.getElementById('bookstore-books-grid');
    if (grid) {
      grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">No books found matching your search.</p>';
    }
  }
}

// Handle clear search
function handleClear() {
  const searchInput = document.getElementById('bookstore-search');
  if (searchInput) {
    searchInput.value = '';
  }

  bookStoreState.currentSearchTerm = '';
  bookStoreState.filteredBooks = [...bookStoreState.allBooks];
  bookStoreState.displayedBooksCount = 10;
  displayBooks();
}

// Handle Show More button
function handleShowMore() {
  bookStoreState.displayedBooksCount += bookStoreState.booksPerPage;
  displayBooks();
}

// Show bookstore content
function showBookstoreContent() {
  const loadingDiv = document.getElementById('bookstore-loading');
  const errorDiv = document.getElementById('bookstore-error');
  const contentDiv = document.getElementById('bookstore-content');

  if (loadingDiv) loadingDiv.style.display = 'none';
  if (errorDiv) errorDiv.style.display = 'none';
  if (contentDiv) contentDiv.style.display = 'block';
}

// Show bookstore error
function showBookstoreError(message) {
  const loadingDiv = document.getElementById('bookstore-loading');
  const errorDiv = document.getElementById('bookstore-error');
  const contentDiv = document.getElementById('bookstore-content');
  const errorText = document.getElementById('bookstore-error-text');

  if (loadingDiv) loadingDiv.style.display = 'none';
  if (contentDiv) contentDiv.style.display = 'none';
  if (errorDiv) errorDiv.style.display = 'block';
  if (errorText) errorText.textContent = message;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const loginUsers = {
  'SUPERADMIN': {
    password: '13131313',
    role: 'superadmin',
    school: '',
    displayName: 'Super Admin',
    admitLinks: [
      { label: 'Bokakhat Admit Card', url: 'admitcardtemplate1.html' },
      { label: 'Braghmaputra Admit Card', url: 'admitcardtemplate2.html' },
      { label: 'Mohuramukh Admit Card', url: 'admitcardtemplate3.html' },
      { label: 'Marksheet Template', url: 'MARKSHEET.HTML' },
      { label: 'Payment Verify', url: '../PAYMENT_VARIFY.HTML' }
    ]
  },
  'BOKAKHATADMIN': {
    password: '42424242',
    role: 'school-admin',
    school: 'bokakhat',
    displayName: 'Bokakhat Admin',
    admitLinks: [
      { label: 'Bokakhat Admit Card', url: 'admitcardtemplate1.html' },
      { label: 'Marksheet Template', url: 'MARKSHEET.HTML' },
      { label: 'Payment Verify', url: '../PAYMENT_VARIFY.HTML' }
    ]
  },
  'MOHURAMUKHADMIN': {
    password: '99887766',
    role: 'school-admin',
    school: 'mohuramukh',
    displayName: 'Mohuramukh Admin',
    admitLinks: [
      { label: 'Mohuramukh Admit Card', url: 'admitcardtemplate3.html' },
      { label: 'Marksheet Template', url: 'MARKSHEET.HTML' },
      { label: 'Payment Verify', url: '../PAYMENT_VARIFY.HTML' }
    ]
  },
  'BRAGHMAPUTRAADMIN': {
    password: '33445577',
    role: 'school-admin',
    school: 'brahmaputra',
    displayName: 'Braghmaputra Admin',
    admitLinks: [
      { label: 'Braghmaputra Admit Card', url: 'admitcardtemplate2.html' },
      { label: 'Marksheet Template', url: 'MARKSHEET.HTML' },
      { label: 'Payment Verify', url: '../PAYMENT_VARIFY.HTML' }
    ]
  }
};

let currentLoggedUser = null;
const SCHOOL_ADMIN_SESSION_KEY = 'prayasSchoolAdminSessionV1';
const SCHOOL_ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;
const STUDENT_DETAILS_SHEETS = {
  bokakhat: {
    label: 'Bokakhat Jatiya Bidyalay',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoNbpVzKmBkNX_OYKYqOb96nKO2KJIOl-lRyu0rYrV5vMgTGqNkHcMFK0ILid2Vgx13MdhamM1jXJX/pub?gid=0&single=true&output=csv'
  },
  brahmaputra: {
    label: 'Brahmaputra Jatiya Bidyalay',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjvLGr6JH7hBTizrFyzJbvstF7ye2tx5C3115ZgpHKErwG-AP0dckJcc3blJeI1LoQ5rdnWwG23cbq/pub?gid=0&single=true&output=csv'
  },
  mohuramukh: {
    label: 'Mohuramukh Jatiya Bidyalay',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTK_4jKxfizTsnzqJC_F56lqTBi2wpgL1qxDW4wMvFzW6UD1EcB8xeWs8IT1aGMQViKTAVJ8BDVUy1R/pub?gid=0&single=true&output=csv'
  }
};
const STUDENT_DETAIL_FIELDS = {
  admissionDate: ['ADMISSIONDATE'],
  studentId: ['STUDENTID'],
  name: ['NAME', 'STUDENTNAME', 'FULLNAME'],
  fatherName: ['FATHERNAME'],
  motherName: ['MOTHERNAME'],
  phoneNumber: ['PHONENUMBER', 'PHONE', 'MOBILE'],
  email: ['EMAIL'],
  className: ['CLASS', 'CLASSNAME'],
  rollNumber: ['ROLLNUMBER', 'ROLLNO', 'ROLL'],
  dateOfBirth: ['DATEOFBIRTH', 'DOB'],
  gender: ['GENDER'],
  caste: ['CASTE', 'CATEGORY'],
  address: ['ADDRESS'],
  aadharNumber: ['AADHARNUMBER', 'AADHAARNUMBER']
};
const STUDENT_DETAIL_EXPORT_COLUMNS = [
  { key: 'admissionDate', label: 'Admission Date' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'name', label: 'Name' },
  { key: 'fatherName', label: 'Father Name' },
  { key: 'motherName', label: 'Mother Name' },
  { key: 'phoneNumber', label: 'Phone Number' },
  { key: 'email', label: 'Email' },
  { key: 'className', label: 'Class' },
  { key: 'rollNumber', label: 'Roll Number' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'caste', label: 'Caste' },
  { key: 'address', label: 'Address' },
  { key: 'aadharNumber', label: 'Aadhar Number' }
];
let adminStudentRows = [];
let adminStudentFilteredRows = [];
let adminStudentFieldIndexes = {};

function saveSchoolAdminSession(userId, userRecord) {
  const session = {
    userId,
    displayName: userRecord.displayName,
    role: userRecord.role,
    school: userRecord.school || '',
    expiresAt: Date.now() + SCHOOL_ADMIN_SESSION_MS
  };

  localStorage.setItem(SCHOOL_ADMIN_SESSION_KEY, JSON.stringify(session));
}

function clearSchoolAdminSession() {
  localStorage.removeItem(SCHOOL_ADMIN_SESSION_KEY);
}

function readSchoolAdminSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SCHOOL_ADMIN_SESSION_KEY) || 'null');
    if (!session || !session.userId || !session.expiresAt) return null;

    const userId = String(session.userId).trim().toUpperCase();
    const userRecord = loginUsers[userId];
    if (!userRecord || Number(session.expiresAt) < Date.now()) {
      clearSchoolAdminSession();
      return null;
    }

    return { userId, userRecord };
  } catch (error) {
    clearSchoolAdminSession();
    return null;
  }
}

function compactHeader(value) {
  return String(value || '').replace(/^\uFEFF/, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function mapStudentDetailFields(headers) {
  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[compactHeader(header)] = index;
  });

  adminStudentFieldIndexes = {};
  Object.keys(STUDENT_DETAIL_FIELDS).forEach((fieldName) => {
    const match = STUDENT_DETAIL_FIELDS[fieldName].find((alias) => Object.prototype.hasOwnProperty.call(headerMap, alias));
    adminStudentFieldIndexes[fieldName] = match ? headerMap[match] : -1;
  });
}

function getStudentDetailCell(row, fieldName) {
  const index = adminStudentFieldIndexes[fieldName];
  if (index === undefined || index < 0) return '';
  return String(row[index] || '').trim();
}

function shapeStudentDetailRow(row) {
  return {
    admissionDate: getStudentDetailCell(row, 'admissionDate'),
    studentId: getStudentDetailCell(row, 'studentId'),
    name: getStudentDetailCell(row, 'name'),
    fatherName: getStudentDetailCell(row, 'fatherName'),
    motherName: getStudentDetailCell(row, 'motherName'),
    phoneNumber: getStudentDetailCell(row, 'phoneNumber'),
    email: getStudentDetailCell(row, 'email'),
    className: getStudentDetailCell(row, 'className'),
    rollNumber: getStudentDetailCell(row, 'rollNumber'),
    dateOfBirth: getStudentDetailCell(row, 'dateOfBirth'),
    gender: getStudentDetailCell(row, 'gender'),
    caste: getStudentDetailCell(row, 'caste'),
    address: getStudentDetailCell(row, 'address'),
    aadharNumber: getStudentDetailCell(row, 'aadharNumber')
  };
}

function normalizeStudentFilter(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function studentDetailMatches(value, filter) {
  const normalizedFilter = normalizeStudentFilter(filter);
  if (!normalizedFilter) return true;
  return normalizeStudentFilter(value).includes(normalizedFilter);
}

function setAdminStudentStatus(message, type = '') {
  const status = document.getElementById('admin-student-status');
  if (!status) return;
  status.textContent = message;
  status.className = `admin-student-status${type ? ` ${type}` : ''}`;
}

function setAdminStudentCount(count) {
  const countEl = document.getElementById('admin-student-record-count');
  if (countEl) countEl.textContent = `${count} ${count === 1 ? 'record' : 'records'}`;
}

function renderAdminStudentRows(rows) {
  const body = document.getElementById('admin-student-results');
  if (!body) return;

  adminStudentFilteredRows = rows.slice();
  setAdminStudentCount(rows.length);

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="14" class="admin-student-empty">No matching student details found.</td></tr>';
    return;
  }

  body.innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.admissionDate || '-')}</td>
      <td>${escapeHtml(row.studentId || '-')}</td>
      <td>${escapeHtml(row.name || '-')}</td>
      <td>${escapeHtml(row.fatherName || '-')}</td>
      <td>${escapeHtml(row.motherName || '-')}</td>
      <td>${escapeHtml(row.phoneNumber || '-')}</td>
      <td>${escapeHtml(row.email || '-')}</td>
      <td>${escapeHtml(row.className || '-')}</td>
      <td>${escapeHtml(row.rollNumber || '-')}</td>
      <td>${escapeHtml(row.dateOfBirth || '-')}</td>
      <td>${escapeHtml(row.gender || '-')}</td>
      <td>${escapeHtml(row.caste || '-')}</td>
      <td>${escapeHtml(row.address || '-')}</td>
      <td>${escapeHtml(row.aadharNumber || '-')}</td>
    </tr>
  `).join('');
}

function getSelectedAdminStudentSource() {
  const schoolSelect = document.getElementById('admin-student-school');
  const selectedSchool = schoolSelect?.value || 'bokakhat';
  return {
    key: STUDENT_DETAILS_SHEETS[selectedSchool] ? selectedSchool : 'bokakhat',
    source: STUDENT_DETAILS_SHEETS[selectedSchool] || STUDENT_DETAILS_SHEETS.bokakhat
  };
}

function filterAdminStudentDetails() {
  const nameFilter = document.getElementById('admin-student-name')?.value || '';
  const classFilter = document.getElementById('admin-student-class')?.value || '';
  const casteFilter = document.getElementById('admin-student-caste')?.value || '';

  const results = adminStudentRows.filter((row) => (
    studentDetailMatches(row.name, nameFilter) &&
    studentDetailMatches(row.className, classFilter) &&
    studentDetailMatches(row.caste, casteFilter)
  ));

  renderAdminStudentRows(results);
  setAdminStudentStatus('Search complete.', 'success');
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadAdminStudentCsv() {
  if (!adminStudentFilteredRows.length) {
    setAdminStudentStatus('No filtered student details to download.', 'error');
    return;
  }

  const { key } = getSelectedAdminStudentSource();
  const headers = STUDENT_DETAIL_EXPORT_COLUMNS.map((column) => column.label);
  const rows = adminStudentFilteredRows.map((row) => (
    STUDENT_DETAIL_EXPORT_COLUMNS.map((column) => row[column.key] || '')
  ));
  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.href = URL.createObjectURL(blob);
  link.download = `${key}-student-details-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  setAdminStudentStatus(`Downloaded ${adminStudentFilteredRows.length} filtered student records.`, 'success');
}

async function loadAdminStudentDetails() {
  const session = readSchoolAdminSession();
  if (!session || !currentLoggedUser || session.userId !== currentLoggedUser) {
    hideAdminStudentDetailsSection();
    return;
  }

  const { source } = getSelectedAdminStudentSource();
  const body = document.getElementById('admin-student-results');

  adminStudentRows = [];
  adminStudentFilteredRows = [];
  setAdminStudentCount(0);
  setAdminStudentStatus(`Loading ${source.label} student details...`);
  if (body) body.innerHTML = '<tr><td colspan="14" class="admin-student-empty">Loading student details...</td></tr>';

  try {
    const rows = await fetchSchoolData(source.url);
    if (!rows || !rows.length) throw new Error('Student details could not be loaded.');

    mapStudentDetailFields(rows[0]);
    adminStudentRows = rows.slice(1).map(shapeStudentDetailRow);
    renderAdminStudentRows(adminStudentRows);
    setAdminStudentStatus(`Loaded ${adminStudentRows.length} ${source.label} student records.`, 'success');
  } catch (error) {
    adminStudentRows = [];
    adminStudentFilteredRows = [];
    renderAdminStudentRows([]);
    setAdminStudentStatus(error.message || 'Unable to load student details.', 'error');
  }
}

function populateAdminStudentSchoolSelect(userRecord) {
  const schoolSelect = document.getElementById('admin-student-school');
  if (!schoolSelect) return;

  const allowedSchool = userRecord.role !== 'superadmin' ? userRecord.school : '';
  const schools = Object.entries(STUDENT_DETAILS_SHEETS).filter(([schoolKey]) => !allowedSchool || schoolKey === allowedSchool);

  schoolSelect.innerHTML = schools.map(([schoolKey, source]) => (
    `<option value="${escapeHtml(schoolKey)}">${escapeHtml(source.label)}</option>`
  )).join('');

  schoolSelect.value = allowedSchool || 'bokakhat';
  schoolSelect.disabled = Boolean(allowedSchool);
}

function showAdminStudentDetailsSection(userId, userRecord) {
  const section = document.getElementById('admin-student-details-section');
  const message = document.getElementById('admin-student-access-message');
  if (!section || !userRecord) return;
  if (!['superadmin', 'school-admin'].includes(userRecord.role)) {
    hideAdminStudentDetailsSection();
    return;
  }

  currentLoggedUser = userId;
  section.hidden = false;
  section.setAttribute('aria-hidden', 'false');
  if (message) message.textContent = `Logged in as ${userRecord.displayName}. Student details are available below.`;
  populateAdminStudentSchoolSelect(userRecord);
  loadAdminStudentDetails();
}

function hideAdminStudentDetailsSection() {
  const section = document.getElementById('admin-student-details-section');
  const body = document.getElementById('admin-student-results');
  if (section) {
    section.hidden = true;
    section.setAttribute('aria-hidden', 'true');
  }
  adminStudentRows = [];
  adminStudentFilteredRows = [];
  setAdminStudentCount(0);
  setAdminStudentStatus('Student details are locked.');
  if (body) body.innerHTML = '<tr><td colspan="14" class="admin-student-empty">Login as an admin to view student details.</td></tr>';
}

function initializeAdminStudentDetailsSection() {
  const section = document.getElementById('admin-student-details-section');
  const form = document.getElementById('admin-student-filter-form');
  const schoolSelect = document.getElementById('admin-student-school');
  const clearButton = document.getElementById('admin-student-clear');
  const reloadButton = document.getElementById('admin-student-reload');
  const downloadButton = document.getElementById('admin-student-download');
  if (!section || !form || !schoolSelect || !clearButton || !reloadButton || !downloadButton) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    filterAdminStudentDetails();
  });

  schoolSelect.addEventListener('change', loadAdminStudentDetails);
  clearButton.addEventListener('click', () => {
    ['admin-student-name', 'admin-student-class', 'admin-student-caste'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
    renderAdminStudentRows(adminStudentRows);
    setAdminStudentStatus('Filters cleared.');
  });
  reloadButton.addEventListener('click', loadAdminStudentDetails);
  downloadButton.addEventListener('click', downloadAdminStudentCsv);

  currentLoggedUser = null;
  clearSchoolAdminSession();
  hideAdminStudentDetailsSection();
}

function initializeLoginSection() {
  const openBtn = document.getElementById('login-open-btn');
  const loginPanel = document.getElementById('login-panel');
  const loginTypeSelect = document.getElementById('login-type-select');
  const adminFields = document.getElementById('admin-login-fields');
  const userIdInput = document.getElementById('login-userid');
  const submitBtn = document.getElementById('login-submit-btn');
  const cancelBtn = document.getElementById('login-cancel-btn');
  const admitBtn = document.getElementById('admit-card-btn');
  const accountButtons = Array.from(document.querySelectorAll('[data-school-admin]'));

  if (openBtn && loginPanel) {
    openBtn.addEventListener('click', () => {
      loginPanel.style.display = 'block';
      openBtn.style.display = 'none';
      if (loginTypeSelect) loginTypeSelect.focus();
    });
  }

  if (loginTypeSelect && adminFields) {
    loginTypeSelect.addEventListener('change', () => {
      const loginType = loginTypeSelect.value;
      clearLoginForm(false);

      if (loginType === 'department') {
        window.location.href = '../DEPATMENTS/department.html';
        return;
      }

      adminFields.style.display = loginType === 'admin' ? 'block' : 'none';
      if (loginType === 'admin' && userIdInput) {
        setSelectedSchoolAdmin('SUPERADMIN');
      }
    });
  }

  accountButtons.forEach((button) => {
    button.addEventListener('click', () => setSelectedSchoolAdmin(button.dataset.schoolAdmin));
  });

  if (cancelBtn && loginPanel && openBtn) {
    cancelBtn.addEventListener('click', () => {
      loginPanel.style.display = 'none';
      openBtn.style.display = 'inline-flex';
      clearLoginForm();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', handleLoginSubmit);
  }

  if (admitBtn) {
    admitBtn.addEventListener('click', () => {
      if (!currentLoggedUser) return;
      const user = loginUsers[currentLoggedUser];
      const firstLink = user?.admitLinks?.[0];
      if (firstLink?.url) {
        window.open(firstLink.url, '_blank');
      }
    });
  }
}

function setSelectedSchoolAdmin(adminId) {
  const userIdInput = document.getElementById('login-userid');
  const passwordInput = document.getElementById('login-password');
  const loginMessage = document.getElementById('login-message');
  const accountButtons = Array.from(document.querySelectorAll('[data-school-admin]'));

  if (!loginUsers[adminId]) return;
  if (userIdInput) userIdInput.value = adminId;
  if (passwordInput) {
    passwordInput.value = '';
    passwordInput.focus();
  }
  if (loginMessage) loginMessage.textContent = '';
  renderAdminAdmitLinks(null);
  currentLoggedUser = null;
  clearSchoolAdminSession();
  hideAdminStudentDetailsSection();

  accountButtons.forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.schoolAdmin === adminId);
  });
}

function handleLoginSubmit() {
  const userIdInput = document.getElementById('login-userid');
  const passwordInput = document.getElementById('login-password');
  const loginMessage = document.getElementById('login-message');
  const admitBtn = document.getElementById('admit-card-btn');

  if (!userIdInput || !passwordInput || !loginMessage || !admitBtn) return;

  const enteredUserId = userIdInput.value.trim().toUpperCase();
  const enteredPassword = passwordInput.value.trim();

  if (!enteredUserId || !enteredPassword) {
    loginMessage.textContent = 'Please enter both user ID and password.';
    loginMessage.style.color = '#c62828';
    return;
  }

  const userRecord = loginUsers[enteredUserId];
  if (!userRecord || userRecord.password !== enteredPassword) {
    loginMessage.textContent = 'Invalid login credentials. Please try again.';
    loginMessage.style.color = '#c62828';
    admitBtn.style.display = 'none';
    renderAdminAdmitLinks(null);
    currentLoggedUser = null;
    clearSchoolAdminSession();
    hideAdminStudentDetailsSection();
    return;
  }

  currentLoggedUser = enteredUserId;
  saveSchoolAdminSession(enteredUserId, userRecord);
  loginMessage.textContent = `Logged in as ${userRecord.displayName}. Templates available.`;
  loginMessage.style.color = '#2e7d32';
  admitBtn.style.display = 'none';
  renderAdminAdmitLinks(userRecord);
  showAdminStudentDetailsSection(enteredUserId, userRecord);
}

function renderAdminAdmitLinks(userRecord) {
  const linksContainer = document.getElementById('admin-admit-links');
  if (!linksContainer) return;

  linksContainer.innerHTML = '';

  if (!userRecord?.admitLinks?.length) {
    linksContainer.style.display = 'none';
    return;
  }

  linksContainer.innerHTML = userRecord.admitLinks.map(link => `
    <a class="admin-admit-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">
      ${escapeHtml(link.label)}
    </a>
  `).join('');
  linksContainer.style.display = 'flex';
}

function clearLoginForm(resetType = true) {
  const loginTypeSelect = document.getElementById('login-type-select');
  const adminFields = document.getElementById('admin-login-fields');
  const userIdInput = document.getElementById('login-userid');
  const passwordInput = document.getElementById('login-password');
  const loginMessage = document.getElementById('login-message');
  const admitBtn = document.getElementById('admit-card-btn');

  if (resetType && loginTypeSelect) loginTypeSelect.value = '';
  if (adminFields) adminFields.style.display = 'none';
  if (userIdInput) userIdInput.value = 'SUPERADMIN';
  if (passwordInput) passwordInput.value = '';
  if (loginMessage) {
    loginMessage.textContent = '';
  }
  if (admitBtn) {
    admitBtn.style.display = 'none';
  }
  renderAdminAdmitLinks(null);
  currentLoggedUser = null;
  clearSchoolAdminSession();
  hideAdminStudentDetailsSection();
  document.querySelectorAll('[data-school-admin]').forEach((button) => {
    button.classList.toggle('is-selected', button.dataset.schoolAdmin === 'SUPERADMIN');
  });
}

// Image Slideshow Configuration
const SLIDESHOW_CONFIG = {
  images: [
    '../IMAGES/achivements/achievement1.jpg',
    '../IMAGES/achivements/achievement2.jpg',
    '../IMAGES/achivements/achievement3.jpg',
    '../IMAGES/achivements/achievement4.jpg',
    '../IMAGES/achivements/achievement5.jpg',
    '../IMAGES/achivements/achievement6.jpg',
    '../IMAGES/achivements/achievement7.jpg'
  ]
};

let slideshowState = {
  images: [],
  currentIndex: 0
};

// Load slideshow images from the local achievements folder
async function fetchSlideshowImages() {
  const loadingElement = document.getElementById('slideshow-loading');
  const errorElement = document.getElementById('slideshow-error');
  const errorText = document.getElementById('slideshow-error-text');

  try {
    loadingElement.style.display = 'none';
    errorElement.style.display = 'none';

    const images = SLIDESHOW_CONFIG.images.slice();
    if (images.length === 0) {
      throw new Error('No gallery images are configured.');
    }

    slideshowState.images = images;
    slideshowState.currentIndex = 0;

    updateSlideshowDisplay();
    console.log('Loaded ' + images.length + ' local gallery images');
    
  } catch (error) {
    console.error('Error fetching slideshow images:', error);
    loadingElement.style.display = 'none';
    errorElement.style.display = 'block';
    errorText.innerHTML = '<strong>Unable to load images:</strong> ' + error.message;
  }
}

// Parse CSV data and extract URLs
function parseCSVData(csvText) {
  const images = [];
  const lines = csvText.split('\n');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Extract URLs using multiple strategies
    let urls = [];
    
    // Strategy 1: Find all http(s) URLs in the line
    const urlRegex = /(https?:\/\/[^\s,\"\']*)(?=[,\"\'\s]|$)/g;
    let match;
    while ((match = urlRegex.exec(line)) !== null) {
      let url = match[1];
      // Clean up URL ending
      url = url.replace(/[,";']+$/, '');
      if (url.length > 0 && !url.includes('google.com/spreadsheets')) {
        urls.push(url);
      }
    }
    
    // Strategy 2: If no URLs found, try splitting by comma and checking first field
    if (urls.length === 0) {
      const fields = line.split(',');
      for (let field of fields) {
        field = field.trim().replace(/^\"|\"$/g, '').replace(/^'|'$/g, '');
        if ((field.startsWith('http://') || field.startsWith('https://')) && field.length > 10) {
          urls.push(field);
          break;
        }
      }
    }
    
    // Add found URLs to images array
    for (let url of urls) {
      if (!images.includes(url)) {
        images.push(url);
        console.log('Found image URL:', url);
      }
    }
  }
  
  return images;
}

// Parse JSON data from Google Sheets
function parseJsonData(jsonData) {
  const images = [];
  try {
    if (jsonData && jsonData.feed && jsonData.feed.entry) {
      for (let entry of jsonData.feed.entry) {
        // Look for URLs in cell values
        if (entry.content && entry.content.$t) {
          const url = entry.content.$t.trim();
          if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('google.com/spreadsheets')) {
            if (!images.includes(url)) {
              images.push(url);
              console.log('Found image URL from JSON:', url);
            }
          }
        }
      }
    }
  } catch (parseError) {
    console.error('Error parsing JSON data:', parseError);
  }
  return images;
}

// Update slideshow display
function updateSlideshowDisplay() {
  if (slideshowState.images.length === 0) return;
  
  const imageElement = document.getElementById('slideshow-image');
  const counterElement = document.getElementById('slideshow-counter');
  
  const imageUrl = slideshowState.images[slideshowState.currentIndex];
  imageElement.src = imageUrl;
  imageElement.alt = `Achievement image ${slideshowState.currentIndex + 1}`;
  imageElement.onerror = () => {
    console.error('Failed to load image:', imageUrl);
  };
  
  counterElement.textContent = `${slideshowState.currentIndex + 1} / ${slideshowState.images.length}`;
  renderSlideshowThumbnails();
}

function renderSlideshowThumbnails() {
  const thumbnailContainer = document.getElementById('slideshow-thumbnails');
  if (!thumbnailContainer) return;

  thumbnailContainer.innerHTML = slideshowState.images.map((imageUrl, index) => `
    <button
      class="slideshow-thumbnail${index === slideshowState.currentIndex ? ' is-active' : ''}"
      type="button"
      data-index="${index}"
      aria-label="Show achievement image ${index + 1}"
    >
      <img src="${imageUrl}" alt="">
    </button>
  `).join('');

  thumbnailContainer.querySelectorAll('.slideshow-thumbnail').forEach((button) => {
    button.addEventListener('click', () => {
      slideshowState.currentIndex = Number(button.dataset.index);
      updateSlideshowDisplay();
    });
  });
}

// Navigate to next image
function nextSlide() {
  if (slideshowState.images.length === 0) return;
  
  slideshowState.currentIndex = (slideshowState.currentIndex + 1) % slideshowState.images.length;
  updateSlideshowDisplay();
}

// Navigate to previous image
function prevSlide() {
  if (slideshowState.images.length === 0) return;
  
  slideshowState.currentIndex = (slideshowState.currentIndex - 1 + slideshowState.images.length) % slideshowState.images.length;
  updateSlideshowDisplay();
}

// Initialize slideshow
function initializeSlideshow() {
  // Fetch images on page load
  fetchSlideshowImages();
  
  // Setup button event listeners
  const prevBtn = document.getElementById('slideshow-prev');
  const nextBtn = document.getElementById('slideshow-next');
  
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeNavToggle();
  initializeSchoolPreview();
  initializeNotifications();
  initializeRankers();
  initializeFeePayment();
  initializeBookstore();
  initializeLoginSection();
  initializeAdminStudentDetailsSection();
  initializeSlideshow();
});
