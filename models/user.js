const mongoose = require("mongoose");

const ProductModel = require("../models/newproduct");
const Schema = mongoose.Schema;
const userSchema = new Schema({
  username: {
    type: String,
    require: true
  },
  password: {
    type: String,
    require: true
  },
  email: {
    type: String,
    require: true
  },
  fullname: {
    type: String,
    require: true
  },
  age: {
    type: Number,
    require: true
  },
  phone: {
    type: String,
    require: true
  },
  address: {
    type: String,
    require: true
  },
  role: {
    type: String,
    default: "customer"
  },
  created: {
    type: String,
    default: Date.now
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "newproduct",
          required: true
        },
        quantity: { type: Number }
      }
    ],
    sum: {
      type: Number,
      default: 0
    }
  },
  productNewOrder:{
    order:[],
    fullname:{
      type: String,
    },
    mobilenumber:{
      type: String,
    },
    address:{
      type: String,
    },
    createdOrder:{
      type: String,
    },
  },
});

//Add to Cart
userSchema.methods.addToCart = async function(product, newQuantity) {
  const cartProductIndex = this.cart.items.findIndex(cp => cp.productId.toString() === product._id.toString());
  
  if (cartProductIndex >= 0) {
    this.cart.items[cartProductIndex].quantity += parseFloat(newQuantity);
  } else {
    this.cart.items.push({
      productId: product._id,
      quantity: parseFloat(newQuantity)
    });
  }
  
  const priceAddQuantityProduct = product.price * parseFloat(newQuantity);
  this.cart.sum += priceAddQuantityProduct;
  
  await this.save();
};


//Remove
userSchema.methods.removeProductCart = async function(product, productDetail) {
  const listProductCart = this.cart.items;
  let sum = this.cart.sum;

  for (let i = 0; i < listProductCart.length; i++) {
    if (listProductCart[i].productId == product) {
      sum = sum - productDetail.price * listProductCart[i].quantity;
      console.log("sum ", sum);
      listProductCart.splice(i, 1);
      break;
    }
  }

  const updatedCart = {
    items: listProductCart,
    sum: sum
  };

  this.cart = updatedCart;
  console.log("TCL: cart =>", this.cart);
  await this.save();
};


//Update
userSchema.methods.updatedCart = async function(newUpdateCart) {
  try {
    const listUpdateProductCart = [...this.cart.items];
    let newSum = 0;
    const products = await ProductModel.find();

    listUpdateProductCart.forEach((item, index) => {
      const foundProduct = products.find(product => product._id.toString() === item.productId.toString());

      const updateCartItem = newUpdateCart.find(updateItem => updateItem.ID.toString() === item.productId.toString());

      if (foundProduct && updateCartItem) {
        listUpdateProductCart[index].quantity = updateCartItem.Quantity;
        newSum += parseFloat(foundProduct.price) * parseFloat(updateCartItem.Quantity);
      }
    });

    const updatedCart = {
      items: listUpdateProductCart,
      sum: newSum
    };

    this.cart = updatedCart;

    console.log("JSON.parse(JSON.stringify(this.cart))", JSON.parse(JSON.stringify(this.cart)));
    console.log("JSON.stringify(this.cart)", JSON.stringify(this.cart));
    console.log("TCL: cart =>", this.cart);

    return this.save();
  } catch (error) {
    throw error;
  }
}


//Order
userSchema.methods.CheckOut = async function(name, mobilenumber, address) {
  try {
    const listUpdateProductCart = [...this.cart.items];
    const orderProduct = this.productNewOrder;
    const itemsCart = JSON.parse(JSON.stringify(this.cart));
    const today = new Date();
    const created = today.toDateString("yyyy-MM-dd");
    console.log("TCL: userSchema.methods.CheckOut -> this.productNewOrder.order", this.productNewOrder.order);

    const product = await ProductModel.find();

    listUpdateProductCart.forEach((item, index) => {
      product.forEach(items => {
        if (items._id.toString() === listUpdateProductCart[index].productId.toString()) {
          items.quantity -= listUpdateProductCart[index].quantity;
        }
      });
    });

    orderProduct.order.unshift(itemsCart);
    orderProduct.createdOrder = created;
    orderProduct.fullname = name;
    orderProduct.mobilenumber = mobilenumber;
    orderProduct.address = address;
    console.log("TCL: userSchema.methods.CheckOut -> orderProduct", orderProduct);

    this.cart = {
      items: [],
      sum: 0
    };
    return this.save();
  } catch (error) {
    throw error;
  }
}


const userMongoose = mongoose.model("user", userSchema);

//Module.exports
module.exports = userMongoose;

/* update CArt
 var listProductCart = this.cart.items;
  var sum = this.cart.sum;
  for (var i = 0; i < listProductCart.length; i++) {

      if(listProductCart[i].productId== productID){
      console.log('alo',action)
      switch(action){
        case "add":
          listProductCart[i].quantity++;
          sum = sum + productDetail.price; 
          console.log("TCL: userSchema.methods.updatedCart -> sum", sum)
          break;
        case "remove":
          listProductCart[i].quantity--;
          sum = sum - productDetail.price;
          console.log("TCL: userSchema.methods.updatedCart -> sum", sum)
          if(listProductCart[i].quantity<1) listProductCart.splice(i,1);
          break;
        default:
          console.log('Update Cart');
          break;
      }
      break;
    }
  }
  const updatedCart = {
    items: listProductCart,
    sum: sum
  };
  this.cart = updatedCart;
  console.log("TCL: cart =>", this.cart);
  return this.save(); */