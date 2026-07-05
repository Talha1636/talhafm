const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

// Güvenlik ve performans için ayarlar
const io = new Server(server, { 
    cors: { origin: "*" }, 
    pingInterval: 10000, 
    pingTimeout: 5000 
});

// Bağlanan kullanıcılar (Memory - Production'da Redis kullanılmalı)
const users = new Map();

io.on('connection', (socket) => {
    console.log(`[+] Bağlandı: ${socket.id}`);

    // GİRİŞ YAPMA
    socket.on('login', (name) => {
        users.set(socket.id, { id: socket.id, name: name, micOn: false, isSpeaking: false });
        // Yeni giren kişiye anlık kullanıcı listesini gönder
        socket.emit('user_list', Array.from(users.values()));
        // Diğerlerine yeni kişi geldiğini bildir
        socket.broadcast.emit('system_msg', { text: `${name} odaya girdi.` });
        socket.broadcast.emit('user_joined', { id: socket.id, name: name, micOn: false, isSpeaking: false });
    });

    // MESAJ GÖNDERME
    socket.on('send_msg', (data) => {
        const user = users.get(socket.id);
        if (!user) return;
        const msg = { id: Date.now(), user: user.name, text: data.text, time: getTime() };
        io.emit('new_msg', msg); // Herkese gönder
    });

    // MİKROFON DURUMU GÜNCELLEME
    socket.on('toggle_mic', (isOn) => {
        const user = users.get(socket.id);
        if (user) {
            user.micOn = isOn;
            io.emit('user_mic_update', { id: socket.id, micOn: isOn });
        }
    });

    // KONUŞMA DURUMU (Görsel için)
    socket.on('speaking_status', (isSpeaking) => {
        const user = users.get(socket.id);
        if (user) {
            user.isSpeaking = isSpeaking;
            socket.broadcast.emit('user_speaking_update', { id: socket.id, isSpeaking: isSpeaking });
        }
    });

    // --- WEBRTC SIGNALING ---
    socket.on('join_voice_net', () => {
        socket.broadcast.emit('new_peer', { senderId: socket.id });
    });

    socket.on('offer', (data) => {
        socket.to(data.targetId).emit('offer', { senderId: socket.id, offer: data.offer });
    });

    socket.on('answer', (data) => {
        socket.to(data.targetId).emit('answer', { senderId: socket.id, answer: data.answer });
    });

    socket.on('ice_candidate', (data) => {
        socket.to(data.targetId).emit('ice_candidate', { senderId: socket.id, candidate: data.candidate });
    });

    // ÇIKIŞ
    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            io.emit('system_msg', { text: `${user.name} odadan çıktı.` });
            io.emit('user_left', { id: socket.id });
            users.delete(socket.id);
        }
        console.log(`[-] Çıktı: ${socket.id}`);
    });
});

function getTime() {
    const d = new Date();
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda dinleniyor...`));
