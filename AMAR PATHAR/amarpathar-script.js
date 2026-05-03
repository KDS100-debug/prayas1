/* ============================================================
   AMAR PATHAR ITEMS SECTION - COMPLETE JAVASCRIPT
   ============================================================ */

const AmarPatharManager = {
  // Google Sheets CSV Export URL
  SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRk9uGPXJ5Sk1xwwncu-fINcadotK6k00ZIb-LgqP3v-UwQeTrMz3zTMgTX6I4AC-CGsLazpMXOAfr0/pub?gid=0&single=true&output=csv',
  BALANCE_SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRk9uGPXJ5Sk1xwwncu-fINcadotK6k00ZIb-LgqP3v-UwQeTrMz3zTMgTX6I4AC-CGsLazpMXOAfr0/pub?gid=1878695735&single=true&output=csv',

  // Google Form URL
  ORDER_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLSeP4ukVkUE-WdQXNwB5SZYfKXqJKlkqYQisrhJGGo9kvrHibg/viewform?usp=publish-editor',

  // Form field entry ID for ITEM ID (replace with actual field ID from form)
  ITEM_ID_FIELD: 'entry.ITEM_ID_FIELD',

  // Placeholder image
  PLACEHOLDER_IMAGE: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180"%3E%3Crect width="240" height="180" fill="%23ecf0f1"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%2395a5a6"%3EImage Not Available%3C/text%3E%3C/svg%3E',

  // Show More Configuration
  ITEMS_PER_PAGE: 20,
  currentPage: 0,
  allItems: [],

  /**
   * Parse CSV data from Google Sheets
   * @param {string} csvText - Raw CSV text from Google Sheets
   * @returns {Array} Parsed data array
   */
  parseCSV: function(csvText) {
    const rows = csvText.trim().split('\n');
    const headers = this.parseCSVRow(rows[0]);
    const data = [];

    console.log('CSV Headers:', headers);
    window.DEBUG_HEADERS = headers;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i].trim() === '') continue;
      const values = this.parseCSVRow(rows[i]);
      const row = {};

      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });

      data.push(row);
    }

    console.log('Parsed CSV Data (first 2 rows):', data.slice(0, 2));
    window.DEBUG_FIRST_ITEMS = data.slice(0, 2);
    return data;
  },

  /**
   * Parse individual CSV row handling quoted values
   * @param {string} row - CSV row string
   * @returns {Array} Parsed values
   */
  parseCSVRow: function(row) {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = row[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentValue += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue);
    return values;
  },

  /**
   * Fetch CSV data from Google Sheets
   * @param {string} sheetURL - Google Sheets CSV URL
   * @returns {Promise} Promise resolving to parsed data
   */
  fetchSheetData: async function(sheetURL) {
    try {
      const response = await fetch(sheetURL);
      if (!response.ok) throw new Error('Failed to fetch');
      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      return null;
    }
  },

  /**
   * Sanitize URL to prevent XSS and invalid protocols
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL or placeholder
   */
  sanitizeImageURL: function(url) {
    if (!url || typeof url !== 'string') return '';
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';

    const googleDriveFileId = this.extractGoogleDriveFileId(trimmedUrl);
    if (googleDriveFileId) {
      return `https://drive.google.com/thumbnail?id=${encodeURIComponent(googleDriveFileId)}&sz=w1000`;
    }
    
    // Only allow http(s) and data URLs
    const urlLower = trimmedUrl.toLowerCase();
    if (urlLower.startsWith('http://') || 
        urlLower.startsWith('https://') || 
        urlLower.startsWith('data:')) {
      return trimmedUrl;
    }
    
    return '';
  },

  /**
   * Extract a Google Drive file ID from common share/direct URL formats.
   * @param {string} url - Google Drive URL
   * @returns {string} File ID or empty string
   */
  extractGoogleDriveFileId: function(url) {
    try {
      const parsedUrl = new URL(url);
      const host = parsedUrl.hostname.toLowerCase();
      const isGoogleHost = host === 'google.com' || host.endsWith('.google.com') || host === 'drive.usercontent.google.com';
      if (!isGoogleHost) return '';

      const pathMatch = parsedUrl.pathname.match(/\/file\/d\/([^/?#]+)/);
      if (pathMatch && pathMatch[1]) return pathMatch[1];

      const queryId = parsedUrl.searchParams.get('id');
      if (queryId) return queryId;

      return '';
    } catch (error) {
      const looseMatch = String(url).match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
      return looseMatch ? looseMatch[1] : '';
    }
  },

  /**
   * Create item card HTML element with enhanced image handling
   * @param {Object} item - Item object from parsed CSV
   * @returns {HTMLElement} Item card element
   */
  createItemCard: function(item) {
    const qty = parseInt(item['QTY'] || 0);
    const itemName = item['ITEM NAME'] || 'Untitled';
    const itemId = item['ITEM ID'] || 'N/A';
    const itemRate = item['RATE'] || '₹0';
    
    // Sanitize image URL
    const imageUrl = this.sanitizeImageURL(item['ITEM IMAGE']);
    const hasImage = imageUrl.length > 0;

    const orderLink = `${this.ORDER_FORM_URL}&${this.ITEM_ID_FIELD}=${encodeURIComponent(itemId)}`;

    const card = document.createElement('div');
    card.className = 'item-card';

    // Build image HTML with proper lazy loading and error handling
    let imageHTML = '';
    if (hasImage) {
      imageHTML = `
        <img 
          src="${this.escapeHTML(imageUrl)}" 
          alt="${this.escapeHTML(itemName)}" 
          class="item-image" 
          loading="lazy"
          onerror="this.onerror=null; this.src='${this.PLACEHOLDER_IMAGE}'; this.classList.add('placeholder-active');"
        >`;
    } else {
      imageHTML = `<div class="item-placeholder">📦 No Image</div>`;
    }

    card.innerHTML = `
      <div class="item-image-container">
        ${imageHTML}
      </div>
      <div class="item-content">
        <h3 class="item-name">${this.escapeHTML(itemName)}</h3>
        
        <div class="item-meta">
          <div class="item-meta-row">
            <span class="item-label">QTY</span>
            <span class="item-value">${qty}</span>
          </div>
          <div class="item-meta-row">
            <span class="item-label">ID</span>
            <span class="item-value">${this.escapeHTML(itemId)}</span>
          </div>
        </div>

        <div class="item-rate">${this.escapeHTML(itemRate)}</div>

        <a href="${this.escapeHTML(orderLink)}" target="_blank" class="item-btn-order">Order Now</a>
      </div>
    `;

    return card;
  },

  /**
   * Render items grid
   * @param {Array} items - Array of item objects
   * @param {string} containerId - Target container element ID
   */
  renderItems: function(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!items || items.length === 0) {
      container.innerHTML = '<div class="items-empty"><p>No items available at the moment.</p></div>';
      return;
    }

    // Store all items for pagination
    this.allItems = items;
    this.currentPage = 0;

    // Display initial set of items
    this.displayPageItems(items, containerId);
  },

  /**
   * Display items for current page
   */
  displayPageItems: function(items, containerId) {
    const container = document.getElementById(containerId);
    const startIndex = this.currentPage * this.ITEMS_PER_PAGE;
    const endIndex = startIndex + this.ITEMS_PER_PAGE;
    const pageItems = items.slice(startIndex, endIndex);

    pageItems.forEach(item => {
      const card = this.createItemCard(item);
      container.appendChild(card);
    });

    // Show/hide Show More button
    const showMoreBtn = document.getElementById('items-show-more');
    if (endIndex < items.length) {
      showMoreBtn.style.display = 'block';
    } else {
      showMoreBtn.style.display = 'none';
    }
  },

  /**
   * Show More items functionality
   */
  showMoreItems: function() {
    this.currentPage++;
    this.displayPageItems(this.allItems, 'items-grid');
  },

  renderPartyBalances: function(rows) {
    const loading = document.getElementById('balances-loading');
    const error = document.getElementById('balances-error');
    const tableWrap = document.getElementById('balances-table-wrap');
    const tableBody = document.getElementById('balances-table-body');
    const count = document.getElementById('balances-count');

    if (!loading || !error || !tableWrap || !tableBody || !count) return;

    const balances = [];
    const seen = new Set();

    (rows || []).forEach(row => {
      const date = String(row.DATE || row.Date || row.date || '').trim();
      const party = String(row.PARTY || row.Party || row.party || '').trim();
      const balance = String(row.BALANCE || row.Balance || row.balance || '').trim();
      if (!date && !party && !balance) return;

      const key = `${date}|${party.toLowerCase()}|${balance}`;
      if (seen.has(key)) return;
      seen.add(key);
      balances.push({ date, party, balance });
    });

    loading.style.display = 'none';

    if (balances.length === 0) {
      error.style.display = 'block';
      tableWrap.style.display = 'none';
      count.textContent = 'No data';
      return;
    }

    error.style.display = 'none';
    tableWrap.style.display = 'block';
    count.textContent = `${balances.length} ${balances.length === 1 ? 'party' : 'parties'}`;
    tableBody.innerHTML = balances.map(row => `
      <tr>
        <td>${this.escapeHTML(row.date || '-')}</td>
        <td>${this.escapeHTML(row.party || '-')}</td>
        <td class="${row.balance.includes('-') ? 'balance-negative' : 'balance-positive'}">${this.escapeHTML(row.balance || '-')}</td>
      </tr>
    `).join('');
  },

  showBalanceError: function() {
    const loading = document.getElementById('balances-loading');
    const error = document.getElementById('balances-error');
    const tableWrap = document.getElementById('balances-table-wrap');
    const count = document.getElementById('balances-count');

    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'block';
    if (tableWrap) tableWrap.style.display = 'none';
    if (count) count.textContent = 'Unavailable';
  },

  /**
   * Escape HTML special characters for security
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML text
   */
  escapeHTML: function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Initialize items - fetch and render data
   */
  init: async function() {
    try {
      const [itemsData, balancesData] = await Promise.all([
        this.fetchSheetData(this.SHEET_URL),
        this.fetchSheetData(this.BALANCE_SHEET_URL)
      ]);
      const itemsLoading = document.getElementById('items-loading');
      const itemsError = document.getElementById('items-error');
      const itemsGrid = document.getElementById('items-grid');

      if (balancesData) {
        this.renderPartyBalances(balancesData);
      } else {
        this.showBalanceError();
      }

      if (itemsData) {
        itemsLoading.style.display = 'none';
        itemsError.style.display = 'none';
        this.renderItems(itemsData, 'items-grid');
      } else {
        itemsLoading.style.display = 'none';
        itemsError.style.display = 'block';
      }
    } catch (error) {
      console.error('Error initializing items:', error);
      this.showBalanceError();
      document.getElementById('items-loading').style.display = 'none';
      document.getElementById('items-error').style.display = 'block';
    }
  }
};

function revealAdminOnlyBalances() {
  const balancesSection = document.getElementById('amar-party-balances');
  if (!balancesSection) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === 'superadmin') {
    balancesSection.hidden = false;
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  revealAdminOnlyBalances();
  AmarPatharManager.init();
});
