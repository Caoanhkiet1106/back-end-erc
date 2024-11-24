const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');

const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats
} = require('../controllers/categoryController');

// Public routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.get('/stats', getCategoryStats);

// Protected routes - Yêu cầu đăng nhập và quyền admin
router.post('/', auth, adminAuth, createCategory);
router.put('/:id', auth, adminAuth, updateCategory);
router.delete('/:id', auth, adminAuth, deleteCategory);

module.exports = router;