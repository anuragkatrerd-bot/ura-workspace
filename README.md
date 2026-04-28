# 💠 Aura Agentic Workspace

Aura is a high-performance, autonomous neural agent environment engineered to centralize, orchestrate, and automate your digital life. It bridges the gap between a standalone AI chatbot and a highly intelligent administrative proxy by directly hijacking native Google and Meta communication infrastructures.

Built with an unapologetic, ultra-premium dark-mode cyberpunk aesthetic, Aura feels less like a web portal and more like a master control terminal for a sentient AI.

---

## ⚡ Core Systems Architecture

Aura operates on a split-infrastructure model ensuring frictionless synchronization between its web frontend and the autonomic backend.

- **Neural Frontend:** React + Vite + Framer Motion (Tailwind CSS for ultra-flexible glassmorphic design)
- **Engine Core:** Node.js with Express
- **Memory Storage:** Baremetal SQLite (Hyper-fast, ultra-low latency single-file relational mappings)
- **Intelligence Cluster:** Groq Cloud APIs (Llama 3.1 8B Instant & 70B Versatile clusters)

---

## 🔥 Enterprise Features & Capabilities

### 1. Pure WebSocket WhatsApp Bridge
Instead of relying on fragile, headless Chrome-based web injections, Aura utilizes `@whiskeysockets/baileys` to communicate transparently via WhatsApp server WebSockets.
*   **Agent Deployment:** Send a text to your connected number like `!task Code a Python Fibonacci script` and the AI instantly queues it, processes it in the background, updates your Nexus GUI visually, and pushes the output straight back to your phone.
*   **Vault Interception:** Forward an image, PDF, or document from your phone with the caption `!vault` (e.g., `!vault Receipts`), and Aura immediately rips the binary payload from WhatsApp, downloads it securely, and logs it effortlessly into your web GUI's Vault.

### 2. Autonomous Gmail Auto-Responder Proxy
Aura doesn’t just read your email—it natively replies on your behalf.
*   **Neural Signals Dashboard:** Aura syncs with your Gmail via a strictly controlled Google OAuth 2.0 flow. By stripping generic marketing spam natively with AI analysis, it only surfaces the top high-level emails and labels them with a Priority Score in your GUI.
*   **"Auto-Generate AI Reply" Engine:** When you open an email in the GUI, Aura can autonomously generate a structured, professional reply draft based on context. Hitting **Deploy Message** seamlessly constructs an RFC-2822 standard email—including perfect `In-Reply-To` Thread tracing—and fires it straight back through Google API servers. 

### 3. Asynchronous Background Automation
Aura polls the SQLite task database for pending WhatsApp operations and resolves them entirely behind the scenes, injecting massive context loops (recent emails, notes, vault data) to provide absolute intelligence superiority to the AI agent executing the task.

### 4. Dynamic Web Ecosystem
*   **The Nexus (Dashboard):** Provides a comprehensive readout of active connections, high-priority email signals, pending horizon alarms, and real-time execution outputs.
*   **Vault Management:** An aesthetic interface managing internal database objects and file blobs safely loaded into native preview terminals.
*   **Notes & Documents:** Clean Markdown editors that immediately commit iterations to database arrays, available for the agent's background reading later.

---

## 🛠 Flow Initialization

Run the web interface and the agent bridge completely independently to prevent development crash looping.

### Prerequisites
*   Node.js Ecosystem
*   Verified Google OAuth 2.0 Client Credentials 
*   Active Groq API Key

### Deploying the Nexus (Frontend)
```bash
cd ./src
npm run dev
```

### Engaging the Agent Bridge (Backend)
```bash
cd ./server
npm run server
```

1. Open your browser to the local Vite URL.
2. Click **Synchronize Gmail** to establish neural verification.
3. Click **Load WhatsApp Link** in the Dashboard to render the QR Code and pair your administrative device.

---

*“Your administrative footprint, completely automated.”*
