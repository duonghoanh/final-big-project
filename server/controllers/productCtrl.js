const Products = require('../models/productModel')
const cloudinary = require('cloudinary')
const catchAsyncErrors = require('../middleware/catchAsyncErrors')
// Filter, sorting and paginating

class APIfeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    filtering() {
        const queryObj = { ...this.queryString } //queryString = req.query

        const excludedFields = ['page', 'sort', 'limit']
        excludedFields.forEach(el => delete (queryObj[el]))

        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte|regex)\b/g, match => '$' + match)

        //    gte = greater than or equal
        //    lte = lesser than or equal
        //    lt = lesser than
        //    gt = greater than
        this.query.find(JSON.parse(queryStr))

        return this;
    }

    sorting() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        } else {
            this.query = this.query.sort('-createdAt')
        }

        return this;
    }

    paginating() {
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1 || 9
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit)
        return this;
    }
}

const productCtrl = {
    getProducts: async (req, res) => {
        try {
            const features = new APIfeatures(Products.find(), req.query)
                .filtering().sorting().paginating()

            const products = await features.query

            res.json({
                status: 'success',
                result: products.length,
                products: products
            })

        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    createProduct: catchAsyncErrors(async (req, res) => {
        let images = [];

        if (typeof req.body.images === "Object") {
            images.push(req.body.images);
        } else {
            images = req.body.images;
        }

        const imagesLinks = [];

        for (let i = 0; i < images.length; i++) {
            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "test",
            }, async (err, result) => {
                imagesLinks.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                })
            })
        }

        req.body.images = imagesLinks;

        const { product_id, title, price, description, content, category } = req.body;

        const product = await Products.findOne({ product_id })
        if (product)
            return res.status(400).json({ msg: "This product already exists." })

        images = imagesLinks
        const newProduct = new Products({
            product_id, title: title.toLowerCase(), price, description, content, images, category
        })

        await newProduct.save()
        res.json({ msg: "Created a product" })
    }),
    deleteProduct: catchAsyncErrors(async (req, res) => {
        const product = await Products.findById(req.params.id);

        if (!product) {
          return next(new ErrorHander("Product not found", 404));
        }
      
        // Deleting Images From Cloudinary
        for (let i = 0; i < product.images.length; i++) {
          await cloudinary.v2.uploader.destroy(product.images[i].public_id);
        }
      
        await product.remove();
      
        res.status(200).json({
          success: true,
          message: "Product Delete Successfully",
        });
    }),
    updateProduct: catchAsyncErrors(async (req, res) => {
        let product = await Products.findById(req.params.id);
        let images = [];

        if (typeof req.body.images === "Object") {
            images.push(req.body.images);
        } else {
            images = req.body.images;
        }

        if (images !== undefined) {
            for (let i = 0; i < product.images.length; i++) {
                await cloudinary.v2.uploader.destroy(product.images[i].public_id);
            }

            const imagesLinks = [];

            for (let i = 0; i < images.length; i++) {
                const result = await cloudinary.v2.uploader.upload(images[i], {
                    folder: "test",
                }, async (err, result) => {
                    imagesLinks.push({
                        public_id: result.public_id,
                        url: result.secure_url,
                    })
                })
            }
            req.body.images = imagesLinks;
            images = imagesLinks
        }

        const { title, price, description, content, category } = req.body;
        if (!images) return res.status(400).json({ msg: "No image upload" })

        await Products.findOneAndUpdate({ _id: req.params.id }, {
            title: title.toLowerCase(), price, description, content, images, category
        })

        res.json({ msg: "Updated a Product" })
    })
}


module.exports = productCtrl