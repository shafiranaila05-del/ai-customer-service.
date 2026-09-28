// ============================================================
//  Smart Retail — AI Customer Service App
//  app.js — Filter Produk + AI Chatbot Engine
// ============================================================

let storeData = null;
let conversationHistory = [];

// ────────────────────────────────────────────────
// 1. BOOTSTRAP — Load JSON & init UI
// ────────────────────────────────────────────────
async function loadData() {
  try {
    const res = await fetch("data.json");
    storeData = await res.json();
    initApp();
  } catch (err) {
    console.error("Gagal memuat data.json:", err);
    document.getElementById("product-grid").innerHTML =
      '<p class="col-span-full text-center text-red-500">Gagal memuat data produk.</p>';
  }
}

function initApp() {
  renderStoreStatus();
  renderCategories();
  renderProducts(storeData.products);
  setupSearch();
}

// ────────────────────────────────────────────────
// 2. STORE STATUS — Buka / Tutup
// ────────────────────────────────────────────────
function renderStoreStatus() {
  const store = storeData.store;
  const now = new Date();
  const day = now.getDay();   // 0=Minggu, 1=Sen ... 6=Sab
  const hour = now.getHours();

  const isOpenDay = store.open_days.includes(day);
  const isOpenHour = hour >= store.open_hour && hour < store.close_hour;
  const isOpen = isOpenDay && isOpenHour;

  // Badge status
  const badge = document.getElementById("store-status-badge");
  if (badge) {
    badge.textContent = isOpen ? "🟢 Toko Buka" : "🔴 Toko Tutup";
    badge.className = isOpen
      ? "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-300"
      : "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 border border-red-300";
  }

  // Hero status strip
  const strip = document.getElementById("status-strip");
  if (strip) {
    strip.textContent = isOpen
      ? `✅ Toko sedang BUKA — ${store.hours.weekdays}`
      : `⛔ Toko sedang TUTUP — ${isOpenDay ? "Di luar jam operasional" : "Hari Libur"}`;
    strip.className = isOpen
      ? "text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mt-4 inline-block"
      : "text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mt-4 inline-block";
  }
}

// ────────────────────────────────────────────────
// 3. KATEGORI FILTER BUTTONS
// ────────────────────────────────────────────────
function renderCategories() {
  const container = document.getElementById("category-filters");
  if (!container) return;
  container.innerHTML = "";

  storeData.categories.forEach((cat, index) => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.dataset.category = cat;
    btn.className =
      index === 0
        ? "category-btn active px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white transition-all duration-200"
        : "category-btn px-4 py-2 rounded-full text-sm font-semibold bg-white text-gray-600 border border-gray-300 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200";
    btn.addEventListener("click", () => selectCategory(cat));
    container.appendChild(btn);
  });
}

function selectCategory(category) {
  document.querySelectorAll(".category-btn").forEach((btn) => {
    if (btn.dataset.category === category) {
      btn.className =
        "category-btn active px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white transition-all duration-200";
    } else {
      btn.className =
        "category-btn px-4 py-2 rounded-full text-sm font-semibold bg-white text-gray-600 border border-gray-300 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200";
    }
  });
  filterProducts();
}

// ────────────────────────────────────────────────
// 4. SEARCH + FILTER PRODUK
// ────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById("search-input");
  if (input) {
    input.addEventListener("input", filterProducts);
  }
}

function filterProducts() {
  const keyword = (document.getElementById("search-input")?.value || "").toLowerCase().trim();
  const activeBtn = document.querySelector(".category-btn.active");
  const category = activeBtn?.dataset.category || "Semua";

  const filtered = storeData.products.filter((p) => {
    const matchCat = category === "Semua" || p.category === category;
    const matchSearch =
      !keyword ||
      p.name.toLowerCase().includes(keyword) ||
      p.tags.some((t) => t.includes(keyword)) ||
      p.category.toLowerCase().includes(keyword);
    return matchCat && matchSearch;
  });

  renderProducts(filtered);
}

// ────────────────────────────────────────────────
// 5. RENDER PRODUCT CARDS
// ────────────────────────────────────────────────
function formatRupiah(amount) {
  return "Rp " + amount.toLocaleString("id-ID");
}

function renderProducts(products) {
  const grid = document.getElementById("product-grid");
  const countEl = document.getElementById("product-count");
  if (!grid) return;

  if (countEl) {
    countEl.textContent = `Menampilkan ${products.length} produk`;
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
        <span class="text-5xl mb-3">🔍</span>
        <p class="text-lg font-semibold">Produk tidak ditemukan</p>
        <p class="text-sm">Coba kata kunci atau kategori lain.</p>
      </div>`;
    return;
  }

  grid.innerHTML = products
    .map((p) => {
      const inStock = p.stock > 0;
      const stockBadge = inStock
        ? `<span class="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Stok ${p.stock}</span>`
        : `<span class="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">❌ Habis</span>`;
      const cardOpacity = inStock ? "" : "opacity-70";
      const btnClass = inStock
        ? "w-full mt-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150"
        : "w-full mt-4 py-2 rounded-xl bg-gray-200 text-gray-400 text-sm font-semibold cursor-not-allowed";

      return `
      <div class="product-card relative flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden ${cardOpacity}">
        <div class="flex items-center justify-center h-36 bg-gradient-to-br from-blue-50 to-indigo-50 text-6xl select-none">
          ${p.image_icon}
        </div>
        <div class="flex flex-col flex-1 p-5">
          <span class="text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 w-fit mb-2">${p.category}</span>
          <h3 class="font-bold text-gray-900 text-base leading-snug mb-1">${p.name}</h3>
          <p class="text-xs text-gray-500 mb-3 flex-1 leading-relaxed">${p.description}</p>
          <div class="flex items-center justify-between mb-1">
            <span class="text-lg font-extrabold text-blue-700">${formatRupiah(p.price)}</span>
            ${stockBadge}
          </div>
          <div class="text-xs text-gray-400 mb-1">🛡️ Garansi: ${p.warranty}</div>
          <button ${!inStock ? "disabled" : ""} class="${btnClass}" onclick="addToChat('${p.name}')">
            ${inStock ? "💬 Tanya Produk Ini" : "Stok Habis"}
          </button>
        </div>
      </div>`;
    })
    .join("");
}

