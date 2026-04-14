const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
dotenv.config();
connectDB();
const app = express();
const server = http.createServer(app);


// SOCKET.IO SETUP

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});



// MIDDLEWARE

//app.use(cors());
app.use(cors({
  origin: "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});



// STATIC FRONTEND

app.use(express.static(path.join(__dirname, 'public')));

//API ROUTES

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/family', require('./routes/familyRoutes'));
app.use('/api/nurse', require('./routes/nurseRoutes'));
app.use('/api/session', require('./routes/sessionRoutes'));


//SOCKET VIDEO SIGNALING

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`📹 Joined room: ${roomId}`);

    socket.to(roomId).emit('user-joined');
  });

  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  socket.on('end-call', (roomId) => {
    socket.to(roomId).emit('call-ended');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


// for start the server

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



