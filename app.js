var express= require("express");
var flash=require("connect-flash");
var app= express(); 
var bodyParser = require("body-parser");
var mongoose=require("mongoose");
var methodOverride=require("method-override");
var expressSanitizer=require("express-sanitizer");
var session = require('express-session');
var cookieParser = require('cookie-parser');
//app config
mongoose.connect("mongodb://alyagomaa:alyagomaa2@ds145981.mlab.com:45981/ag_blog");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public")); // bta3 elstylesheets
app.use(methodOverride("_method"));
app.use(expressSanitizer());
app.use(cookieParser('keyboard cat'));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));
app.use(flash());



//====
//mongoose model config
var blogSchema =new mongoose.Schema({
    title:String,
    image:String,
    imageId:String,
    body:String,
    created:{type:Date,default:Date.now}
});

var Blog = mongoose.model("Blog",blogSchema);
// Image uplad config

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'alyagomaa', 
  api_key: 915254884499594, 
  api_secret: "sy3SSpNKficbZ1LxCK6RNy-pqLE" //process.env.CLOUDINARY_API_SECRET
});
app.use(function(req,res,next){
   res.locals.error=req.flash("error");
   next();
});
//RESTful routes:

//INDEX route
app.get("/blogs",function(req,res){
    Blog.find({},function(err,blogs){
       if(err){
           console.log("sth went wrong!"+err);
       } else{
           res.render("index",{blogs:blogs});
       }
        
    });
    
    
});

app.get("/",function(req,res){
    
    res.redirect("/blogs");
    
});
// NEW route

app.get("/blogs/new",function(req,res){
    res.render("new");
    
});
// CREATE route
app.post("/blogs",upload.single('image'),function(req,res){
    cloudinary.uploader.upload(req.file.path,function(result){
        req.body.image = result.secure_url;
        req.body.blog.image=req.body.image;
        
        req.body.blog.imageId= result.public_id;
        console.log("imageId set successfullyyyy");
        
        req.body.blog.body = req.sanitize(req.body.blog.body);
        
       //create blog
       Blog.create(req.body.blog,function(err,blog){
          if(err){
              res.render("new");
          } else{
              //redirect to the index
              
              res.redirect("/blogs");
          }
       });
    
        
    });
   
    
   
    
});
// SHOW route
app.get("/blogs/:id",function(req,res){
   Blog.findById(req.params.id,function(err,blogDetails){
       if(err){
           console.log(err);
       }else{
           res.render("show",{blog:blogDetails});
       }
   });
    
    
});

// Edit route
app.get("/blogs/:id/edit",function(req,res){
    Blog.findById(req.params.id,function(err,foundBlog){
       if(err){
           console.log(err);
       } else{
           res.render("edit",{blog:foundBlog});
       }
    });
});
//UPDATE route
app.put("/blogs/:id",function(req,res){
    //Preventing javascript code from running
    req.body.blog.body = req.sanitize(req.body.blog.body);
    //=====
   Blog.findByIdAndUpdate(req.params.id,req.body.blog,function(err,updatedBlog){
      if (err){
          res.render("edit");
      } else{
          
         res.redirect("/blogs/"+req.params.id);
      }
   });
    
});
// DESTROY route
app.delete("/blogs/:id",function(req,res){
    Blog.findByIdAndRemove(req.params.id,function(err,blog){
      if(err){
          res.redirect("/blogs/"+ req.params);
      }else{
         // removing the image from cloudinary before entirely removing it from the db
          cloudinary.v2.uploader.destroy(blog.imageId,function(err){
                if(err){
                    console.log(err);
                    console.log("it couldnt destroy the image bardo");
                }else{
                   
                    res.redirect("/blogs");
                }
          });
        }
    });
});
// listen route
app.listen(process.env.PORT, process.env.IP,function(){console.log("server is running rn!")});