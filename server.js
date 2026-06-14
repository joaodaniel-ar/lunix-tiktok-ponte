const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);

// Configura o WebSocket liberando o acesso para o seu site no HostGator
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ==========================================
// CONFIGURAÇÃO DO TIKTOK
// ==========================================
// Mude para o seu nome de usuário real do TikTok (ex: fenixvtx)
const tiktokUsername = "fenixvtx"; 

const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

// Conecta à live
tiktokLiveConnection.connect().then(state => {
    console.info(`✅ Conectado com sucesso na live de ${state.roomInfo.owner.display_id}`);
}).catch(err => {
    console.error('❌ Falha ao conectar na live. Você está ao vivo?', err);
});

// ==========================================
// CAPTURA DO CHAT EM TEMPO REAL
// ==========================================
tiktokLiveConnection.on('chat', data => {
    console.log(`💬 Chat Recebido -> ${data.uniqueId}: ${data.comment}`);
    
    // Dispara a mensagem instantaneamente para o seu arquivo live-app.js
    io.emit('chat', { 
        usuario: data.uniqueId, 
        texto: data.comment 
    });
});

// ==========================================
// CAPTURA DE PRESENTES (GIFTS) PARA DICAS
// ==========================================
tiktokLiveConnection.on('gift', data => {
    // Verifica se é um presente real (ignora interações gratuitas)
    if (data.giftType === 1 && !data.repeatEnd) {
        console.log(`🎁 Presente Recebido -> ${data.uniqueId} enviou ${data.giftName}`);
        
        io.emit('gift', { 
            usuario: data.uniqueId, 
            presente: data.giftName 
        });
    }
});

// Rota básica só para manter o servidor online
app.get('/', (req, res) => {
    res.send("🟢 Ponte do Lunix TikTok está rodando perfeitamente!");
});

// Inicia o servidor
server.listen(process.env.PORT || 3000, () => {
    console.log('🚀 Servidor Node.js iniciado!');
});
