const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelper= require('../helpers/producthelp')
const fs = require('fs')
 

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProducts().then((products)=>{
   console.log(products)
   res.render('admin/prodview',{admin:true,products})
   
  })
 
})

router.get('/addpro',function(req,res){
  res.render('admin/addpro')
})

router.post('/addpro',function(req,res){
  
//console.log(req.body) check output
//console.log(req.files.img)
 productHelper.addProduct(req.body,(id)=>{
  console.log(req.body)
  let image=req.files.image
 
   image.mv('./public/images/prod_image/'+id+'.jpg',(err,done)=>{
  if(!err){
   res.render("admin/addpro")
  }
  else console.log(err)})

 })

})

router.get('/deletepro',function(req,res){

  let proId =req.query.id
  productHelper.deleteProduct(proId).then((response)=>{
    const path = './public/images/prod_image/'+proId+'.jpg'

try {
  fs.unlinkSync(path)
  console.log("Deleted")
} catch(err) {
  console.error(err)
}
    res.redirect('/admin')
  })
})

router.get('/editpro/:id',async(req,res)=>{
  let product = await(productHelper.editProduct(req.params.id))
  res.render('admin/editpro',{product})
})

router.post('/editpro/:id',(req,res)=>{

  let id = req.params.id

  productHelper.updatePro(id,req.body).then(()=>{
  

  res.redirect('/admin')
})
if(req.files.image){
   
  let image=req.files.image
 image.mv('./public/images/prod_image/'+id+'.jpg')

}
})
module.exports = router;
