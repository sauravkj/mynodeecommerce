const MongoClient = require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=function(done){

    const url='mongodb+srv://skj:1234@cluster0.om299.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
    const dbname="shopping"

    MongoClient.connect(url,{ useNewUrlParser: true, useUnifiedTopology: true },(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
      
    }) 

    done()
}

module.exports.get=function(){
    return state.db
}