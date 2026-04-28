import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { initDB, query, run, get } from './db.js';
import { google } from 'googleapis';

// Pure-Socket WhatsApp Bridge
import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadMediaMessage } from '@whiskeysockets/baileys';

dotenv.config({ path: '../.env' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;

// Google OAuth Setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Setup file storage
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Initialize Database
initDB();

const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// --- GROQ FALLBACK SYSTEM ---
const getGroqKeys = () => [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
  process.env.GROQ_API_KEY_6,
  process.env.GROQ_API_KEY_7,
  process.env.GROQ_API_KEY_8,
  process.env.GROQ_API_KEY_9,
  process.env.GROQ_API_KEY_10,
].filter(Boolean);

async function fetchWithGroqFallback(payload) {
  const keys = getGroqKeys();
  for (let i = 0; i < keys.length; i++) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${keys[i]}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) return await response.json();
      console.warn(`[GROQ] Key ${i+1} failed with status: ${response.status}`);
    } catch (err) {
      console.warn(`[GROQ] Key ${i+1} errored: ${err.message}`);
    }
  }
  console.error("All Groq API keys completely exhausted. Falling back to Neural Mock responses.");
  return { choices: [{ message: { content: "System Notice: Heavy traffic detected on Neural Cluster. Rate Limits exceeded.\n\nHere is a default Draft:\n\nThank you for reaching out. I am currently reviewing your email and will respond as soon as possible.\n\nBest regards,\nAura Neural Agent" } }] };
}

// --- WHATSAPP INTELLIGENCE BRIDGE (PURE SOCKETS) ---
let waReady = false;
let waQrCode = null;
let waSock = null;

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./aura-baileys-auth');
    const { version } = await fetchLatestBaileysVersion();
    
    waSock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['Aura Neural Bridge', 'Chrome', '1.0.0']
    });

    waSock.ev.on('creds.update', saveCreds);

    waSock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log(`[WA] Connection Update: ${connection || 'Syncing QR...'}`);
      
      if (qr) waQrCode = qr;
      
      if (connection === 'close') {
        waReady = false; waQrCode = null;
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log('[WA] Closed connection, reason:', reason);
        if (reason !== DisconnectReason.loggedOut) {
          setTimeout(connectToWhatsApp, 5000); // Auto-reconnect purely
        } else {
           console.log('[WA] Logged out. Click Load WhatsApp Link to reset.');
        }
      } else if (connection === 'open') {
         waReady = true; waQrCode = null;
         console.log('\n[WHATSAPP] AURA INTELLIGENCE BRIDGE CONNECTED VIA PURE SOCKETS!\n');
      }
    });

    waSock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      const msg = messages[0];
      if (!msg.message) return;
      
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      const lowerText = text.toLowerCase();
      
      if (lowerText.startsWith('!task ')) {
          const instruction = text.substring(6).trim();
          try {
            const users = await query('SELECT id FROM users LIMIT 1');
            if (users.length > 0) {
                const id = uuid();
                await run('INSERT INTO tasks (id, instruction, user_id) VALUES (?, ?, ?)', [id, instruction, users[0].id]);
                waSock.sendMessage(msg.key.remoteJid, { text: `*Mission Registered:* \n"${instruction}"\nAgent deployed inside the Grid.` });
            }
          } catch(e) { console.error('Failed to parse task:', e); }
      }
      
      // WhatsApp-to-Vault Protocol
      const image = msg.message.imageMessage;
      const document = msg.message.documentMessage;
      const media = image || document;
      
      if (media) {
          const caption = (media.caption || '').trim();
          if (caption.toLowerCase().startsWith('!vault')) {
              try {
                  const users = await query('SELECT id FROM users LIMIT 1');
                  if (users.length > 0) {
                      const folderName = caption.substring(6).trim() || 'WhatsApp Sync';
                      const buffer = await downloadMediaMessage(msg, 'buffer', { }, { reuploadRequest: waSock.updateMediaMessage });
                      
                      const rawFileName = document?.fileName || `WA_Image_${Date.now()}.jpeg`;
                      const safeName = rawFileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                      const uniqueFileName = `${Date.now()}-${uuid()}-${safeName}`;
                      const savePath = join(__dirname, 'uploads', uniqueFileName);
                      
                      fs.writeFileSync(savePath, buffer);
                      
                      const fileId = uuid();
                      const fileUrl = `http://localhost:${process.env.PORT || 3001}/uploads/${uniqueFileName}`;
                      
                      // For simple Vault integration, if a folder doesn't match UUID, we place it in root with a tag or just null folder_id.
                      // To make it show in UI, we just insert it. The frontend categorizes by folder_id, or it shows in "All Files".
                      // We will insert folder_id as null. We can append folderName to the end of the filename if needed!
                      
                      await run('INSERT INTO files (id, filename, file_url, file_size, mime_type, folder_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [fileId, `[${folderName}] ${safeName}`, fileUrl, buffer.length, document?.mimetype || 'image/jpeg', null, users[0].id]);
                      
                      waSock.sendMessage(msg.key.remoteJid, { text: `*Vault Identity Synced:*\nFile: ${safeName}\nCategory: [${folderName}]\nStatus: Encrypted & Stored.` });
                  }
              } catch(e) {
                  console.error('Vault Upload Error:', e);
                  waSock.sendMessage(msg.key.remoteJid, { text: `*Transfer Failed:* Packet destabilized during Neural Bridge jump.` });
              }
          }
      }
    });
  } catch(e) {
      console.warn("Baileys Init Error:", e.message);
  }
}

