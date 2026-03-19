/* ============================================================
   script.js — MadhuKumar G Portfolio
   Chat API: https://portfolio-ai.madhukumarg.workers.dev/
   ============================================================ */

const header      = document.getElementById("site-header");
const nav         = document.querySelector(".nav");
const navToggle   = document.querySelector(".nav-toggle");
const navLinks    = Array.from(document.querySelectorAll(".nav-links a"));

const chatToggleBtn = document.getElementById("ai-chat-toggle");
const chatWindow    = document.getElementById("ai-chat-window");
const chatCloseBtn  = document.getElementById("ai-chat-close");
const chatExpandBtn = document.getElementById("ai-chat-expand");
const chatMessages  = document.getElementById("ai-chat-messages");
const chatForm      = document.getElementById("ai-chat-input");
const chatInput     = document.getElementById("ai-input");
const sendBtn       = document.getElementById("ai-send-btn");
const promptChips   = Array.from(document.querySelectorAll(".prompt-chip"));

const cursorDot     = document.getElementById("cursor-dot");
const terminalOverlay = document.getElementById("terminal-overlay");
const terminalBody  = document.getElementById("terminal-body");
const terminalClose = document.getElementById("terminal-close");

let chatInitialized = false;
let inFlight = false;

/* ========================
   CUSTOM CURSOR
   ======================== */
function setupCursor() {
  if (!cursorDot) return;
  let raf;
  document.addEventListener("mousemove", e => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      cursorDot.style.left = e.clientX + "px";
      cursorDot.style.top  = e.clientY + "px";
    });
  });
}

/* ========================
   HEADER SCROLL
   ======================== */
