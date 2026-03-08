const header = document.getElementById("site-header");
const nav = document.querySelector(".nav");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = Array.from(document.querySelectorAll(".nav-links a"));

const chatToggleBtn = document.getElementById("ai-chat-toggle");
const chatWindow = document.getElementById("ai-chat-window");
const chatCloseBtn = document.getElementById("ai-chat-close");
const chatExpandBtn = document.getElementById("ai-chat-expand");
const chatMessages = document.getElementById("ai-chat-messages");
const chatForm = document.getElementById("ai-chat-input");
const chatInput = document.getElementById("ai-input");
const sendBtn = document.getElementById("ai-send-btn");
const promptChips = Array.from(document.querySelectorAll(".prompt-chip"));

let chatInitialized = false;
let inFlight = false;

function setupRevealAnimations() {
    const revealTargets = document.querySelectorAll(".hero, .section, .card, .project-card, .hero-metrics article, .tags span, .contact-grid p, .profile-card, .hero-cta .btn");

    revealTargets.forEach((el) => {
        el.classList.add("reveal");
    });

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-visible", entry.isIntersecting);
            });
        },
        {
            threshold: 0.14,
            rootMargin: "0px 0px -6% 0px"
        }
    );

    revealTargets.forEach((el) => revealObserver.observe(el));
}

function scrollToAnchor(hash) {
    const target = document.querySelector(hash);

    if (!target) {
        return;
    }

    const headerHeight = header.offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 10;

    window.scrollTo({
        top,
        behavior: "smooth"
    });
}

function setupSmoothAnchorNavigation() {
    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const hash = link.getAttribute("href");
            if (!hash || !hash.startsWith("#")) {
                return;
            }

            event.preventDefault();
            history.replaceState(null, "", hash);
            scrollToAnchor(hash);
            nav?.classList.remove("menu-open");
            navToggle?.setAttribute("aria-expanded", "false");
        });
    });

    const logo = document.querySelector(".logo");
    logo?.addEventListener("click", (event) => {
        event.preventDefault();
        history.replaceState(null, "", "#top");
        scrollToAnchor("#top");
        nav?.classList.remove("menu-open");
        navToggle?.setAttribute("aria-expanded", "false");
    });
}

function setupMobileNavigation() {
    if (!nav || !navToggle) {
        return;
    }

    navToggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("menu-open");
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            nav.classList.remove("menu-open");
            navToggle.setAttribute("aria-expanded", "false");
        }
    });
}

function appendInlineMarkdown(container, text) {
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    const chunks = text.split(pattern).filter(Boolean);

    chunks.forEach((chunk) => {
        const boldMatch = chunk.match(/^\*\*([^*]+)\*\*$/);
        const codeMatch = chunk.match(/^`([^`]+)`$/);

        if (boldMatch) {
            const strong = document.createElement("strong");
            strong.textContent = boldMatch[1];
            container.appendChild(strong);
            return;
        }

        if (codeMatch) {
            const code = document.createElement("code");
            code.textContent = codeMatch[1];
            container.appendChild(code);
            return;
        }

        container.appendChild(document.createTextNode(chunk));
    });
}

function appendFormattedMessage(container, text) {
    const lines = text.split(/\r?\n/);
    let currentList = null;
    let currentListType = null;

    const closeList = () => {
        currentList = null;
        currentListType = null;
    };

    lines.forEach((line) => {
        const trimmed = line.trim();
        const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
        const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);

        if (bulletMatch || orderedMatch) {
            const listType = bulletMatch ? "ul" : "ol";
            const content = bulletMatch ? bulletMatch[1] : orderedMatch[2];

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
            const spacer = document.createElement("div");
            spacer.className = "chat-spacer";
            container.appendChild(spacer);
            return;
        }

        const paragraph = document.createElement("p");
        appendInlineMarkdown(paragraph, line);
        container.appendChild(paragraph);
    });
}

function addMessage(text, role) {
    const msg = document.createElement("div");
    msg.className = `chat-msg ${role}`;

    if (role === "ai") {
        appendFormattedMessage(msg, text);
    } else {
        msg.textContent = text;
    }

    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function createTypingIndicator() {
    const wrapper = document.createElement("div");
    wrapper.className = "chat-msg ai typing";

    for (let i = 0; i < 3; i += 1) {
        const dot = document.createElement("span");
        dot.className = "chat-dot";
        wrapper.appendChild(dot);
    }

    return wrapper;
}

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

async function sendMessage() {
    const value = chatInput.value.trim();
    if (!value || inFlight) {
        return;
    }

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

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        typing.remove();

        const answer = typeof data.reply === "string" && data.reply.trim()
            ? data.reply.trim()
            : "I could not read a response from the assistant service.";

        addMessage(answer, "ai");
    } catch (error) {
        typing.remove();
        addMessage("I am having trouble connecting to the assistant service right now. Please try again.", "ai");
    } finally {
        inFlight = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

function setupChat() {
    chatToggleBtn.addEventListener("click", () => {
        const isOpen = chatWindow.classList.contains("open");
        if (isOpen) {
            closeChat();
        } else {
            openChat();
        }
    });

    chatCloseBtn.addEventListener("click", closeChat);

    chatExpandBtn.addEventListener("click", () => {
        chatWindow.classList.toggle("expanded");
        chatExpandBtn.textContent = chatWindow.classList.contains("expanded") ? "Compact" : "Expand";
    });

    chatForm.addEventListener("submit", (event) => {
        event.preventDefault();
        sendMessage();
    });

    promptChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            const prompt = chip.getAttribute("data-prompt");
            if (!prompt) {
                return;
            }

            if (!chatWindow.classList.contains("open")) {
                openChat();
            }

            chatInput.value = prompt;
            sendMessage();
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && chatWindow.classList.contains("open")) {
            closeChat();
        }
    });
}

setupRevealAnimations();
setupMobileNavigation();
setupSmoothAnchorNavigation();
setupChat();



