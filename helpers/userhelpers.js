var db= require('../config/mongo')
var collection=require('../config/collections')
const bcrypt = require('bcrypt')
const { resolve, reject } = require('promise')
const { Console } = require('node:console')
var objectId =require('mongodb').ObjectID
const { response } = require('express')
const Razorpay =require('razorpay')
const { pipeline } = require('node:stream')
var instance = new Razorpay({
   key_id: 'rzp_test_bFkIfTGVRs5yxb',
   key_secret: 'qAAJHM2KljKnemX7H5gR2M7T',
 })
module.exports = {

    signup:(userdata)=>{
        
       return new Promise(async(resolve,reject)=>{
        userdata.Password = await bcrypt.hash(userdata.Password,10)
        console.log("Input :" + userdata.Password)
       let data=db.get().collection('user').insertOne(userdata).then((data)=>{
       resolve(data.ops[0]) })

       })  

 
    },

    doLogin:(userdata)=>{
     
      return new Promise(async(resolve,reject)=>{
         var status = false
         var response={}
         let user= await db.get().collection('user').findOne({Email:userdata.Email})
   
       
    if(user)
         {
            bcrypt.compare(userdata.Password,user.Password).then((status)=>{
               if(status) {

               
                   response.user=user;
                 //console.log(user);
                  resolve(user)
                
               }
               else
               { 
                   console.log("failed")
                   resolve(false)
            }
         })

      }
      else {
        console.log("Login failed")
        resolve(false)
      }

      })
    },

    addcart:(proId,userId)=>{
       let proObje={
          item:objectId(proId),
          quantity:1
       }
       return new Promise(async(resolve,reject)=>{
          let userCart= await db.get().collection('cart').findOne({user:objectId(userId)})
          if(userCart){
            let proExist=userCart.product.findIndex(product=>product.item==proId)
           
            if(proExist!=-1){

               db.get().collection('cart').updateOne({user:objectId(userId),'product.item':objectId(proId)},
               {

                  $inc:{'product.$.quantity':1}
               }).then(()=>{
                  resolve()
               })
            }else{ 
               db.get().collection('cart').updateOne({user:objectId(userId)},{
            
            
                    $push:{product:proObje}
         
              
                  }
               ).then((response)=>resolve())}
         
         }
          else{

            let cart = {
               user: objectId(userId),
               product:[proObje]
            }

            db.get().collection('cart').insertOne(cart).then((response)=>{
               resolve()
            })

          }


       })
    },

    getCart:(id)=>{

      return new Promise(async(resolve,reject)=>{
          let x=parseInt()
         let cartItems=await  db.get().collection('cart').aggregate([
           
            {
               $match:{user:objectId(id)}
            },
            {
               $unwind:'$product'
            },
            {
               $project:{
                  item:'$product.item',
                  nos:'$product.quantity'
               }
            },
               {
                  $lookup:{
                     from:collection.PRODUCT_COLLECTION,
                     localField:'item',
                     foreignField:'_id',
                     as:'products'

                  }
               },
               {
                  $project:{
                     item:1,nos:1,products:{$arrayElemAt:['$products',0]}
                  }
               }
               
              
            

            //   {
            //     $lookup:{
            //       from:'product',
            //       let : { prod :'$product'},
            //       pipeline:[
            //          {
                  
            //       as:'cartItems'

            //    }
            // }
       ]).toArray()
        // console.log(cartItems[0].products)
         resolve(cartItems)
      
       })
       
   },
   getCount:(userId)=>{
       var count=0
      return new Promise(async(resolve,reject)=>{
         let cart=await db.get().collection(collection.CART_COLLECTIION).findOne({user:objectId(userId)})
         if(cart){
            
            var i=0;
            var x= cart.product.length
           for(i=0;i<x;i++){
          
            count+=cart.product[i].quantity
          }
           
         }
         resolve(count)
      })
   },
   changeQuantity:(details)=>{
   count=parseInt(details.count)
   quantity=parseInt(details.quantity)
      return new Promise((resolve,reject)=>{

           if(count==-1 && quantity==1){

              db.get().collection('cart').updateOne({_id:objectId(details.cart)},
             {
             $pull:{product:{item:objectId(details.product)}}
             
            }
            ).then((response)=>{
                 resolve({removeProduct:true})
             })
          }
           else{   
     db.get().collection('cart').updateOne({_id:objectId(details.cart),'product.item':objectId(details.product)},
            {

               $inc:{'product.$.quantity':count}
            }).then((response)=>{
               resolve({status:true})
            
      })

   }
   })

   } ,

   deleteCart:(details)=>{

      return new Promise((resolve,reject)=>{

         db.get().collection('cart').updateOne({_id:objectId(details.cart)},
         {
         $pull:{product:{item:objectId(details.product)}}
         
        }
        ).then((response)=>{
             resolve(true)
         })
      })

   },

   getTotal:(id)=>{
      
         
      
      return new Promise(async(resolve,reject)=>{
         let check= await db.get().collection('cart').findOne({user:objectId(id)})
          //console.log(check.product[0])
          if(check.product[0]) {
         let total=await  db.get().collection('cart').aggregate([
            
            {
               $match:{user:objectId(id)}
            },
            {
               $unwind:'$product'
            },
            {
               $project:{
                  item:'$product.item',
                  nos:'$product.quantity'
               }
            },
               {
                  $lookup:{
                     from:collection.PRODUCT_COLLECTION,
                     localField:'item',
                     foreignField:'_id',
                     as:'products'

                  }
               },
               {
                  $project:{
                     item:1,nos:1,products:{$arrayElemAt:['$products',0]}
                  }
               },
              
               {
                  $group:{
                     
                     _id:null,
                     total:{$sum:{$multiply:['$nos','$products.price']}}
                  }
               }
               
       ]).toArray()
         //console.log('hit '+total[0])
          var x=total[0].total
         resolve(x)
      }
      else
        resolve()

       })
       
      },
      
      placeOrder:(details,products,total)=>{

           return new Promise(async(resolve,reject)=>{
                
           
          let stat = details.payment==='cod'?"placed":"pending"
          let order={
             deliveryDetails:{
                name:details.name,
                address:details.address,
                pincode:details.zip,
                phno:details.mob
             },
             userId:objectId(details.userId),
             products:products,
             totalAmount:total,
             paymentMethod:details.payment,
             status:stat,
             date:new Date()
          }
          
           db.get().collection('Orders').insertOne(order).then((res)=>{
             
               db.get().collection('cart').removeOne({user:objectId(details.userId)})
               resolve(res.ops[0]._id)
           })
           let product=[]
           let userCart=  db.get().collection('cart').insertOne({user:objectId(details.userId),product})
          
           })
      },
      
      getCartProductlist:(user)=>{

         return new Promise(async(resolve,reject)=>{
          
             let products=await db.get().collection('cart').findOne({user:objectId(user)})
          resolve(products.product)
         })
      },
         
      getOrders:(id)=>{
         
         return new Promise(async(resolve,reject)=>{
          
            let orders=await db.get().collection('Orders').find({userId:objectId(id)}).toArray()
            if(orders)
            //console.log(orders)
            resolve(orders)

            else
             resolve(false)

         })
          
      },

      getMyOrders:(id)=>{
        //  console.log(id)
         return new Promise(async(resolve,reject)=>{

           
             let orders=await  db.get().collection('Orders').aggregate([
           
              {
                   $match:{_id:objectId(id)}
              },
                {
                 $unwind:'$products'
              },
             {
                 $project:{
                     item:'$products.item',
                     nos:'$products.quantity'
                  }
             },
                 {
                   $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                   localField:'item',
                    foreignField:'_id',
                        as:'products'
   
                 }
                  },
                  {
                    $project:{
                        item:1,nos:1,products:{$arrayElemAt:['$products',0]}
                   }
                 }
                  
         ]).toArray()
           //console.log(ordItems)
            resolve(orders)
         
         })
      
      },

      razorPay:(id,total)=>{
       
         return new Promise(async(resolve,reject)=>{
           
            var options = {
               amount: total*100,  // amount in the smallest currency unit
               currency: "INR",
               receipt: ""+id
             };
             instance.orders.create(options, function(err, order) {
              if(err){
                 console.log(err)
              }
              else {
               
               resolve(order) }
             });
            
         })
         
      },

      verifyPayment:(details)=>{

         return new Promise((resolve,reject)=>{
         
            const crypto =require('crypto')
            var hmac =crypto.createHmac('sha256','qAAJHM2KljKnemX7H5gR2M7T')

            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
               resolve()
            }
            else{
               reject()
            }
         })
      },
      changePaymentStat:(id)=>{

         return new Promise((resolve,reject)=>{ 
         db.get().collection('Orders').updateOne({_id:objectId(id)},{$set:{status:'placed'}}).then(()=>{
            
            resolve()
         
         })
     
      

      })
   }
   
   }