// ────────────────────────────────────────────────
// 6. CHAT MODAL — Open / Close
// ────────────────────────────────────────────────
function openChat() {
  const modal = document.getElementById("chat-modal");
  modal?.classList.remove("hidden");
  modal?.classList.add("flex");
  if (conversationHistory.length === 0) {
    appendBotMessage(
      "Halo! Selamat datang di **Smart Retail** 👋\n\nSaya adalah AI Assistant yang siap membantu Anda. Silakan tanyakan:\n- 📦 Produk & Stok\n- 💰 Harga\n- 🚚 Pengiriman\n- 🔄 Garansi & Retur\n- 🕗 Jam Operasional",
      false
    );
  }
  setTimeout(() => document.getElementById("chat-input")?.focus(), 100);
}

function closeChat() {
  const modal = document.getElementById("chat-modal");
  modal?.classList.add("hidden");
  modal?.classList.remove("flex");
}

function addToChat(productName) {
  openChat();
  setTimeout(() => {
    const input = document.getElementById("chat-input");
    if (input) {
      input.value = `Info tentang ${productName}`;
      input.focus();
    }
  }, 200);
}

// ────────────────────────────────────────────────
// 7. AI CHATBOT ENGINE
// ────────────────────────────────────────────────
function sendMessage() {
  const input = document.getElementById("chat-input");
  const text = input?.value.trim();
  if (!text) return;

  appendUserMessage(text);
  input.value = "";

  // Typing indicator
  const typingId = showTyping();
  setTimeout(() => {
    removeTyping(typingId);
    const response = generateResponse(text);
    appendBotMessage(response, true);
  }, 700 + Math.random() * 400);
}

function generateResponse(userText) {
  if (!storeData) return "Maaf, data toko belum termuat. Coba refresh halaman.";

  const text = userText.toLowerCase();

  // Cari FAQ yang cocok berdasarkan keywords
  const faqs = storeData.faqs;
  let bestMatch = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const score = faq.keywords.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  // Cari produk spesifik berdasarkan nama/tag
  const matchedProduct = storeData.products.find((p) =>
    p.tags.some((tag) => text.includes(tag)) || text.includes(p.name.toLowerCase())
  );

  // Respons produk spesifik
  if (matchedProduct && bestScore < 2) {
    const p = matchedProduct;
    const stockInfo =
      p.stock > 0
        ? `✅ **Tersedia** (${p.stock} unit)`
        : "❌ **Stok Habis**";
    return `${p.image_icon} **${p.name}**\n- Harga: **${formatRupiah(p.price)}**\n- Stok: ${stockInfo}\n- Garansi: **${p.warranty}**\n- ${p.description}`;
  }

  // Gunakan FAQ terbaik
  if (bestMatch && bestScore > 0) {
    return bestMatch.answer;
  }

  // Fallback — Pertanyaan di luar konteks
  return "Maaf, saya hanya dapat membantu memberikan informasi terkait **produk dan layanan toko kami**. 🙏\n\nCoba tanyakan tentang:\n- Harga atau stok produk\n- Jam operasional\n- Kebijakan pengiriman atau retur";
}

// ────────────────────────────────────────────────
// 8. CHAT RENDERING HELPERS
// ────────────────────────────────────────────────
function appendUserMessage(text) {
  const box = document.getElementById("chat-messages");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "flex justify-end animate-fade-in";
  el.innerHTML = `
    <div class="max-w-xs lg:max-w-sm bg-blue-600 text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
      ${escapeHtml(text)}
    </div>`;
  box.appendChild(el);
  scrollToBottom();
}

function appendBotMessage(text, animate = true) {
  const box = document.getElementById("chat-messages");
  if (!box) return;
  const el = document.createElement("div");
  el.className = `flex items-end gap-2 ${animate ? "animate-fade-in" : ""}`;
  el.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mb-1">
      AI
    </div>
    <div class="max-w-xs lg:max-w-sm bg-white border border-gray-200 text-gray-800 text-sm rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm leading-relaxed">
      ${markdownToHtml(text)}
    </div>`;
  box.appendChild(el);
  scrollToBottom();
}

function showTyping() {
  const box = document.getElementById("chat-messages");
  if (!box) return null;
  const id = "typing-" + Date.now();
  const el = document.createElement("div");
  el.id = id;
  el.className = "flex items-end gap-2";
  el.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mb-1">
      AI
    </div>
    <div class="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div class="flex gap-1 items-center h-4">
        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
        <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
      </div>
    </div>`;
  box.appendChild(el);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  if (id) document.getElementById(id)?.remove();
}

function scrollToBottom() {
  const box = document.getElementById("chat-messages");
  if (box) box.scrollTop = box.scrollHeight;
}

// ────────────────────────────────────────────────
// 9. UTILITIES
// ────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function markdownToHtml(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

// Handle Enter key in chat input
document.addEventListener("DOMContentLoaded", () => {
  const chatInput = document.getElementById("chat-input");
  chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Close modal when clicking backdrop
  document.getElementById("chat-modal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("chat-modal")) closeChat();
  });

  // Load data & bootstrap app
  loadData();
});
