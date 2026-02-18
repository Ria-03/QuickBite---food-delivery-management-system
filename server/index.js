const express = require('express');

const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const http = require('http');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const couponRoutes = require('./routes/couponRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const otpRoutes = require('./routes/otpRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const addressRoutes = require('./routes/addressRoutes');
const schedulingRoutes = require('./routes/schedulingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/inventory', inventoryRoutes);

// Database Connection
const connectDB = require('./config/db');
connectDB();

// Start Order Scheduler (Cron Jobs)
const { startScheduler } = require('./jobs/orderScheduler');
startScheduler();

// Socket.io Connection
io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    socket.on('join_room', (data) => {
        socket.join(data);
        console.log(`User ${socket.id} joined room: ${data}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Basic Route
app.get('/', (req, res) => {
    res.send('QuickBite Server is Running');
});

// Make io accessible to routes
app.set('socketio', io);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
