(function () {
  const PASSWORD = "13131313";
  const CONFIDENTIAL_PASSWORD = "13131313";
  const CONFIDENTIAL_PAGE = "CONFIDENTIAL.HTML";
  const SCHOOL_ADMIN_SESSION_KEY = "prayasSchoolAdminSessionV1";
  const SCHOOL_ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;
  const ADMIN_ACCOUNTS = {
    superadmin: {
      label: "Super Admin",
      password: "13131313",
      sessionUserId: "SUPERADMIN",
      role: "superadmin",
      school: "",
      links: [
        { title: "Bokakhat Admit Card", description: "Print Bokakhat school admit cards.", url: "SCHOOL/admitcardtemplate1.html" },
        { title: "Mohuramukh Admit Card", description: "Print Mohuramukh school admit cards.", url: "SCHOOL/admitcardtemplate3.html" },
        { title: "Brahmaputra Admit Card", description: "Print Brahmaputra school admit cards.", url: "SCHOOL/admitcardtemplate2.html" },
        { title: "Marksheet Template", description: "Generate school marksheets after admin login.", url: "SCHOOL/MARKSHEET.HTML" },
        { title: "Payment Verify", description: "Find student payment UTR/reference numbers.", url: "PAYMENT_VARIFY.HTML" },
        { title: "Student Details", description: "View and filter student records for every school.", url: "#admin-student-details-section", samePage: true },
        { title: "Publication Ledger", description: "Open the publications area.", url: "PUBLICATIONS/publications.html" },
        { title: "Publication Party Balances", description: "View Book Rally publication balances.", url: "PRAYAS BOOK RALLY/bookrally.html?admin=superadmin#publication-party-balances" },
        { title: "Amar Pathar Party Balance", description: "View Amar Pathar party balances.", url: "AMAR PATHAR/amarpathar.html?admin=superadmin#amar-party-balances" }
      ]
    },
    bokakhatadmin: {
      label: "Bokakhat Admin",
      password: "42424242",
      sessionUserId: "BOKAKHATADMIN",
      role: "school-admin",
      school: "bokakhat",
      links: [
        { title: "Bokakhat Admit Card", description: "Print Bokakhat school admit cards.", url: "SCHOOL/admitcardtemplate1.html" },
        { title: "Marksheet Template", description: "Generate Bokakhat school marksheets.", url: "SCHOOL/MARKSHEET.HTML" },
        { title: "Payment Verify", description: "Find Bokakhat student payment UTR/reference numbers.", url: "PAYMENT_VARIFY.HTML" },
        { title: "Student Details", description: "View Bokakhat student records.", url: "#admin-student-details-section", samePage: true }
      ]
    },
    mohuramukhadmin: {
      label: "Mohuramukh Admin",
      password: "99887766",
      sessionUserId: "MOHURAMUKHADMIN",
      role: "school-admin",
      school: "mohuramukh",
      links: [
        { title: "Mohuramukh Admit Card", description: "Print Mohuramukh school admit cards.", url: "SCHOOL/admitcardtemplate3.html" },
        { title: "Marksheet Template", description: "Generate Mohuramukh school marksheets.", url: "SCHOOL/MARKSHEET.HTML" },
        { title: "Payment Verify", description: "Find Mohuramukh student payment UTR/reference numbers.", url: "PAYMENT_VARIFY.HTML" },
        { title: "Student Details", description: "View Mohuramukh student records.", url: "#admin-student-details-section", samePage: true }
      ]
    },
    brahmaputraadmin: {
      label: "Brahmaputra Admin",
      password: "33445577",
      sessionUserId: "BRAHMAPUTRAADMIN",
      role: "school-admin",
      school: "brahmaputra",
      links: [
        { title: "Brahmaputra Admit Card", description: "Print Brahmaputra school admit cards.", url: "SCHOOL/admitcardtemplate2.html" },
        { title: "Marksheet Template", description: "Generate Brahmaputra school marksheets.", url: "SCHOOL/MARKSHEET.HTML" },
        { title: "Payment Verify", description: "Find Brahmaputra student payment UTR/reference numbers.", url: "PAYMENT_VARIFY.HTML" },
        { title: "Student Details", description: "View Brahmaputra student records.", url: "#admin-student-details-section", samePage: true }
      ]
    }
  };
  ADMIN_ACCOUNTS.braghmaputraadmin = ADMIN_ACCOUNTS.brahmaputraadmin;

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = String(value || "");
    return div.innerHTML;
  }

  function saveSchoolAdminSession(account) {
    const session = {
      userId: account.sessionUserId,
      displayName: account.label,
      role: account.role,
      school: account.school || "",
      expiresAt: Date.now() + SCHOOL_ADMIN_SESSION_MS
    };

    localStorage.setItem(SCHOOL_ADMIN_SESSION_KEY, JSON.stringify(session));
  }

  function announceAdminLogin(account) {
    document.dispatchEvent(new CustomEvent("prayas:admin-login", {
      detail: {
        userId: account.sessionUserId,
        displayName: account.label,
        role: account.role,
        school: account.school || ""
      }
    }));
  }

  function initAuthorityLogin() {
    const loginLink = document.getElementById("authorityLoginLink");
    const modal = document.getElementById("authorityModal");
    const passwordInput = document.getElementById("authorityPassword");
    const submitButton = document.getElementById("authoritySubmit");
    const cancelButton = document.getElementById("authorityCancel");
    const message = document.getElementById("authorityMessage");
    const section = document.getElementById("userAuthoritySection");

    if (!loginLink || !modal || !passwordInput || !submitButton || !cancelButton || !message || !section) {
      return;
    }

    function openModal(event) {
      event.preventDefault();
      modal.classList.add("is-open");
      passwordInput.value = "";
      message.textContent = "";
      passwordInput.focus();
    }

    function closeModal() {
      modal.classList.remove("is-open");
      passwordInput.value = "";
      message.textContent = "";
      loginLink.focus();
    }

    function unlockSection() {
      section.classList.add("is-visible");
      closeModal();
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function submitPassword() {
      if (passwordInput.value === PASSWORD) {
        unlockSection();
        return;
      }

      message.textContent = "Incorrect password. Please try again.";
      passwordInput.select();
    }

    loginLink.addEventListener("click", openModal);
    cancelButton.addEventListener("click", closeModal);
    submitButton.addEventListener("click", submitPassword);

    passwordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submitPassword();
      if (event.key === "Escape") closeModal();
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  function initAdminLogin() {
    const loginLink = document.getElementById("adminLoginLink");
    const modal = document.getElementById("adminLoginModal");
    const loginTypeSelect = document.getElementById("adminLoginType");
    const adminFields = document.getElementById("adminLoginFields");
    const passwordInput = document.getElementById("adminPassword");
    const submitButton = document.getElementById("adminLoginSubmit");
    const cancelButton = document.getElementById("adminLoginCancel");
    const message = document.getElementById("adminLoginMessage");
    const accountButtons = Array.from(document.querySelectorAll("[data-admin-account]"));
    const accessSection = document.getElementById("adminAccessSection");
    const accessMessage = document.getElementById("adminAccessMessage");
    const accessGrid = document.getElementById("adminAccessGrid");
    let selectedAccount = "superadmin";

    if (!loginLink || !modal || !loginTypeSelect || !adminFields || !passwordInput || !submitButton || !cancelButton || !message || !accountButtons.length || !accessSection || !accessMessage || !accessGrid) {
      return;
    }

    function setSelectedAccount(accountId) {
      if (!ADMIN_ACCOUNTS[accountId]) return;
      selectedAccount = accountId;
      accountButtons.forEach((button) => {
        button.classList.toggle("is-selected", button.dataset.adminAccount === selectedAccount);
      });
      message.textContent = "";
      passwordInput.value = "";
      passwordInput.focus();
    }

    function openModal(event) {
      event.preventDefault();
      modal.classList.add("is-open");
      message.textContent = "";
      loginTypeSelect.value = "";
      adminFields.style.display = "none";
      passwordInput.value = "";
      loginTypeSelect.focus();
    }

    function closeModal() {
      modal.classList.remove("is-open");
      loginTypeSelect.value = "";
      adminFields.style.display = "none";
      passwordInput.value = "";
      message.textContent = "";
      loginLink.focus();
    }

    function renderAccess(account) {
      accessSection.classList.add("is-visible");
      accessMessage.textContent = `Logged in as ${account.label}. Available tools are shown below.`;
      accessGrid.innerHTML = account.links.map((link) => `
        <a class="authority-item" href="${escapeHTML(link.url)}"${link.samePage ? "" : ' target="_blank" rel="noopener"'}>
          <strong>${escapeHTML(link.title)}</strong>
          <span>${escapeHTML(link.description)}</span>
        </a>
      `).join("");
      closeModal();
      accessSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function submitLogin() {
      const account = ADMIN_ACCOUNTS[selectedAccount];
      if (account && passwordInput.value === account.password) {
        saveSchoolAdminSession(account);
        renderAccess(account);
        announceAdminLogin(account);
        return;
      }

      message.textContent = "Incorrect password for selected account.";
      passwordInput.select();
    }

    accountButtons.forEach((button) => {
      button.addEventListener("click", () => setSelectedAccount(button.dataset.adminAccount));
    });
    loginTypeSelect.addEventListener("change", () => {
      message.textContent = "";
      passwordInput.value = "";

      if (loginTypeSelect.value === "department") {
        window.location.href = "DEPATMENTS/department.html";
        return;
      }

      adminFields.style.display = loginTypeSelect.value === "admin" ? "block" : "none";
      if (loginTypeSelect.value === "admin") {
        setSelectedAccount("superadmin");
      }
    });
    loginLink.addEventListener("click", openModal);
    cancelButton.addEventListener("click", closeModal);
    submitButton.addEventListener("click", submitLogin);

    passwordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submitLogin();
      if (event.key === "Escape") closeModal();
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  function initConfidentialLogin() {
    const loginLink = document.getElementById("confidentialLoginLink");
    const modal = document.getElementById("confidentialModal");
    const passwordInput = document.getElementById("confidentialPassword");
    const submitButton = document.getElementById("confidentialSubmit");
    const cancelButton = document.getElementById("confidentialCancel");
    const message = document.getElementById("confidentialMessage");

    if (!loginLink || !modal || !passwordInput || !submitButton || !cancelButton || !message) {
      return;
    }

    function openModal(event) {
      event.preventDefault();
      modal.classList.add("is-open");
      passwordInput.value = "";
      message.textContent = "";
      passwordInput.focus();
    }

    function closeModal() {
      modal.classList.remove("is-open");
      passwordInput.value = "";
      message.textContent = "";
      loginLink.focus();
    }

    function submitLogin() {
      const enteredPassword = passwordInput.value;

      if (enteredPassword === CONFIDENTIAL_PASSWORD) {
        window.location.href = CONFIDENTIAL_PAGE;
        return;
      }

      message.textContent = "Incorrect password. Please try again.";
      passwordInput.select();
    }

    loginLink.addEventListener("click", openModal);
    cancelButton.addEventListener("click", closeModal);
    submitButton.addEventListener("click", submitLogin);

    passwordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submitLogin();
      if (event.key === "Escape") closeModal();
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });
  }

  function init() {
    initAdminLogin();
    initAuthorityLogin();
    initConfidentialLogin();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
