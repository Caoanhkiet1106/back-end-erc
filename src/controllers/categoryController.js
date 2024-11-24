const Category = require('../models/Category');
const Product = require('../models/Product');

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .select('name description')
            .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo mới nhất
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách danh mục', error: error.message });
    }
};

// Get single category with products
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        // Lấy thêm sản phẩm thuộc danh mục này
        const products = await Product.find({ categoryId: req.params.id })
            .select('name price images')
            .limit(10); // Giới hạn 10 sản phẩm

        res.status(200).json({
            category,
            products
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông tin danh mục', error: error.message });
    }
};

// Create new category
const createCategory = async (req, res) => {
    try {
        // Kiểm tra xem tên danh mục đã tồn tại chưa
        const existingCategory = await Category.findOne({ name: req.body.name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
        }

        // Validate dữ liệu
        if (!req.body.name || req.body.name.trim().length < 2) {
            return res.status(400).json({ message: 'Tên danh mục phải có ít nhất 2 ký tự' });
        }

        const newCategory = new Category({
            name: req.body.name.trim(),
            description: req.body.description ? req.body.description.trim() : ''
        });

        const savedCategory = await newCategory.save();
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(400).json({ message: 'Lỗi khi tạo danh mục', error: error.message });
    }
};

// Update category
const updateCategory = async (req, res) => {
    try {
        // Kiểm tra xem tên mới có trùng với danh mục khác không
        if (req.body.name) {
            const existingCategory = await Category.findOne({
                name: req.body.name,
                _id: { $ne: req.params.id }
            });
            if (existingCategory) {
                return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
            }
        }

        // Validate dữ liệu
        if (req.body.name && req.body.name.trim().length < 2) {
            return res.status(400).json({ message: 'Tên danh mục phải có ít nhất 2 ký tự' });
        }

        const updateData = {
            ...(req.body.name && { name: req.body.name.trim() }),
            ...(req.body.description && { description: req.body.description.trim() })
        };

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: 'Lỗi khi cập nhật danh mục', error: error.message });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    try {
        // Kiểm tra xem có sản phẩm nào thuộc danh mục này không
        const productsCount = await Product.countDocuments({ categoryId: req.params.id });
        if (productsCount > 0) {
            return res.status(400).json({ 
                message: 'Không thể xóa danh mục này vì có sản phẩm đang sử dụng',
                productsCount
            });
        }

        const deletedCategory = await Category.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }

        res.status(200).json({ 
            message: 'Xóa danh mục thành công',
            deletedCategory 
        });
    } catch (error) {
        res.status(400).json({ message: 'Lỗi khi xóa danh mục', error: error.message });
    }
};

// Get category statistics
const getCategoryStats = async (req, res) => {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: '$categoryId',
                    productsCount: { $sum: 1 },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: '$category'
            },
            {
                $project: {
                    categoryName: '$category.name',
                    productsCount: 1,
                    avgPrice: { $round: ['$avgPrice', 2] },
                    minPrice: 1,
                    maxPrice: 1
                }
            }
        ]);

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thống kê danh mục', error: error.message });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryStats
};
