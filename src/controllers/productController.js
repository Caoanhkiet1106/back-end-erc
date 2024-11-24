const Product = require('../models/Product');

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('categoryId');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm', error: error.message });
    }
};

// Get single product
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('categoryId');
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông tin sản phẩm', error: error.message });
    }
};

// Create product without images
const createProduct = async (req, res) => {
    try {
        const { name, description, price, size, categoryId } = req.body;
        
        // Validate dữ liệu
        if (!name || !description || !price || !categoryId) {
            return res.status(400).json({ 
                message: 'Vui lòng điền đầy đủ thông tin sản phẩm' 
            });
        }

        // Xử lý size - đảm bảo là array và hợp lệ
        let sizes = [];
        if (typeof size === 'string') {
            // Nếu size là JSON string
            try {
                sizes = JSON.parse(size);
            } catch {
                // Nếu không phải JSON, xử lý như single value
                sizes = [size];
            }
        } else if (Array.isArray(size)) {
            sizes = size;
        }

        // Xử lý images
        const imageUrls = req.files?.map((file, index) => ({
            url: `/uploads/products/${file.filename}`,
            alt: name,
            isMain: index === 0
        })) || [];

        const newProduct = new Product({
            name,
            description,
            price,
            size: sizes,
            categoryId,
            images: imageUrls
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ 
            message: 'Lỗi khi tạo sản phẩm', 
            error: error.message 
        });
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        console.log('Update Product - Request Body:', req.body);
        console.log('Update Product - Files:', req.files);
        
        // Validate required fields
        if (!req.body.name || !req.body.price || !req.body.categoryId) {
            return res.status(400).json({ 
                message: 'Thiếu thông tin bắt buộc (tên, giá, danh mục)' 
            });
        }

        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            categoryId: req.body.categoryId,
            size: req.body.size // Backend sẽ tự động xử lý array
        };

        // Validate price
        if (isNaN(productData.price)) {
            return res.status(400).json({ 
                message: 'Giá sản phẩm không hợp lệ' 
            });
        }

        console.log('Processed Product Data:', productData);

        // Xử lý images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file, index) => ({
                url: `/uploads/products/${file.filename}`,
                alt: req.body.name,
                isMain: index === 0
            }));

            if (req.body.keepExistingImages === 'true') {
                const existingProduct = await Product.findById(req.params.id);
                if (existingProduct && existingProduct.images) {
                    productData.images = [...existingProduct.images, ...newImages];
                } else {
                    productData.images = newImages;
                }
            } else {
                productData.images = newImages;
            }
        }

        console.log('Final Product Data:', productData);

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: productData },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error in updateProduct:', error);
        res.status(400).json({ 
            message: 'Lỗi khi cập nhật sản phẩm', 
            error: error.message 
        });
    }
};

// Delete product
const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.status(200).json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        res.status(400).json({ message: 'Lỗi khi xóa sản phẩm', error: error.message });
    }
};

// Upload images for product
const uploadProductImages = async (req, res) => {
    try {
        const productId = req.params.id;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'Vui lòng chọn ít nhất 1 ảnh' });
        }

        const imageUrls = req.files.map((file, index) => ({
            url: `/uploads/products/${file.filename}`,
            alt: req.body.alt || 'product image',
            isMain: index === 0
        }));

        const product = await Product.findByIdAndUpdate(
            productId,
            { $push: { images: { $each: imageUrls } } },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ 
            message: 'Lỗi khi upload ảnh', 
            error: error.message 
        });
    }
};

// Delete product image
const deleteProductImage = async (req, res) => {
    try {
        const { productId, imageId } = req.params;

        const product = await Product.findByIdAndUpdate(
            productId,
            { $pull: { images: { _id: imageId } } },
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(400).json({ 
            message: 'Lỗi khi xóa ảnh', 
            error: error.message 
        });
    }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const products = await Product.find({ categoryId })
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 });

        if (!products || products.length === 0) {
            return res.status(404).json({ 
                message: 'Không tìm thấy sản phẩm nào trong danh mục này' 
            });
        }

        res.status(200).json(products);
    } catch (error) {
        console.error('Error in getProductsByCategory:', error);
        res.status(400).json({ 
            message: 'Lỗi khi lấy sản phẩm theo danh mục',
            error: error.message 
        });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImages,
    deleteProductImage,
    getProductsByCategory
};
