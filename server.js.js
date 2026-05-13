const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// База данных (хранится в памяти сервера)
let users = [];
let items = [];
let chats = [];
let onlineUsers = new Set();

// Регистрация
app.post('/api/register', (req, res) => {
  const { username, password, avatar } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  const user = { id: Date.now().toString(), username, password, avatar };
  users.push(user);
  res.json({ success: true, user: { id: user.id, username: user.username, avatar: user.avatar } });
});

// Логин
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  res.json({ success: true, user: { id: user.id, username: user.username, avatar: user.avatar } });
});

// Получить все объявления
app.get('/api/items', (req, res) => {
  res.json(items);
});

// Создать объявление
app.post('/api/items', (req, res) => {
  const { sellerId, sellerName, sellerAvatar, name, price, desc, image } = req.body;
  const item = { 
    id: Date.now().toString(), 
    sellerId, sellerName, sellerAvatar, 
    name, price, desc, image, 
    createdAt: Date.now() 
  };
  items.push(item);
  res.json(item);
});

// Удалить объявление
app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const item = items.find(i => i.id === id);
  if (item && item.sellerId === userId) {
    items = items.filter(i => i.id !== id);
    res.json({ success: true });
  } else {
    res.status(403).json({ error: 'Not your item' });
  }
});

// Отправить сообщение
app.post('/api/messages', (req, res) => {
  const { itemId, fromId, toId, fromName, text } = req.body;
  let chat = chats.find(c => c.itemId === itemId && c.participants.includes(fromId) && c.participants.includes(toId));
  if (!chat) {
    chat = { id: Date.now().toString(), itemId, participants: [fromId, toId], messages: [] };
    chats.push(chat);
  }
  const message = { id: Date.now(), fromId, fromName, text, time: Date.now() };
  chat.messages.push(message);
  res.json(message);
});

// Получить чаты пользователя
app.get('/api/chats/:userId', (req, res) => {
  const { userId } = req.params;
  const userChats = chats.filter(c => c.participants.includes(userId));
  res.json(userChats);
});

// Обновить онлайн-статус
app.post('/api/online', (req, res) => {
  const { userId, isOnline } = req.body;
  if (isOnline) onlineUsers.add(userId);
  else onlineUsers.delete(userId);
  res.json({ online: Array.from(onlineUsers) });
});

// Получить онлайн-пользователей
app.get('/api/online', (req, res) => {
  res.json({ online: Array.from(onlineUsers) });
});
// Добавьте ЭТОТ код перед app.listen
const path = require('path');

// Отдаём index.html при заходе на главную страницу
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running!`);
  console.log(`📍 Доступно по адресам:`);
  console.log(`   http://localhost:${PORT}`);
  
  // Получаем локальный IP
  const os = require('os');
  const network = os.networkInterfaces();
  for (const name of Object.keys(network)) {
    for (const net of network[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`   http://${net.address}:${PORT} (для других устройств в сети)`);
      }
    }
  }
});
