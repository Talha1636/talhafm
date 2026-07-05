const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

// Kullanıcılar
const users = new Map();

/* =========================
   CONNECTION
========================= */
io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    /* =========================
       JOIN USER
    ========================= */
    socket.on("join", (name) => {
        users.set(socket.id, {
            id: socket.id,
            name: name
        });

        io.emit("user_list", Array.from(users.values()));
    });

    /* =========================
       PRIVATE MESSAGE
    ========================= */
    socket.on("priv_msg", (data) => {
        const sender = users.get(socket.id);
        if (!sender) return;

        const target = Array.from(users.values())
            .find(u => u.name === data.to);

        if (!target) {
            socket.emit("system_msg", { text: "Kullanıcı bulunamadı." });
            return;
        }

        socket.to(target.id).emit("priv_msg", {
            from: sender.name,
            text: data.text
        });
    });

    /* =========================
       CALL OFFER (WEBRTC)
    ========================= */
    socket.on("call_offer", (data) => {
        const sender = users.get(socket.id);
        if (!sender) return;

        const target = Array.from(users.values())
            .find(u => u.name === data.targetName);

        if (!target) return;

        sender.callingTarget = target.id;

        socket.to(target.id).emit("call_offer", {
            from: sender.name,
            offer: data.offer,
            isVideo: data.isVideo
        });
    });

    /* =========================
       CALL ANSWER
    ========================= */
    socket.on("call_answer", (data) => {
        const sender = users.get(socket.id);
        if (!sender || !sender.callingTarget) return;

        socket.to(sender.callingTarget).emit("call_answer", {
            answer: data.answer
        });
    });

    /* =========================
       ICE CANDIDATE
    ========================= */
    socket.on("call_ice", (data) => {
        const sender = users.get(socket.id);
        if (!sender) return;

        let target = null;

        if (data.targetName) {
            target = Array.from(users.values())
                .find(u => u.name === data.targetName);
        }

        if (!target && sender.callingTarget) {
            target = { id: sender.callingTarget };
        }

        if (!target) return;

        socket.to(target.id).emit("call_ice", {
            candidate: data.candidate
        });
    });

    /* =========================
       CALL REJECT
    ========================= */
    socket.on("call_reject", () => {
        const sender = users.get(socket.id);
        if (!sender || !sender.callingTarget) return;

        socket.to(sender.callingTarget).emit("call_reject");
        delete sender.callingTarget;
    });

    /* =========================
       CALL END
    ========================= */
    socket.on("call_end", () => {
        const sender = users.get(socket.id);
        if (!sender) return;

        if (sender.callingTarget) {
            socket.to(sender.callingTarget).emit("call_end");
            delete sender.callingTarget;
        } else {
            socket.broadcast.emit("call_end");
        }
    });

    /* =========================
       DISCONNECT
    ========================= */
    socket.on("disconnect", () => {
        users.delete(socket.id);
        io.emit("user_list", Array.from(users.values()));
        console.log("Disconnected:", socket.id);
    });

});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
