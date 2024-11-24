const Cart = require('../models/Cart');
const Product = require('../models/Product');

const cartController = {
    // Lấy giỏ hàng của user
    getCart: async (req, res) => {
        try {
            const cart = await Cart.findOne({ user: req.user.id })
                                 .populate('items.product');
            if (!cart) {
                return res.status(200).json({ items: [], totalAmount: 0 });
            }
            res.json(cart);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Thêm sản phẩm vào giỏ hàng
    addToCart: async (req, res) => {
        try {
            const { productId, quantity } = req.body;
            
            // Kiểm tra sản phẩm
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            let cart = await Cart.findOne({ user: req.user.id });
            
            // Nếu chưa có giỏ hàng, tạo mới
            if (!cart) {
                cart = new Cart({
                    user: req.user.id,
                    items: [],
                    totalAmount: 0
                });
            }

            // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
            const cartItemIndex = cart.items.findIndex(
                item => item.product.toString() === productId
            );

            if (cartItemIndex > -1) {
                // Cập nhật số lượng nếu sản phẩm đã tồn tại
                cart.items[cartItemIndex].quantity += quantity;
            } else {
                // Thêm sản phẩm mới vào giỏ hàng
                cart.items.push({
                    product: productId,
                    quantity: quantity,
                    price: product.price
                });
            }

            // Tính lại tổng tiền
            cart.totalAmount = cart.items.reduce(
                (total, item) => total + (item.price * item.quantity), 
                0
            );

            await cart.save();
            res.json(cart);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Cập nhật số lượng sản phẩm
    updateCartItem: async (req, res) => {
        try {
            const { productId, quantity } = req.body;
            
            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            const cartItemIndex = cart.items.findIndex(
                item => item.product.toString() === productId
            );

            if (cartItemIndex === -1) {
                return res.status(404).json({ message: 'Product not found in cart' });
            }

            if (quantity <= 0) {
                // Xóa sản phẩm khỏi giỏ hàng
                cart.items.splice(cartItemIndex, 1);
            } else {
                // Cập nhật số lượng
                cart.items[cartItemIndex].quantity = quantity;
            }

            // Tính lại tổng tiền
            cart.totalAmount = cart.items.reduce(
                (total, item) => total + (item.price * item.quantity), 
                0
            );

            await cart.save();
            res.json(cart);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Xóa sản phẩm khỏi giỏ hàng
    removeFromCart: async (req, res) => {
        try {
            const { productId } = req.params;
            
            const cart = await Cart.findOne({ user: req.user.id });
            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            cart.items = cart.items.filter(
                item => item.product.toString() !== productId
            );

            // Tính lại tổng tiền
            cart.totalAmount = cart.items.reduce(
                (total, item) => total + (item.price * item.quantity), 
                0
            );

            await cart.save();
            res.json(cart);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}; 