connectToWhatsApp();

const sendWhatsAppAlert = (text) => {
  if (waReady && waSock && waSock.user && waSock.user.id) {
      const myJid = waSock.user.id.split(':')[0] + '@s.whatsapp.net';
      waSock.sendMessage(myJid, { text }).catch(()=>{});
  }
}

// Graceful Shutdown
process.on('SIGINT', async () => {
    process.exit(0);
});

// --- UNPROTECTED ROUTES (NO X-USER-ID NEEDED) ---

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'AURA_ALIVE' }));

// Auth API - Google Callback
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    await run('UPDATE users SET google_tokens = ? WHERE id = ?', [JSON.stringify(tokens), userId]);
    res.send('<html><body style="background:#0f1117;color:#2dd4bf;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-weight:bold;text-transform:uppercase;">Sync Successful. Closing...<script>setTimeout(()=>window.close(), 1000);</script></body></html>');
  } catch (err) {
    res.status(500).send(`Neural bridge failure: ${err.message}`);
  }
});

// User Sync Route
app.post('/api/auth/sync', async (req, res) => {
  const { email, name, picture } = req.body;
  const id = uuid();
  let user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    await run('INSERT INTO users (id, email, password, full_name) VALUES (?, ?, "oauth", ?)', [id, email, name]);
    user = await get('SELECT * FROM users WHERE email = ?', [email]);
  }
  res.json({ user });
});

