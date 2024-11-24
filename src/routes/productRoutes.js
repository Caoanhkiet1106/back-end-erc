const express = require('express');
const router = express.Router();
const upload = require('../configs/multerConfig');
const { adminAuth, auth } = require('../middleware/auth');

const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory
} = require('../controllers/productController');

// Đăng ký các route
router.get('/', getAllProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProductById);
router.post('/', auth, adminAuth, upload.array('images', 5), createProduct);
router.put('/:id', auth, adminAuth, upload.array('images', 5), updateProduct);
router.delete('/:id', auth, adminAuth, deleteProduct);

module.exports = router;