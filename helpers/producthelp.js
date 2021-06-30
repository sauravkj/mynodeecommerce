
var db= require('../config/mongo')
var collection=require('../config/collections')
const { resolve, reject } = require('promise')
const { response } = require('express')
var objectId =require('mongodb').ObjectID
module.exports = {
    addProduct:(product,callback)=>{ 
    db.get().collection('product').insertOne({
     
        Name:product.Name,
        description:product.description,
        category:product.category,
        price:parseInt(product.price)
 
    }).then((data)=>{
        callback(data.ops[0]._id)
         
    })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection('product').find().toArray()
            resolve(products) })
        
    
    
        },

        deleteProduct:(proId)=>{

            return new Promise((resolve,reject)=>{
                db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(proId)}).then((response)=>{
                   resolve(response)
                }
                )
            })

            


        },

        editProduct:(id)=>{
            return new Promise((resolve,reject)=>{

                db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(id)}).then((response)=>{
                    resolve(response)
                })
            })
        },

        updatePro:(proId,proDetails)=>{
            
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{

                    $set:{

                        Name:proDetails.Name,
                        description:proDetails.description,
                        price:parseInt(proDetails.price),
                        category:proDetails.category
                    }
                }).then((response)=>resolve())
            })
        }
}