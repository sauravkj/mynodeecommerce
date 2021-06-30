function cart(proId) {
   
  $.ajax({
    url:'/addcart/'+proId ,
    success:function(response){



    if(response.status){

       let count=$('#cart').html()
       count=parseInt(count)+1
        $("#cart").html(count)
      
      }
    }

  }) 
  }