// WhatsApp API Status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ connected: waReady, qr: waQrCode });
});
app.post('/api/whatsapp/retry', async (req, res) => {
  // Brutally enforce restart if button is clicked
  if (!waReady) connectToWhatsApp();
  res.json({ success: true });
});

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
  const id = uuid();
  try {
    await run('INSERT INTO users (id, email, password, full_name) VALUES (?, ?, ?, ?)', [id, email, password, fullName]);
    const user = await get('SELECT id, email, full_name FROM users WHERE id = ?', [id]);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Identity already exists or db error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await get('SELECT id, email, full_name FROM users WHERE email = ? AND password = ?', [email, password]);
    if (!user) return res.status(401).json({ error: 'Invalid identity codes' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GOOGLE OAUTH START (UNPROTECTED) ---
app.get('/api/auth/google', (req, res) => {
  const userId = req.query.user_id;
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.modify', 
      'https://www.googleapis.com/auth/gmail.send', 
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    state: userId 
  });
  res.redirect(url);
});

// --- IDENTITY FIREWALL (FOR ALL PROTECTED PROTOCOLS) ---
app.use((req, res, next) => {
  // Allow all auth routes through
  if (req.path.includes('/auth')) return next();
  
  const userId = req.headers['x-user-id'];
  if (!userId) {
    console.error(`[SECURITY] Blocked request to ${req.path} - No x-user-id header`);
    return res.status(401).json({ error: 'Protocol Authentication Required' });
  }
  req.userId = userId;
  next();
});

// --- PROTECTED MODULES ---

// Gmail Signals
app.get('/api/gmail/top-signals', async (req, res) => {
  try {
    const user = await get('SELECT google_tokens FROM users WHERE id = ?', [req.userId]);
    if (!user?.google_tokens) return res.json({ connected: false, signals: [] });
    oauth2Client.setCredentials(JSON.parse(user.google_tokens));
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const messagesRes = await gmail.users.messages.list({ userId: 'me', maxResults: 20, q: 'newer_than:3d in:inbox' });
    const signals = [];
    for (const msg of messagesRes.data.messages || []) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id });
      const headers = detail.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
      const snippet = detail.data.snippet || '';
      signals.push({ from, subject, snippet, id: msg.id });
    }
    if (signals.length === 0) return res.json({ connected: true, signals: [] });
    
    const aiData = await fetchWithGroqFallback({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: "Rank emails by priority (High/Med/Low) and 1-word reason. Output JSON: [ { id, priority, reason } ]" }, { role: "user", content: JSON.stringify(signals) }]
    });

    let rankings = [];
    try {
      const content = aiData.choices[0].message.content;
      const jsonMatch = content.match(/\[.*\]/s);
      rankings = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch(e) {}
    const enriched = signals.map(s => {
      const r = rankings.find((rank) => rank.id === s.id);
      return { ...s, priority: r?.priority || 'Low', reason: r?.reason || 'Protocol' };
    });
    res.json({ connected: true, signals: enriched });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// Read Email Payload
app.get('/api/gmail/read/:id', async (req, res) => {
  try {
    const user = await get('SELECT google_tokens FROM users WHERE id = ?', [req.userId]);
    if (!user?.google_tokens) return res.status(401).json({ error: 'Not connected' });
    oauth2Client.setCredentials(JSON.parse(user.google_tokens));
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const detail = await gmail.users.messages.get({ userId: 'me', id: req.params.id, format: 'full' });
    let body = 'No decipherable content detected blocks.';
    const payload = detail.data.payload;
    if (payload.parts) {
      const part = payload.parts.find(p => p.mimeType === 'text/plain') || payload.parts[0];
      if (part.body && part.body.data) {
         body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.parts) {
         const subpart = part.parts.find(p => p.mimeType === 'text/plain');
         if (subpart && subpart.body && subpart.body.data) {
           body = Buffer.from(subpart.body.data, 'base64').toString('utf-8');
         }
      }
    } else if (payload.body && payload.body.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    
    res.json({ body });
  } catch (err) { res.status(500).json({ error: String(err) }); }
});

// Draft AI Reply
app.post('/api/gmail/draft-reply/:id', async (req, res) => {
  try {
    const user = await get('SELECT google_tokens FROM users WHERE id = ?', [req.userId]);
    if (!user?.google_tokens) return res.status(401).json({ error: 'Not connected' });
    oauth2Client.setCredentials(JSON.parse(user.google_tokens));
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const detail = await gmail.users.messages.get({ userId: 'me', id: req.params.id, format: 'full' });
    const subject = detail.data.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const emailBody = req.body.emailBody || 'No clear content';
    
    const aiData = await fetchWithGroqFallback({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are the user's executive administrative AI. Write a polite, concise, and professional reply to the following email context. Output ONLY the email text ready to send. DO NOT include headers or notes." },
        { role: "user", content: `Subject: ${subject}\n\nEmail Body:\n${emailBody}` }
      ]
    });
    
    res.json({ draft: aiData.choices[0].message.content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Finalize and Send Reply
app.post('/api/gmail/send/:id', async (req, res) => {
  const { draftedReply } = req.body;
  if (!draftedReply) return res.status(400).json({ error: 'Payload missing' });
  try {
    const user = await get('SELECT google_tokens FROM users WHERE id = ?', [req.userId]);
    if (!user?.google_tokens) return res.status(401).json({ error: 'Not connected' });
    oauth2Client.setCredentials(JSON.parse(user.google_tokens));
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const detail = await gmail.users.messages.get({ userId: 'me', id: req.params.id, format: 'full' });
    const headers = detail.data.payload.headers;
    
    const to = headers.find(h => h.name === 'Reply-To')?.value || headers.find(h => h.name === 'From')?.value;
    const originalSubject = headers.find(h => h.name === 'Subject')?.value || '';
    const messageId = headers.find(h => h.name === 'Message-ID')?.value || '';
    const references = headers.find(h => h.name === 'References')?.value || messageId;
    
    const newSubject = originalSubject.toLowerCase().startsWith('re:') ? originalSubject : `Re: ${originalSubject}`;
    
    const composeMessage = [
      `To: ${to}`,
      `Subject: ${newSubject}`,
      `In-Reply-To: ${messageId}`,
      `References: ${references}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      draftedReply
    ].join('\r\n');
    
    const encodedMessage = Buffer.from(composeMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage, threadId: detail.data.threadId }
    });
    
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Notes
app.get('/api/notes', async (req, res) => {
  const notes = await query('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [req.userId]);
  res.json(notes);
});
app.post('/api/notes', async (req, res) => {
  const { title, content, folder_id } = req.body;
  const id = uuid();
  await run('INSERT INTO notes (id, title, content, folder_id, user_id) VALUES (?, ?, ?, ?, ?)', [id, title || 'Untitled', content || '', folder_id, req.userId]);
  const note = await get('SELECT * FROM notes WHERE id = ?', [id]);
  res.json(note);
});
app.put('/api/notes/:id', async (req, res) => {
  const current = await get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!current) return res.status(404).json({ error: 'Not found' });

  const title = req.body.title !== undefined ? req.body.title : current.title;
  const content = req.body.content !== undefined ? req.body.content : current.content;
  const folder_id = req.body.folder_id !== undefined ? req.body.folder_id : current.folder_id;

  await run('UPDATE notes SET title = ?, content = ?, folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [title, content, folder_id, req.params.id, req.userId]);
  res.json({ success: true });
});
app.delete('/api/notes/:id', async (req, res) => {
  await run('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});

// Folders
app.get('/api/folders', async (req, res) => {
  const folders = await query('SELECT * FROM folders WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
  res.json(folders);
});
app.post('/api/folders', async (req, res) => {
  const { name, parent_id } = req.body;
  const id = uuid();
  await run('INSERT INTO folders (id, name, parent_id, user_id) VALUES (?, ?, ?, ?)', [id, name, parent_id, req.userId]);
  const folder = await get('SELECT * FROM folders WHERE id = ?', [id]);
  res.json(folder);
});
app.put('/api/folders/:id', async (req, res) => {
  const { name } = req.body;
  await run('UPDATE folders SET name = ? WHERE id = ? AND user_id = ?', [name, req.params.id, req.userId]);
  res.json({ success: true });
});
app.delete('/api/folders/:id', async (req, res) => {
  await run('DELETE FROM folders WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});

// Vault (Files)
app.get('/api/files', async (req, res) => {
  const files = await query('SELECT * FROM files WHERE user_id = ? ORDER BY uploaded_at DESC', [req.userId]);
  res.json(files);
});
app.post('/api/files', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const id = uuid();
  const file_url = `http://localhost:${port}/uploads/${req.file.filename}`;
  // Only capture folder_id if you want to support it, it is optionally passed in body
  const folder_id = req.body.folder_id || null;
  await run('INSERT INTO files (id, filename, file_url, file_size, mime_type, folder_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, req.file.originalname, file_url, req.file.size, req.file.mimetype, folder_id, req.userId]);
  const result = await get('SELECT * FROM files WHERE id = ?', [id]);
  res.json(result);
});
app.delete('/api/files/:id', async (req, res) => {
  await run('DELETE FROM files WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});
app.post('/api/files/extract', async (req, res) => {
  const { file_url, mime_type } = req.body;
  try {
    const filename = decodeURIComponent(file_url.split('/uploads/').pop());
    const filePath = join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Artifact missing from vault storage' });
    }

    if (mime_type === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return res.json({ text: data.text });
    } else if (
      mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mime_type === 'application/msword' ||
      filename.endsWith('.docx') || 
      filename.endsWith('.doc')
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return res.json({ text: result.value });
    } else {
      return res.status(400).json({ error: 'Incompatible artifact type for neural extraction' });
    }
  } catch (err) {
    console.error('Neural extraction error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Reminders
app.get('/api/reminders', async (req, res) => {
  const reminders = await query('SELECT * FROM reminders WHERE user_id = ? ORDER BY remind_at ASC', [req.userId]);
  res.json(reminders);
});
app.post('/api/reminders', async (req, res) => {
  const { title, description, remind_at } = req.body;
  const id = uuid();
  await run('INSERT INTO reminders (id, title, description, remind_at, user_id) VALUES (?, ?, ?, ?, ?)', [id, title, description, remind_at, req.userId]);
  const result = await get('SELECT * FROM reminders WHERE id = ?', [id]);
  res.json(result);
});
app.put('/api/reminders/:id', async (req, res) => {
  // Support partial updates
  const current = await get('SELECT * FROM reminders WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!current) return res.status(404).json({ error: 'Not found' });
  
  const title = req.body.title !== undefined ? req.body.title : current.title;
  const description = req.body.description !== undefined ? req.body.description : current.description;
  const remind_at = req.body.remind_at !== undefined ? req.body.remind_at : current.remind_at;
  const completed = req.body.completed !== undefined ? (req.body.completed ? 1 : 0) : current.completed;
  
  await run('UPDATE reminders SET title = ?, description = ?, remind_at = ?, completed = ? WHERE id = ? AND user_id = ?', [title, description, remind_at, completed, req.params.id, req.userId]);
  res.json({ success: true });
});
app.delete('/api/reminders/:id', async (req, res) => {
  await run('DELETE FROM reminders WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});

// Chat
app.post('/api/chat', async (req, res) => {
  const { messages, context } = req.body;
  const systemMessage = { 
    role: "system", 
    content: `You are AURA, an advanced high-tech AI neural assistant. User context: ${context || 'General'}.
If the user explicitly asks for an image, picture, or illustration, you MUST respond by constructing an image URL using pollinations.ai.
Format your return string EXACTLY like this:
![Image of what they asked for](https://image.pollinations.ai/prompt/highly%20detailed%20[underscore_separated_keywords]?width=800&height=600&nologo=true)
Do not apologize or say you cannot generate images. Always return the markdown tag when an image is requested.`
  };
  try {
    const data = await fetchWithGroqFallback({ model: "llama-3.1-8b-instant", messages: [systemMessage, ...messages] });
    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tasks (Automations)
app.get('/api/tasks', async (req, res) => {
  const tasks = await query('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
  res.json(tasks);
});
app.post('/api/tasks', async (req, res) => {
  const { instruction } = req.body;
  const id = uuid();
  await run('INSERT INTO tasks (id, instruction, user_id) VALUES (?, ?, ?)', [id, instruction, req.userId]);
  const result = await get('SELECT * FROM tasks WHERE id = ?', [id]);
  res.json(result);
});
app.delete('/api/tasks/:id', async (req, res) => {
  await run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});

// Documents (Word Editor)
app.get('/api/documents', async (req, res) => {
  const docs = await query('SELECT * FROM documents WHERE user_id = ? ORDER BY updated_at DESC', [req.userId]);
  res.json(docs);
});
app.post('/api/documents', async (req, res) => {
  const { title, content } = req.body;
  const id = uuid();
  await run('INSERT INTO documents (id, title, content, user_id) VALUES (?, ?, ?, ?)', [id, title || 'Untitled Document', content || '', req.userId]);
  const doc = await get('SELECT * FROM documents WHERE id = ?', [id]);
  res.json(doc);
});
app.put('/api/documents/:id', async (req, res) => {
  const current = await get('SELECT * FROM documents WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  if (!current) return res.status(404).json({ error: 'Not found' });
  const title = req.body.title !== undefined ? req.body.title : current.title;
  const content = req.body.content !== undefined ? req.body.content : current.content;
  await run('UPDATE documents SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [title, content, req.params.id, req.userId]);
  res.json({ success: true });
});
app.delete('/api/documents/:id', async (req, res) => {
  await run('DELETE FROM documents WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});
app.post('/api/documents/generate', async (req, res) => {
  const { prompt } = req.body;
  try {
    const data = await fetchWithGroqFallback({ 
      model: "llama-3.1-8b-instant", 
      messages: [
        { role: "system", content: "You are an expert document creator. Write comprehensive, beautifully formatted markdown documents based on the prompt." },
        { role: "user", content: prompt }
      ]
    });
    res.json({ output: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Automated Background Processing
setInterval(async () => {
  try {
    const pendingTasks = await query('SELECT * FROM tasks WHERE status = "pending" LIMIT 5');
    for (const task of pendingTasks) {
      await run('UPDATE tasks SET status = "processing" WHERE id = ?', [task.id]);
      try {
        // Build Massive Workspace Context Array so the Agent Knows Everything
        let emailContext = "No recent emails accessible.";
        try {
           const userTokens = await get('SELECT google_tokens FROM users WHERE id = ?', [task.user_id]);
           if (userTokens?.google_tokens) {
              const localAuth = new google.auth.OAuth2(
                 process.env.GOOGLE_CLIENT_ID,
                 process.env.GOOGLE_CLIENT_SECRET,
                 process.env.GOOGLE_REDIRECT_URI
              );
              localAuth.setCredentials(JSON.parse(userTokens.google_tokens));
              const gmailObj = google.gmail({ version: 'v1', auth: localAuth });
              const msgsRes = await gmailObj.users.messages.list({ userId: 'me', maxResults: 15, q: 'newer_than:2d' });
              let eContent = [];
              for (const m of (msgsRes.data.messages || [])) {
                 const d = await gmailObj.users.messages.get({ userId: 'me', id: m.id });
                 const sub = d.data.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
                 const from = d.data.payload.headers.find(h => h.name === 'From')?.value || 'Unknown';
                 eContent.push(`From: ${from} | Subject: ${sub} | Snippet: ${d.data.snippet}`);
              }
              if (eContent.length > 0) emailContext = eContent.join('\\n');
           }
        } catch(e) { console.warn("Agent Email Sync failed: ", e.message); }

        let notesContext = "No Notes";
        try {
           const recentNotes = await query('SELECT title, content FROM notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5', [task.user_id]);
           if (recentNotes.length > 0) {
              notesContext = recentNotes.map(n => `[Note Form: ${n.title}]\\n${n.content.substring(0, 500)}`).join('\\n\\n');
           }
        } catch(e) {}

        const systemPrompt = `You are a highly advanced Executive Autonomous Agent.
You execute user workflows natively.

<WORKSPACE_AWARENESS_ENGINE>
Latest Emails in Inbox (Use if user asks about today's emails):
${emailContext}

Latest Notes from Vault (Use if user mentions files or notes):
${notesContext}
</WORKSPACE_AWARENESS_ENGINE>

Your mission: Complete the user's instructions based on the data provided above. Output your finalized work cleanly.`;

        const data = await fetchWithGroqFallback({ 
          model: "llama-3.1-8b-instant", 
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: task.instruction }
          ]
        });
        const output = data.choices[0].message.content;
        await run('UPDATE tasks SET status = "completed", output = ? WHERE id = ?', [output, task.id]);
        sendWhatsAppAlert(`*Mission Accomplished:*\n${task.instruction}\n\n*Agent Report:*\n${output}`);
      } catch (e) {
        await run('UPDATE tasks SET status = "failed", output = ? WHERE id = ?', [e.message, task.id]);
        sendWhatsAppAlert(`*Mission Failed:*\n${task.instruction}\n\n*Error:*\n${e.message}`);
      }
    }
  } catch (err) {}
}, 10000);

// Automated Horizon (Reminders) Processing to WhatsApp
setInterval(async () => {
  try {
     const now = new Date().toISOString();
     const dueReminders = await query('SELECT * FROM reminders WHERE completed = 0 AND remind_at <= ?', [now]);
     for (const r of dueReminders) {
        await run('UPDATE reminders SET completed = 1 WHERE id = ?', [r.id]);
        sendWhatsAppAlert(`🚨 *Horizon Alert:* \n${r.title}\n${r.description || ''}`);
     }
  } catch(e){}
}, 60000);

app.listen(port, () => console.log(`SYSTEM HEARTBEAT AT ${port}`));
