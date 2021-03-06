import { ObjectID } from 'mongodb'
import moment from 'moment'

import Cart from '../models/Cart'
import Product from '../models/Product'


export const add = (req, res) => {
  const { productId, productQty } = req.body
  Product.findOne(
    { _id: productId }
  )
  .then(product => {
    const { price, name } = product.values
    const cart = new Cart({
      total: productQty * price + ((productQty * price) * .075),
      subTotal: productQty * price,
      quantity: productQty,
      items: [{
        productId,
        productQty,
        image: { src: product.image.src },
        name,
        price,
        total: productQty * price
      }]
    })
    cart.save()
    .then(doc => res.header('cart', doc._id).send(doc))
    .catch(error => { console.error(error); res.status(400).send({ error })})
  })
}



export const getId = (req, res) => {
  const _id = req.params._id
  if (!ObjectID.isValid(_id)) {
    return res.status(404).send()
  }
  Cart.findById(_id)
  .then(cart => {
    if (!cart) return Promise.reject({ error: 'Cart not found'})
    res.send(cart)
  })
  .catch(error => { console.error(error); res.status(400).send({ error })})
}




export const update = (req, res) => {
  const { _id } = req.params
  if (!ObjectID.isValid(_id)) return res.status(404).send({ error: 'Invalid id'})
  const { type, productId, productQty } = req.body
  Cart.findOne({ _id })
    .then(cart => {
      const index = cart.items.map(i => i.productId.toHexString()).indexOf(productId)
      if (index !== -1) {
        switch (type) {
          case 'ADD_TO_CART':
            cart.total = cart.total + ((cart.items[index].price * productQty) + (cart.items[index].price * productQty) * .075)
            cart.subTotal = cart.subTotal + (cart.items[index].price * productQty)
            cart.quantity = cart.quantity + productQty
            cart.items[index] = {
              total: cart.items[index].price * (cart.items[index].productQty + productQty),
              price: cart.items[index].price,
              image: cart.items[index].image,
              name: cart.items[index].name,
              productQty: cart.items[index].productQty + productQty,
              productId: cart.items[index].productId
            }
            cart.save()
            .then(cart => res.send(cart))
            .catch(error => { console.error(error); res.status(400).send({ error })})
            break
          case 'REDUCE_FROM_CART':
            if (cart.items[index].productQty - productQty > 0) {
              cart.total = cart.total - ((cart.items[index].price * productQty) + (cart.items[index].price * productQty) * .075)
              cart.subTotal = cart.subTotal - (cart.items[index].price * productQty)
              cart.quantity = cart.quantity - productQty
              cart.items[index] = {
                total: cart.items[index].price * (cart.items[index].productQty - productQty),
                price: cart.items[index].price,
                image: cart.items[index].image,
                name: cart.items[index].name,
                productQty: cart.items[index].productQty - productQty,
                productId: cart.items[index].productId
              }
              cart.save()
              .then(cart => res.send(cart))
              .catch(error => { console.error(error); res.status(400).send({ error })})
            } else {
              cart.total = cart.total - ((cart.items[index].price * productQty) + (cart.items[index].price * productQty) * .075)
              cart.subTotal = cart.subTotal - (cart.items[index].price * productQty)
              cart.quantity = cart.quantity - productQty
              cart.items = cart.items.filter(item =>
                item.productId.toHexString() !== productId
              )
              cart.save()
              .then(cart => res.send(cart))
              .catch(error => { console.error(error); res.status(400).send({ error })})
            }

            break
          case 'REMOVE_FROM_CART':
            cart.total = cart.total - ((cart.items[index].price * cart.items[index].productQty) + ((cart.items[index].price * cart.items[index].productQty) * .075))
            cart.subTotal = cart.subTotal - (cart.items[index].price * cart.items[index].productQty)
            cart.quantity = cart.quantity - cart.items[index].productQty
            cart.items = cart.items.filter(item =>
              item.productId.toHexString() !== productId
            )
            cart.save()
            .then(cart => res.send(cart))
            .catch(error => { console.error(error); res.status(400).send({ error })})
            break
          default:
            return cart
        }
      } else {
        Product.findOne({ _id: productId })
          .then(pro => {
            cart.total = cart.total + ((pro.values.price * productQty) + (pro.values.price * productQty) * .075)
            cart.subTotal = cart.subTotal + (pro.values.price * productQty)
            cart.quantity = cart.quantity + productQty
            const item = {
              productId,
              productQty,
              image: pro.image,
              name: pro.values.name,
              price: pro.values.price,
              total: pro.values.price * productQty
            }
            cart.items.push(item)
            cart.save()
            .then(cart => res.send(cart))
            .catch(error => { console.error(error); res.status(400).send({ error })})
          })
      }
  })
  .catch(error => { console.error(error); res.status(400).send({ error })})
}


export const remove = (req, res) => {
  const _id = req.params._id
  if (!ObjectID.isValid(_id)) return res.status(404).send({ error: 'Invalid id'})
  Cart.findOneAndRemove({ _id,})
  .then(cart => res.send(cart))
  .catch(error => { console.error(error); res.status(400).send({ error })})
}