function setupHeaderScroll() {
  const onScroll = () => {
    header?.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ========================
   REVEAL ANIMATIONS
   ======================== */
function setupReveal() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => e.target.classList.toggle("is-visible", e.isIntersecting)),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

/* ========================
   SMOOTH ANCHOR NAV
   ======================== */
function scrollToAnchor(hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  const offset = (header?.offsetHeight ?? 72) + 12;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
}

function setupNav() {
  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      const hash = link.getAttribute("href");
      if (!hash?.startsWith("#")) return;
      e.preventDefault();
      history.replaceState(null, "", hash);
      scrollToAnchor(hash);
      nav?.classList.remove("menu-open");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelector(".logo")?.addEventListener("click", e => {
    e.preventDefault();
    history.replaceState(null, "", "#top");
    window.scrollTo({ top: 0, behavior: "smooth" });
    nav?.classList.remove("menu-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });

  navToggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("menu-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      nav?.classList.remove("menu-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });

  /* Active nav link on scroll */
  const sections = Array.from(document.querySelectorAll("section[id], main[id]"));
  const linkMap  = {};
  navLinks.forEach(l => { const h = l.getAttribute("href"); if (h?.startsWith("#")) linkMap[h.slice(1)] = l; });

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => l.classList.remove("active"));
        linkMap[e.target.id]?.classList.add("active");
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => sectionObserver.observe(s));
}

/* ========================
   TERMINAL EASTER EGG
   ======================== */
const TERMINAL_LINES = [
  { cls: "t-prompt", text: "madhu@portfolio:~$ " },
  { cls: "t-cmd",    text: "cat about.txt" },
  { cls: "t-out",    text: "" },
  { cls: "t-out",    text: "╔══════════════════════════════════════╗" },
  { cls: "t-out",    text: "║   MadhuKumar G — Portfolio v2026    ║" },
  { cls: "t-out",    text: "╚══════════════════════════════════════╝" },
  { cls: "t-out",    text: "" },
  { cls: "t-accent", text: "role       // Linux DC R&D · AI Engineer" },
  { cls: "t-accent", text: "company    // Vigyanlabs Innovation Pvt Ltd" },
  { cls: "t-accent", text: "location   // Mysuru, Karnataka, IN" },
  { cls: "t-out",    text: "" },
  { cls: "t-out",    text: "infra      // Linux · Ceph · OVN · systemd" },
  { cls: "t-out",    text: "ml         // MLflow · Triton · PyTorch" },
  { cls: "t-out",    text: "api        // Flask · Nginx · PostgreSQL" },
  { cls: "t-out",    text: "lang       // Python · Shell · Java" },
  { cls: "t-out",    text: "" },
  { cls: "t-prompt", text: "madhu@portfolio:~$ " },
  { cls: "t-cursor", text: " " },
];

function openTerminal() {
  if (!terminalOverlay || !terminalBody) return;
  terminalBody.innerHTML = "";
  terminalOverlay.classList.add("active");

  let delay = 0;
  TERMINAL_LINES.forEach(({ cls, text }) => {
    delay += text === "" ? 40 : 80;
    setTimeout(() => {
      const span = document.createElement("span");
      span.className = cls;
      span.textContent = text;
      if (cls !== "t-cursor") terminalBody.appendChild(document.createTextNode("\n"));
      terminalBody.appendChild(span);
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }, delay);
  });
}

function closeTerminal() {
  terminalOverlay?.classList.remove("active");
}

function setupTerminal() {
  terminalClose?.addEventListener("click", closeTerminal);
  terminalOverlay?.addEventListener("click", e => {
    if (e.target === terminalOverlay) closeTerminal();
  });
}

/* ── Konami Code ── */
const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
let konamiIdx = 0;
function setupKonami() {
  document.addEventListener("keydown", e => {
    if (e.key === KONAMI[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === KONAMI.length) { konamiIdx = 0; openTerminal(); }
    } else {
      konamiIdx = 0;
    }
    if (e.key === "Escape") closeTerminal();
  });
}

/* ========================
   MARKDOWN RENDERING
   ======================== */
function appendInlineMarkdown(container, text) {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  text.split(pattern).filter(Boolean).forEach(chunk => {
    const boldMatch = chunk.match(/^\*\*([^*]+)\*\*$/);
    const codeMatch = chunk.match(/^`([^`]+)`$/);
    if (boldMatch) {
      const el = document.createElement("strong");
      el.textContent = boldMatch[1];
      container.appendChild(el);
    } else if (codeMatch) {
      const el = document.createElement("code");
      el.textContent = codeMatch[1];
      container.appendChild(el);
    } else {
      container.appendChild(document.createTextNode(chunk));
    }
  });
}

function appendFormattedMessage(container, text) {
  const lines = text.split(/\r?\n/);
  let currentList = null, currentListType = null;
  const closeList = () => { currentList = null; currentListType = null; };

  lines.forEach(line => {
    const trimmed      = line.trim();
    const bulletMatch  = trimmed.match(/^[-*]\s+(.+)/);
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);

    if (bulletMatch || orderedMatch) {
      const listType = bulletMatch ? "ul" : "ol";
      const content  = bulletMatch ? bulletMatch[1] : orderedMatch[2];
      if (!currentList || currentListType !== listType) {
        currentList = document.createElement(listType);
        currentList.className = listType === "ol" ? "chat-olist" : "chat-list";
        container.appendChild(currentList);
        currentListType = listType;
      }
      const li = document.createElement("li");
      appendInlineMarkdown(li, content);
      currentList.appendChild(li);
      return;
    }

    closeList();
    if (!trimmed) {
      const s = document.createElement("div");
      s.className = "chat-spacer";
      container.appendChild(s);
      return;
    }
    const p = document.createElement("p");
    appendInlineMarkdown(p, line);
    container.appendChild(p);
  });
}

function addMessage(text, role) {
  const msg = document.createElement("div");
  msg.className = `chat-msg ${role}`;
  if (role === "ai") appendFormattedMessage(msg, text);
  else msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function createTypingIndicator() {
  const w = document.createElement("div");
  w.className = "chat-msg ai typing";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    dot.className = "chat-dot";
    w.appendChild(dot);
  }
  return w;
}

/* ========================
   CHAT OPEN / CLOSE
   ======================== */
function openChat() {
  chatWindow.classList.add("open");
  chatWindow.setAttribute("aria-hidden", "false");
  if (!chatInitialized) {
    addMessage("Hello. I can help you with MadhuKumar's experience, projects, skills, and contact details.", "ai");
    chatInitialized = true;
  }
  setTimeout(() => chatInput.focus(), 80);
}
function closeChat() {
  chatWindow.classList.remove("open");
  chatWindow.setAttribute("aria-hidden", "true");
}

/* ========================
   SEND MESSAGE
   API call unchanged
   ======================== */
async function sendMessage() {
  const value = chatInput.value.trim();
  if (!value || inFlight) return;

  addMessage(value, "user");
  chatInput.value = "";
  sendBtn.disabled = true;
  inFlight = true;

  const typing = createTypingIndicator();
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const response = await fetch("https://portfolio-ai.madhukumarg.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: value })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    typing.remove();
    const answer =
      typeof data.reply === "string" && data.reply.trim()
        ? data.reply.trim()
        : "I could not read a response from the assistant service.";
    addMessage(answer, "ai");
  } catch {
    typing.remove();
    addMessage("I am having trouble connecting to the assistant service right now. Please try again.", "ai");
  } finally {
    inFlight = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

/* ========================
   CHAT SETUP
   ======================== */
function setupChat() {
  chatToggleBtn.addEventListener("click", () => {
    chatWindow.classList.contains("open") ? closeChat() : openChat();
  });
  chatCloseBtn.addEventListener("click", closeChat);
  chatExpandBtn.addEventListener("click", () => {
    const exp = chatWindow.classList.toggle("expanded");
    chatExpandBtn.textContent = exp ? "Compact" : "Expand";
  });
  chatForm.addEventListener("submit", e => { e.preventDefault(); sendMessage(); });
  promptChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      if (!prompt) return;
      if (!chatWindow.classList.contains("open")) openChat();
      chatInput.value = prompt;
      sendMessage();
    });
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && chatWindow.classList.contains("open")) closeChat();
  });
}

/* ========================
   INIT
   ======================== */
setupCursor();
setupHeaderScroll();
setupReveal();
setupNav();
setupTerminal();
setupKonami();
setupChat();