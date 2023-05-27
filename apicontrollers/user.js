const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const UserModel = require("../models/user");
const ProductModel = require("../models/newproduct");

const jwt = require("jsonwebtoken");
const url = require("url");
const { errorMonitor } = require("events");

const urlencodedParser = bodyParser.urlencoded({ extended: false });

module.exports = {
  //Sign Up new User
  //Render

  getSignUp: async function (req, res, next) {
    try {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      await res.render("user/signup", {
        path: "/signup",
        pageTitle: "signup",
        errorMessage: message,
        userr: null
      });
    } catch (error) {
      next(error);
    }
  },


  postSignUp: async function (req, res, next) {
    try {
      const { username, password, email, fullname, age, phone, address, confirmpassword } = req.body;

      const today = new Date();
      var date_format = new Date(today).toDateString("yyyy-MM-dd");
      const created = date_format;

      const user = await UserModel.findOne({ username: username });

      //Render Signup nếu sai
      if (user) {
        return res.render("user/signup", {
          path: "/signup",
          errorMessage: "Username exists already~!",
          error: console.log("Already"),
          userr: null
        });
      }

      if (username == "" || password == "") {
        return res.render("user/signup", {
          path: "/signup",
          errorMessage: "Invalid Username or Password",
          error: console.log("Invalid")
        });
      }

      if (password != confirmpassword) {
        return res.render("user/signup", {
          path: "/signup",
          errorMessage: "Password and Confirmpassword not same",
          error: console.log("Not same")
        });
      }

      //Mã hóa password với bcrypt
      const hashpassword = await bcrypt.hash(password, 12);

      const userData = new UserModel({
        username: username,
        password: hashpassword,
        email: email,
        fullname: fullname,
        age: age,
        phone: phone,
        address: address,
        created: created
      });

      await userData.save({ alo: console.log("Save Done") });

      res.redirect("/login");
    } catch (err) {
      res.send("error: " + err);
    }
  },

  //Login User
  getLogin: async function (req, res, next) {
    try {
      let message = req.flash("errorMessage");
      let boolError = req.flash("error");

      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      if (boolError.length > 0) {
        boolError = 1;
      } else {
        boolError = 0;
      }
      await res.render("user/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: message,
        error: boolError,
        userr: null
      });
    } catch (err) {
      next(err);
    }
  },


  postLogin: async function (req, res, next) {
    try {
      const user = await UserModel.findOne({ username: req.body.username });

      if (!user) {
        return res.render("user/login", {
          path: "/login",
          errorMessage: "Username or password wrong",
          error : 1,
          userr: null
        });
      }

      if (req.body.username == "" || req.body.password == "") {
        return res.render("user/login", {
          path: "/login",
          errorMessage: "Invalid username or password",
          error : 1,
          userr: null
        });
      }

      bcrypt.compare(req.body.password, user.password, async function (err, result) {
        if (result) {
          req.session.isLoggedIn = true;
          req.session.user = user;

          if (user.role == "admin") {
            const token = jwt.sign(
              {
                email: user.email,
                userID: user._id,
                role: user.role,
                fullname: user.fullname,
                phone: user.phone,
                address: user.address
              },
              process.env.SECRETKEY_TOKEN
            );
            req.session.token = token;
            req.session.role = user.role;
            await req.session.save();
            res.redirect("/adminTin");
          } else {
            const token = jwt.sign(
              {
                email: user.email,
                userID: user._id,
                role: user.role,
                fullname: user.fullname,
                phone: user.phone,
                address: user.address
              },
              process.env.SECRETKEY_TOKEN
            );
            req.session.token = token;
            req.session.role = user.role;
            await req.session.save();
            res.redirect(url.format({
              pathname: "/",
              user: user
            }));
          }
        } else {
          return res.render("user/login", {
            path: "/login",
            errorMessage: "Invalid username or password",
            error : 1,
            userr: null
          });
        }
      });
    } catch (err) {
      next(err);
    }
  },


  //Logout
  postLogout: function (req, res, next) {
    // huy session khi user dang xuat
    req.session.destroy(err => {
      console.log(err);
      res.redirect("/");
    });
  },

  //Account
  getAccount: function (req, res, next) {
    let message = req.flash("errorMessage");
    let boolError = req.flash("error");

    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }

    if (boolError.length > 0) {
      boolError = 'true';
    } else {
      boolError = 'false';
    }
    res.render("user/account", { errorMessage: message, error: boolError });
  },

  //Edit User
  postEditUser: async function (req, res, next) {
    try {
      const { _id, age, phone, fullname, email, address } = req.body;
      const user = await UserModel.findById(_id);
      if (!user) {
        return res.render("/login");
      }

      if (age == "" || phone == "" || fullname == "" || email == "" || address == "") {
          req.flash('error', 'Field is Empty!');
          req.flash('errorMessage', 'Field is Empty!');
          const redirectURL = url.format({ pathname: `/account/${_id}` });
          return res.redirect(redirectURL);
      }

      user.age = age;
      user.phone = phone;
      user.fullname = fullname;
      user.email = email;
      user.address = address;
      await user.save();
      req.session.isLoggedIn = false;
      return res.render("user/login", {
        path: "/login",
        errorMessage: 'Update information successfully!',
        error: 0,
        userr: null
      });
    } catch (err) {
      console.log("TCL: ", err);
    }
  },

  //change password
  changePassword: async function (req, res, next) {
    try {
      const { _id, oldpw, newpw, cnpw } = req.body;
      const user = await UserModel.findById(_id);
      if (!user) {
        return res.render("/login");
      }
      
      const url = require('url');
      const result = await bcrypt.compare(oldpw, user.password);
      
      if (result) {
        // Mật khẩu khớp
        if (newpw !== cnpw || newpw.trim() == "") {
          req.flash('error', 'Confirm new password does not match!');
          req.flash('errorMessage', 'Confirm new password does not match!');
          const redirectURL = url.format({ pathname: `/account/${_id}` });
          return res.redirect(redirectURL);
        }
        
        const hashpassword = await bcrypt.hash(newpw, 12);
        console.log(hashpassword);
        
        user.password = hashpassword;
        await user.save();
        
        req.session.isLoggedIn = false;
        return res.render("user/login", {
          path: "/login",
          errorMessage: 'Change password successfully!',
          error: 0,
          userr: null
        });
      } else {
        req.flash('error', 'Password is wrong!');
        req.flash('errorMessage', 'Password is wrong!');
        const redirectURL = url.format({ pathname: `/account/${_id}` });
        return res.redirect(redirectURL);
      }
    } catch (err) {
      console.log("TCL: ", err);
    }
  },
  

  //Cart
  getCartPage: async function (req, res, next) {
    try {
      let message = req.flash("errorMessage");
      let boolError = req.flash("error");

      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      if (boolError.length > 0) {
        boolError = 'true';
      } else {
        boolError = 'false';
      }

      const user = await UserModel.findById(req.session.user._id).populate("cart.items.productId").exec();

      let products = user.cart.items;

      res.render("product/page-cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
        sum: user.cart.sum,
        errorMessage: message,
        error: boolError
      });
    } catch (err) {
      console.log(err);
      // Xử lý lỗi
      res.status(500).json({ error: "Internal Server Error" });
    }
  },


  //API show cart
  getCart: async function (req, res, next) {
    try {
      const user = await UserModel.findById(req.session.user._id).populate("cart.items.productId").exec();

      console.log("TCL: user.cart.sum", user.cart.sum);

      res.json({
        "sumPrice": user.cart.sum,
        "products": user.cart.items
      });
    } catch (err) {
      console.log(err);
      // Xử lý lỗi
      res.status(500).json({ error: "Internal Server Error" });
    }
  },



  //Add Product
  postCart: async function (req, res, next) {
    try {
      console.log("Add Product to Cart");
      const productId = req.body.productId;
      console.log("TCL: productId", productId)
      var newQuantity = req.body.productNumber;
      console.log("TCL: newQuantity", newQuantity)

      const product = await ProductModel.findById(productId);
      const user = await UserModel.findById(req.session.user._id);
      await user.addToCart(product, newQuantity);

      res.redirect("/");
    } catch (error) {
      console.log("TCL: ", error);
    }
  },

  //Remove Product in Cart
  postRemoveProductCart: async function (req, res, next) {
    try {
      const productID = req.body.productId;
      console.log("TCL: productID", productID)

      const user = await UserModel.findById(req.session.user._id);
      const productDetail = await ProductModel.findById(productID);

      await user.removeProductCart(productID, productDetail);

      res.redirect("/");
    } catch (error) {
      console.log(error);
    }
  },


  //Update Cart
  postUpdateCart: async function (req, res, next) {
    try {
      const { productQuantity, productId, btnUpdateCart, btnCheckOut, name, mobilenumber, address } = req.body;
      console.log("TCL: btnCheckOut", btnCheckOut);
      console.log("TCL: btnUpdateCart", btnUpdateCart);

      let newQuantityArr = [];
      let productIdArr = [];
      const newUpdateItems = [];

      if (typeof productId === "string") {
        newQuantityArr = productQuantity.split(",");
        productIdArr = productId.split(",");
      } else {
        newQuantityArr = productQuantity;
        productIdArr = productId;
      }

      console.log("TCL: newQuantityArr", newQuantityArr);
      console.log("TCL: productIdArr", productIdArr);

      const user = await UserModel.findById(req.session.user._id);

      for (let i = 0; i < productIdArr.length; i++) {
        newUpdateItems.push({
          ID: productIdArr[i],
          Quantity: newQuantityArr[i],
        });
      }

      if (btnUpdateCart === "btnUpdateCart") {
        await user.updatedCart(newUpdateItems);
        setTimeout(function () {
          return res.redirect("/cart");
        }, 3000);
      } else if (btnCheckOut === "btnCheckOut") {
        if (name === "") {
          req.flash("errorMessage", "Checkout Failed! Full Name is Empty!");
          req.flash("error", "123");
          res.redirect("/cart");
        } else if (mobilenumber === "") {
          req.flash("errorMessage", "Checkout Failed! Mobile Number is Empty!");
          req.flash("error", "123");
          res.redirect("/cart");
        } else if (address === "") {
          req.flash("errorMessage", "Checkout Failed! Address is Empty!");
          req.flash("error", "123");
          res.redirect("/cart");
        } else if (name !== "" && mobilenumber !== "" && address !== "") {
          await user.CheckOut(name, mobilenumber, address);
          setTimeout(function () {
            req.flash("errorMessage", "Thank you for your purchase!");
            return res.redirect("/cart");
          }, 3000);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }


  //Update cart Post
  /*  var productID = req.params._id;
      var action = req.query.action;
      UserModel.findById(req.session.user._id)
      .then(user=>{
        ProductModel.findById(productID)
        .then(productDetail=>{
          console.log(action)
          return user.updatedCart(productID,productDetail,action);
        })
      })
      .then(result => {
        res.redirect("/");
      })
       .catch(err => console.log(err));
       */
}