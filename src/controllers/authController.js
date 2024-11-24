const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Đăng ký user
const register = async (req, res) => {
    try {
        const { username, password, email, firstName, phone, address } = req.body;

        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'Username hoặc email đã tồn tại' 
            });
        }

        const user = new User({
            username,
            password,
            email,
            firstName,
            phone,
            address,
            role: 'user'  // mặc định là user thường
        });

        await user.save();

        res.status(201).json({
            message: 'Đăng ký thành công',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                phone: user.phone,
                address: user.address,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi khi đăng ký', 
            error: error.message 
        });
    }
};

// Đăng nhập user
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user || user.role === 'admin') {
            return res.status(401).json({ 
                message: 'Username hoặc password không đúng' 
            });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                message: 'Username hoặc password không đúng' 
            });
        }

        // Tạo token JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // Thời gian hết hạn
        );

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                phone: user.phone,
                address: user.address,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi khi đăng nhập', 
            error: error.message 
        });
    }
};

// Đăng nhập admin
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        const admin = await User.findOne({ username, role: 'admin' });
        if (!admin) {
            return res.status(401).json({
                message: 'Thông tin đăng nhập admin không đúng'
            });
        }

        const isValidPassword = await admin.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Thông tin đăng nhập admin không đúng'
            });
        }

        // Tạo token JWT
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // Thời gian hết hạn
        );

        res.json({
            message: 'Đăng nhập admin thành công',
            token,
            user: {
                id: admin._id,
                username: admin.username,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Lỗi khi đăng nhập admin', 
            error: error.message 
        });
    }
};

module.exports = { register, login, adminLogin };