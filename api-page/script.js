(function () {
  "use strict";

  const els = {
    categories: document.getElementById("categories"),
    noResults: document.getElementById("noResults"),
    searchInput: document.getElementById("searchInput"),

    brandName: document.getElementById("brandName"),
    brandVersion: document.getElementById("brandVersion"),
    introTitle: document.getElementById("introTitle"),
    introDesc: document.getElementById("introDesc"),
    footerText: document.getElementById("footerText"),
    pageTitle: document.getElementById("pageTitle"),

    overlay: document.getElementById("overlay"),
    panelClose: document.getElementById("panelClose"),
    panelName: document.getElementById("panelName"),
    panelDesc: document.getElementById("panelDesc"),
    panelMethod: document.getElementById("panelMethod"),
    panelEndpoint: document.getElementById("panelEndpoint"),
    panelForm: document.getElementById("panelForm"),
    panelError: document.getElementById("panelError"),
    panelSend: document.getElementById("panelSend"),
    copyEndpoint: document.getElementById("copyEndpoint"),
    copyResponse: document.getElementById("copyResponse"),
    responseBlock: document.getElementById("responseBlock"),
    responseStatus: document.getElementById("responseStatus"),
    responseOutput: document.getElementById("responseOutput"),
  };

  let currentItem = null;

  init();

  async function init() {
    let settings;
    try {
      const res = await fetch("/src/settings.json");
      settings = await res.json();
    } catch (err) {
      renderLoadError();
      return;
    }

    renderMeta(settings);
    renderCategories(settings.categories || []);
    setupSearch();
    setupPanelEvents();
  }

  function renderMeta(settings) {
    if (settings.name) {
      setText(els.brandName, settings.name);
      setText(els.introTitle, settings.name);
      setText(els.pageTitle, settings.name + " - Dokumentasi");
      setText(els.footerText, "\u00A9 2026 " + settings.name);
    }
    if (settings.version) setText(els.brandVersion, settings.version);
    if (settings.description) setText(els.introDesc, settings.description);
  }

  function renderLoadError() {
    const p = document.createElement("p");
    p.className = "no-results";
    p.style.display = "block";
    p.textContent = "Gagal memuat src/settings.json.";
    els.categories.appendChild(p);
  }

  // ---------------------------------------------------------
  // Render kategori + kartu endpoint
  // ---------------------------------------------------------
  function renderCategories(categories) {
    els.categories.innerHTML = "";

    categories.forEach((category) => {
      const items = category.items || [];
      if (!items.length) return;

      const section = document.createElement("div");
      section.className = "category";
      section.dataset.category = (category.name || "").toLowerCase();

      const title = document.createElement("h2");
      title.className = "category-title";
      title.textContent = category.name || "Lainnya";

      const count = document.createElement("span");
      count.className = "category-count";
      count.textContent = "(" + items.length + ")";
      title.appendChild(count);

      const grid = document.createElement("div");
      grid.className = "card-grid";

      items.forEach((item) => grid.appendChild(createCard(item)));

      section.appendChild(title);
      section.appendChild(grid);
      els.categories.appendChild(section);
    });
  }

  function createCard(item) {
    const basePath = (item.path || "").split("?")[0];
    const method = (item.method || "GET").toUpperCase();
    const status = (item.status || "ready").toLowerCase();

    const card = document.createElement("article");
    card.className = "card";
    card.dataset.search = (
      (item.name || "") +
      " " +
      (item.desc || "") +
      " " +
      basePath
    ).toLowerCase();

    const top = document.createElement("div");
    top.className = "card-top";
    top.appendChild(
      badge(method, method === "POST" ? "badge-post" : "badge-get"),
    );
    top.appendChild(badge(status, statusBadgeClass(status)));

    const name = document.createElement("h3");
    name.className = "card-name";
    name.textContent = item.name || basePath;

    const desc = document.createElement("p");
    desc.className = "card-desc";
    desc.textContent = item.desc || "";

    const path = document.createElement("code");
    path.className = "card-path";
    path.textContent = basePath;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card-btn";
    btn.textContent = "Coba Endpoint";
    btn.addEventListener("click", () => openPanel(item));

    card.appendChild(top);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(path);
    card.appendChild(btn);

    return card;
  }

  function badge(text, cls) {
    const span = document.createElement("span");
    span.className = "badge " + cls;
    span.textContent = text;
    return span;
  }

  function statusBadgeClass(status) {
    if (status === "error") return "badge-error";
    if (status === "update") return "badge-update";
    return "badge-ready";
  }

  // ---------------------------------------------------------
  // Pencarian
  // ---------------------------------------------------------
  function setupSearch() {
    els.searchInput.addEventListener("input", () => {
      const term = els.searchInput.value.trim().toLowerCase();
      let visibleTotal = 0;

      document.querySelectorAll(".category").forEach((section) => {
        let visibleInSection = 0;

        section.querySelectorAll(".card").forEach((card) => {
          const match = !term || card.dataset.search.includes(term);
          card.style.display = match ? "" : "none";
          if (match) visibleInSection++;
        });

        section.style.display = visibleInSection ? "" : "none";
        visibleTotal += visibleInSection;
      });

      els.noResults.style.display = visibleTotal ? "none" : "block";
    });
  }

  // ---------------------------------------------------------
  // Panel: buka, isi form param, kirim request, tampilkan hasil
  // ---------------------------------------------------------
  function setupPanelEvents() {
    els.panelClose.addEventListener("click", closePanel);
    els.overlay.addEventListener("click", (e) => {
      if (e.target === els.overlay) closePanel();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && els.overlay.classList.contains("open"))
        closePanel();
    });

    els.panelSend.addEventListener("click", sendRequest);
    els.copyEndpoint.addEventListener("click", () => {
      copyToClipboard(els.panelEndpoint.textContent, els.copyEndpoint);
    });
    els.copyResponse.addEventListener("click", () => {
      copyToClipboard(els.responseOutput.textContent, els.copyResponse);
    });
  }

  function openPanel(item) {
    currentItem = item;

    const basePath = (item.path || "").split("?")[0];
    const method = (item.method || "GET").toUpperCase();

    setText(els.panelName, item.name || basePath);
    setText(els.panelDesc, item.desc || "");
    setText(els.panelMethod, method);
    els.panelMethod.className =
      "badge " + (method === "POST" ? "badge-post" : "badge-get");
    setText(els.panelEndpoint, basePath);

    buildForm(item);

    els.panelError.classList.remove("show");
    els.panelError.textContent = "";
    els.responseBlock.hidden = true;
    els.responseOutput.className = "response-output";
    els.responseOutput.textContent = "";

    els.overlay.classList.add("open");
  }

  function closePanel() {
    els.overlay.classList.remove("open");
    currentItem = null;
  }

  function buildForm(item) {
    els.panelForm.innerHTML = "";

    const queryString = (item.path || "").split("?")[1] || "";
    const paramKeys = Array.from(new URLSearchParams(queryString).keys());

    paramKeys.forEach((key) => {
      const field = document.createElement("div");
      field.className = "field";

      const label = document.createElement("label");
      label.setAttribute("for", "field-" + key);
      label.textContent = key;

      const req = document.createElement("span");
      req.className = "req";
      req.textContent = " *";
      label.appendChild(req);

      const input = document.createElement("input");
      input.type = "text";
      input.id = "field-" + key;
      input.name = key;
      input.autocomplete = "off";

      field.appendChild(label);
      field.appendChild(input);

      if (item.params && item.params[key]) {
        const hint = document.createElement("p");
        hint.className = "field-hint";
        hint.textContent = item.params[key];
        field.appendChild(hint);
      }

      els.panelForm.appendChild(field);
    });
  }

  async function sendRequest() {
    if (!currentItem) return;

    const basePath = (currentItem.path || "").split("?")[0];
    const method = (currentItem.method || "GET").toUpperCase();
    const inputs = Array.from(els.panelForm.querySelectorAll("input"));

    const missing = inputs.find((input) => !input.value.trim());
    if (missing) {
      els.panelError.textContent =
        "Parameter '" + missing.name + "' wajib diisi.";
      els.panelError.classList.add("show");
      return;
    }
    els.panelError.classList.remove("show");

    const query = new URLSearchParams();
    inputs.forEach((input) => query.set(input.name, input.value.trim()));
    const queryStr = query.toString();
    const url = basePath + (queryStr ? "?" + queryStr : "");

    els.panelSend.disabled = true;
    els.panelSend.textContent = "Mengirim...";
    els.responseBlock.hidden = true;

    try {
      const res = await fetch(url, {
        method: method === "POST" ? "POST" : "GET",
      });
      await renderResponse(res);
    } catch (err) {
      showResponseText("Gagal menghubungi endpoint: " + err.message, 0);
    } finally {
      els.panelSend.disabled = false;
      els.panelSend.textContent = "Kirim Request";
    }
  }

  async function renderResponse(res) {
    const contentType = res.headers.get("content-type") || "";
    setStatusBadge(res.status);
    els.responseBlock.hidden = false;

    if (contentType.includes("image/") || contentType.includes("video/")) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      els.responseOutput.className = "response-output is-media";
      els.responseOutput.innerHTML = "";

      const el = document.createElement(
        contentType.includes("video/") ? "video" : "img",
      );
      el.src = url;
      if (contentType.includes("video/")) {
        el.controls = true;
      } else {
        el.alt = "response media";
      }
      els.responseOutput.appendChild(el);
      return;
    }

    let text;
    try {
      const json = await res.json();
      text = JSON.stringify(json, null, 2);
    } catch (err) {
      text = await res.text().catch(() => "(tidak bisa membaca response)");
    }
    showResponseText(text, res.status);
  }

  function showResponseText(text, status) {
    els.responseOutput.className = "response-output";
    els.responseOutput.textContent = text;
    if (status) setStatusBadge(status);
  }

  function setStatusBadge(status) {
    els.responseStatus.textContent = String(status);
    els.responseStatus.className =
      "badge " +
      (status >= 200 && status < 300 ? "badge-ready" : "badge-error");
  }

  function copyToClipboard(text, btn) {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const original = btn.textContent;
        btn.textContent = "Tersalin";
        setTimeout(() => {
          btn.textContent = original;
        }, 1200);
      })
      .catch(() => {});
  }

  function setText(el, text) {
    if (el) el.textContent = text;
  }
})();
