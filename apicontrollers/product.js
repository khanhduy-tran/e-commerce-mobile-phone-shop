const bodyParser = require("body-parser");
//Model

const ProductModel = require("../models/newproduct");
const UserModel = require("../models/user");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

module.exports = {
  /* NEW DB*/
  getAddProduct: function(req, res, next) {
    let message = req.flash("error");
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
    req.session.isManager = false;
    res.render("product/addproduct", {
      errorMessageProduct: message
    });
  },

  postAddProduct: async function(req, res, next) {
    try {
      const { productname, price, imagePath, description, quantity, category } = req.body;
      const today = new Date();
      const created = today.toDateString("yyyy-MM-dd");
      console.log(created);
  
      const product = await ProductModel.findOne({ imagePath: imagePath });
  
      if (product) {
        return res.render("product/addproduct", {
          errorMessageProduct: console.log("Product is Exists"),
          productt: null
        });
      }
  
      if (
        productname === "" ||
        price === "" ||
        imagePath === "" ||
        description === ""
      ) {
        return res.render("product/addproduct", {
          path: "/signup",
          errorMessageProduct: "Product name, Price, Imagepath, or Description is Empty",
          error: console.log("Empty")
        });
      }
  
      const newproductData = new ProductModel({
        productname: productname,
        imagePath: imagePath,
        price: price,
        description: description,
        quantity: quantity,
        category: category,
        created: created
      });
  
      await newproductData.save({ alo: console.log("Save new Product Done") });
      console.log(newproductData);
      res.redirect("/adminTin");
    } catch (err) {
      res.send("error: " + err);
    }
  },
  

  getProductDetail: async function(req, res, next) {
    try {
      const productId = req.params._id;
      console.log("TCL: productId", productId);
  
      const users = await UserModel.find();
      const productdetail = await ProductModel.findById(productId);
  
      res.render("product/product-detail", {
        product: productdetail
      });
    } catch (err) {
      console.log(err);
    }
  }
  
};
