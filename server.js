const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Anlık mesajları ve kullanıcıları tutalım
let messages = [];
let users = {};

io.on('connection', (socket) => {
    console.log('Yeni bağlantı:', socket.id);

    socket.on('join_room', (data) => {
        socket.join(data.room);
        users[socket.id] = { name: data.name, room: data.room, id: socket.id };
        
        // Odaya girişi tüm odaya bildir
        io.to(data.room).emit('user_list', Object.values(users).filter(u => u.room === data.room));
        io.to(data.room).emit('system_msg', { text: data.name + ' odaya bağlandı.' });
        
        // Gecikmeli mesajları gönder
        socket.emit('load_messages', messages.filter(m => m.room === data.room));
    });

    socket.on('send_message', (data) => {
        const msg = { id: Date.now(), user: data.name, text: data.text, room: data.room, time: getTime() };
        messages.push(msg);
        io.to(data.room).emit('new_message', msg); // Herkese anlık gönder
    });

    // --- WEBRTC SIGNALING ---
    socket.on('join_voice', (data) => {
        socket.join(data.room + '_voice');
        // Odadaki diğerlerine offer isteklerini bildir
        socket.to(data.room + '_voice').emit('new_peer', { senderId: socket.id, name: data.name });
    });

    socket.on('offer', (data) => io.to(data.targetId).emit('offer', { senderId: socket.id, offer: data.offer }));
    socket.on('answer', (data) => io.to(data.targetId).emit('answer', { senderId: socket.id, answer: data.answer }));
    socket.on('ice_candidate', (data) => io.to(data.targetId).emit('ice_candidate', { senderId: socket.id, candidate: data.candidate }));
    socket.on('leave_voice', () => socket.disconnect());

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            io.to(users[socket.id].room).emit('user_list', Object.values(users).filter(u => u.room === users[socket.id].room));
            io.to(users[socket.id].room).emit('system_msg', { text: users[socket.id].name + ' odadan çıktı.' });
            delete users[socket.id];
        }
    });
});

function getTime() { return new Date().getHours().toString().padStart(2,'0') + ':' + new Date().getMinutes().toString().padStart(2,'0'); }

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Sunucu ' + PORT + ' portunda çalışıyor'));
