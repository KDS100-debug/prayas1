const PublicationsManager = {
  PRAYAS_SHEET_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSP5Cyh3QoHbqeH0I-uxa-WX28ZYSVdM856E7Tklro9O06TtcpkMm7cYnpQ33WRVrk1v2wHmT8poEpf/pub?gid=0&single=true&output=csv",
  OTHER_SHEET_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTOpX5DQjJ-36KXfXmo0YkYam4IPoTqzj8y0jGHTOdO2rgXk5oRylT9qyY_GCExGXrvsJLU7JKa3hCA/pub?gid=0&single=true&output=csv",

  PRAYAS_FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLScbPgpcbPTDBRI15SGIEy36v3xjLCHoTCXpmvoYb2ds_S8u8A/viewform?usp=header",
  OTHER_FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSectChHT9Ea2peAtrGjsFbpE233CXkbIPZS-I1q465Bh698rw/viewform?usp=header",

  PRAYAS_BOOK_ID_FIELD: "entry.810093497",
  OTHER_BOOK_ID_FIELD: "entry.OTHER_BOOK_ID_FIELD",

  BOOKS_PER_PAGE: 2,
  prayasCurrentPage: 0,
  otherCurrentPage: 0,
  prayasAllBooks: [],
  otherAllBooks: [],

  parseCSV(csvText) {
    const rows = [];
    let current = "";
    let row = [];
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const next = csvText[i + 1];

      if (char === '"' && insideQuotes && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        row.push(current);
        current = "";
      } else if ((char === "\n" || char === "\r") && !insideQuotes) {
        if (char === "\r" && next === "\n") i++;
        row.push(current);
        if (row.some((cell) => cell.trim() !== "")) rows.push(row);
        row = [];
        current = "";
      } else {
        current += char;
      }
    }

    row.push(current);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);

    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => header.trim());
    return rows.slice(1).map((values) => {
      const book = {};
      headers.forEach((header, index) => {
        book[header] = (values[index] || "").trim();
      });
      return book;
    });
  },

  async fetchSheetData(sheetURL) {
    try {
      const response = await fetch(sheetURL);
      if (!response.ok) throw new Error(`Sheet request failed: ${response.status}`);
      return this.parseCSV(await response.text());
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      return null;
    }
  },

  normalizeGoogleDriveUrl(url, mode = "view") {
    if (!url) return "";

    const trimmed = url.trim();
    const fileId =
      trimmed.match(/\/file\/d\/([^/]+)/)?.[1] ||
      trimmed.match(/[?&]id=([^&]+)/)?.[1] ||
      trimmed.match(/\/open\?id=([^&]+)/)?.[1];

    if (!fileId) return trimmed;
    return mode === "image"
      ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000`
      : `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
  },

  escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  },

  formatRate(rate) {
    return this.escapeHTML(rate || "Rate unavailable");
  },

  getAvailableQty(book) {
    const parsed = Number.parseInt(book["Available Qty"], 10);
    return Number.isFinite(parsed) ? parsed : 0;
  },

  createBookCard(book, isOtherPublication = false) {
    const availableQty = this.getAvailableQty(book);
    const isOutOfStock = availableQty <= 0;
    const rawImageUrl = book["Book Image"] || book["PDF Link"] || "";
    const imageUrl = this.normalizeGoogleDriveUrl(rawImageUrl, "image");
    const pdfUrl = this.normalizeGoogleDriveUrl(book["PDF Link"] || "", "pdf");
    const hasImage = imageUrl !== "";
    const hasPDF = pdfUrl !== "";
    const formURL = isOtherPublication ? this.OTHER_FORM_URL : this.PRAYAS_FORM_URL;
    const bookIdField = isOtherPublication ? this.OTHER_BOOK_ID_FIELD : this.PRAYAS_BOOK_ID_FIELD;
    const orderLink = `${formURL}&${bookIdField}=${encodeURIComponent(book["Book ID"] || "")}`;

    const card = document.createElement("article");
    card.className = "pub-book-card";

    const imageHTML = hasImage
      ? `<img src="${this.escapeHTML(imageUrl)}" alt="${this.escapeHTML(book["Book Name"] || "Book cover")}" class="pub-book-image" loading="lazy" referrerpolicy="no-referrer" onerror="PublicationsManager.showImageFallback(this)">`
      : `<div class="pub-book-placeholder">Cover image<br>not added</div>`;

    const pdfButton = hasPDF
      ? `<a href="${this.escapeHTML(pdfUrl)}" target="_blank" rel="noopener" class="pub-btn pub-btn-pdf">View PDF</a>`
      : `<button class="pub-btn pub-btn-disabled" type="button" disabled>No PDF</button>`;

    const orderButton = isOutOfStock
      ? `<button class="pub-btn pub-btn-disabled" type="button" disabled>Out of Stock</button>`
      : `<a href="${this.escapeHTML(orderLink)}" target="_blank" rel="noopener" class="pub-btn pub-btn-order">Order Now</a>`;

    card.innerHTML = `
      <div class="pub-book-image-container">${imageHTML}</div>
      <div class="pub-book-content">
        <h4 class="pub-book-name">${this.escapeHTML(book["Book Name"] || "Untitled")}</h4>
        <p class="pub-book-author">by ${this.escapeHTML(book.Author || "Unknown")}</p>
        <p class="pub-book-description">${this.escapeHTML(book.Description || "No description available.")}</p>

        <div class="pub-book-meta">
          <div class="pub-meta-item">
            <span class="pub-meta-label">Book ID</span>
            <span class="pub-meta-value">${this.escapeHTML(book["Book ID"] || "N/A")}</span>
          </div>
          <div class="pub-meta-item">
            <span class="pub-meta-label">Availability</span>
            <span class="pub-meta-value">${availableQty}</span>
          </div>
        </div>

        <div class="pub-book-rate">${this.formatRate(book.Rate)}</div>
        <div class="pub-book-stock">
          <span class="${isOutOfStock ? "pub-stock-warning" : "pub-stock-available"}">
            ${isOutOfStock ? "Out of Stock" : "In Stock"}
          </span>
        </div>

        <div class="pub-buttons">
          ${pdfButton}
          ${orderButton}
        </div>
      </div>
    `;

    return card;
  },

  showImageFallback(image) {
    const fallback = document.createElement("div");
    fallback.className = "pub-book-placeholder";
    fallback.innerHTML = "Cover image<br>not available";
    image.replaceWith(fallback);
  },

  renderBooks(books, containerId, isOtherPublication = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    if (!books || books.length === 0) {
      container.innerHTML = '<div class="pub-empty"><p>No publications available at the moment.</p></div>';
      this.updateCount(isOtherPublication, 0);
      return;
    }

    if (isOtherPublication) {
      this.otherAllBooks = books;
      this.otherCurrentPage = 0;
    } else {
      this.prayasAllBooks = books;
      this.prayasCurrentPage = 0;
    }

    this.updateCount(isOtherPublication, books.length);
    this.displayPageBooks(books, containerId, isOtherPublication);
  },

  displayPageBooks(books, containerId, isOtherPublication) {
    const container = document.getElementById(containerId);
    const page = isOtherPublication ? this.otherCurrentPage : this.prayasCurrentPage;
    const startIndex = page * this.BOOKS_PER_PAGE;
    const endIndex = startIndex + this.BOOKS_PER_PAGE;

    books.slice(startIndex, endIndex).forEach((book) => {
      container.appendChild(this.createBookCard(book, isOtherPublication));
    });

    const showMore = document.getElementById(isOtherPublication ? "other-show-more" : "prayas-show-more");
    if (showMore) showMore.hidden = endIndex >= books.length;
  },

  showMoreBooks(type) {
    const isOtherPublication = type === "other";
    const books = isOtherPublication ? this.otherAllBooks : this.prayasAllBooks;
    const containerId = isOtherPublication ? "other-grid" : "prayas-grid";

    if (isOtherPublication) this.otherCurrentPage++;
    else this.prayasCurrentPage++;

    this.displayPageBooks(books, containerId, isOtherPublication);
  },

  updateCount(isOtherPublication, count) {
    const countElement = document.getElementById(isOtherPublication ? "other-count" : "prayas-count");
    if (countElement) countElement.textContent = `${count} book${count === 1 ? "" : "s"}`;

    const total = this.prayasAllBooks.length + this.otherAllBooks.length;
    const catalogueCount = document.getElementById("catalogueCount");
    if (catalogueCount) catalogueCount.textContent = `${total} book${total === 1 ? "" : "s"}`;
  },

  setLoading(type, isLoading) {
    const loading = document.getElementById(`${type}-loading`);
    if (loading) loading.hidden = !isLoading;
  },

  setError(type, hasError) {
    const error = document.getElementById(`${type}-error`);
    if (error) error.hidden = !hasError;
  },

  async loadCategory(type, sheetUrl, isOtherPublication) {
    this.setLoading(type, true);
    this.setError(type, false);

    const data = await this.fetchSheetData(sheetUrl);
    this.setLoading(type, false);

    if (data) {
      this.renderBooks(data, `${type}-grid`, isOtherPublication);
    } else {
      this.setError(type, true);
      this.updateCount(isOtherPublication, 0);
    }
  },

  async init() {
    await this.loadCategory("prayas", this.PRAYAS_SHEET_URL, false);
  },
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => PublicationsManager.init());
} else {
  PublicationsManager.init();
}
