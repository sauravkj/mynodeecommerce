var express = require('express');
var router = express.Router();
var db= require('../config/mongo');
var MongoClient = require('mongodb').MongoClient
var objectId =require('mongodb').ObjectID
var productHelper= require('../helpers/producthelp')
const userhelper =require('../helpers/userhelpers')
const verifyLogin=(req,res,next)=>{
  
  if(req.session.loggedIn){
    
      next()
    }
 else{
    res.redirect('/login')
 } 
   
 
}
router.get('/',async function(req,res,next){

  let user=req.session.user
  let cartCount= null 
  
  
  
  if(req.session.loggedIn){
  cartCount=await userhelper.getCount(req.session.user._id)
 
  }
  productHelper.getAllProducts().then((products)=>{
    
    res.render('user/viewprod',{products,user,cartCount})

    
   })

})

router.get('/favicon.ico',async function(req,res){
  res.redirect('/')




})



router.get('/login',(req,res)=>{

      
     
    if(req.session.loggedIn){
          res.redirect('/')
          let product=[]
 
    console.log("Login: " + req.session.loggedIn)
    }

    else {
          res.render('user/login',{loggedErr:req.session.loggedErr})
          req.session.loggedErr=false
    }
  })

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})

router.post('/signup',(req,res)=>{
 
  userhelper.signup(req.body).then((response)=>{
  console.log(response)
  req.session.loggedIn=true
  req.session.user=response
  res.redirect('/')
  console.log(req.body)
   let product=[]
   let userCart=  db.get().collection('cart').insertOne({user:objectId(req.body._id),product})
  
} )
})

router.post('/login',(req,res)=>{
 
  userhelper.doLogin(req.body).then((response)=>{
    
    if(response) 
    { 
      
     req.session.user = response
     req.session.loggedIn=true
     res.redirect('/login')
    }
    else {
      req.session.loggedErr=true
      res.redirect('/login')
    
     
    }
} )
  
})

router.get('/logou',(req,res)=>{
 req.session.destroy()
 res.redirect('/login')
})

router.get('/cart',verifyLogin,async(req,res)=>{
 let product =await userhelper.getCart(req.session.user._id)
 let check= await db.get().collection('cart').findOne({user:objectId(req.session.user._id)})
let ttl=await userhelper.getTotal(req.session.user._id)
console.log(check)
// if(check){
   if(check.product[0])
     res.render('user/cart',{product,user:req.session.user,ttl}) 

 else
  res.render('user/empty')

 })

router.get('/addcart/:id',(req,res)=>{

  console.log('hi ' + req.params.id)
  userhelper.addcart(req.params.id,req.session.user._id).then(()=>{
   res.json({status:true})
    //res.redirect('/')
  })

})

router.post('/change-product-quantity',(req,res)=>{
  console.log(req.body)
  userhelper.changeQuantity(req.body).then(async(response)=>{
    response.total=await userhelper.getTotal(req.body.user)
   res.json(response)
    
   
    
  })
  
})

router.post('/removePro',(req,res)=>{
  console.log(req.body)
  userhelper.deleteCart(req.body).then((response)=>{
    res.json(response)
   
 
    
  })
  
})

router.get('/placeOrder',verifyLogin,async(req,res)=>{
  
  let tot=await userhelper.getTotal(req.session.user._id)
   
  res.render('user/placeorder',{tot,user:req.session.user})
    })


    router.post('/placeOrder',async(req,res)=>{
      let products=await userhelper.getCartProductlist(req.body.userId)
      let total=await userhelper.getTotal(req.body.userId)
      //console.log("tota" + products)
      userhelper.placeOrder(req.body,products,total).then((orderId)=>{
      
        if(req.body['payment']=="cod")
                { res.json({codsucess:true})}
        else{

          userhelper.razorPay(orderId,total).then((response)=>{
           // console.log(response)
            res.json(response)

          })

        }
               
      })

        })

  router.get('/ordsucess',(req,res)=>{
 
     res.render('user/ordsucess',{user:req.session.user})

  })

  router.get('/ords',verifyLogin,async(req,res)=>{
    
  
    
    let orders=await userhelper.getOrders(req.session.user._id)
    //console.log( orders)
    res.render('user/myallorders',{user:req.session.user,orders})

 })

 router.get('/vieworders/:id',verifyLogin,async(req,res)=>{
    
   
  let products=await userhelper.getMyOrders(req.params.id)
  //console.log( products)

  res.render('user/myorders',{user:req.session.user,products})

})

router.post('/verifyPayment',(req,res)=>{
 
console.log(req.body)
userhelper.verifyPayment(req.body).then(()=>{
 
  userhelper.changePaymentStat(req.body['order[receipt]']).then(()=>{
    console.log("sucess")
    res.json({status:true})
  })
}).catch((err)=>{
  res.json({status:false})
})

})

module.exports = router;
