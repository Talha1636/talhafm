
    // --- ÖZEL MESAJ ---
    socket.on('priv_msg', (data) => {
        const target = Array.from(users.values()).find(u => u.name === data.to);
        if (target) {
            socket.to(target.id).emit('priv_msg', { from: users.get(socket.id).name, text: data.text });
        } else {
            socket.emit('system_msg', { text: 'Kullanıcı bulunamadı.' });
        }
    });

    // --- SESLİ / GÖRÜNTÜLÜ ARAMA SIGNALING ---
    socket.on('call_offer', (data) => {
        const target = Array.from(users.values()).find(u => u.name === data.targetName);
        if (target) {
            socket.to(target.id).emit('call_offer', { from: users.get(socket.id).name, offer: data.offer, isVideo: data.isVideo });
            // Arama yapılırken hedefin socket.id'sini sakla (cevap için)
            users.get(socket.id).callingTarget = target.id;
        }
    });

    socket.on('call_answer', (data) => {
        const user = users.get(socket.id);
        if (user && user.callingTarget) {
            socket.to(user.callingTarget).emit('call_answer', { answer: data.answer });
        }
    });

    socket.on('call_ice', (data) => {
        const target = Array.from(users.values()).find(u => u.name === data.targetName) || 
                       (users.get(socket.id).callingTarget ? {id: users.get(socket.id).callingTarget} : null);
        if (target) {
            socket.to(target.id).emit('call_ice', { candidate: data.candidate });
        }
    });

    socket.on('call_reject', (data) => {
        const user = users.get(socket.id);
        if (user && user.callingTarget) {
            socket.to(user.callingTarget).emit('call_reject');
        }
    });

    socket.on('call_end', (data) => {
        const user = users.get(socket.id);
        if (user && user.callingTarget) {
            socket.to(user.callingTarget).emit('call_end');
            delete user.callingTarget;
        } else {
            socket.broadcast.emit('call_end');
        }
    });
