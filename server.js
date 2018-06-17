var express  = require('express'),
    path     = require('path'),
    bodyParser = require('body-parser'),
    app = express(),
    expressValidator = require('express-validator');


/*Set EJS template Engine*/
app.set('views','./views');
app.set('view engine','ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true })); //support x-www-form-urlencoded
app.use(bodyParser.json());
app.use(expressValidator());

/*MySql connection*/
var connection  = require('express-myconnection'),
    mysql = require('mysql');

app.use(

    connection(mysql,{
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'test',
        debug    : false //set true if you wanna see debug logger
    },'request')

);

app.get('/',function(req,res){
    res.send('Welcome');
});


//RESTful route
var router = express.Router();


/*------------------------------------------------------
*  This is router middleware,invoked everytime
*  we hit url /api and anything after /api
*  like /api/phonebook , /api/phonebook/7
*  we can use this for doing validation,authetication
*  for every route started with /api
--------------------------------------------------------*/
router.use(function(req, res, next) {
    console.log(req.method, req.url);
    next();
});

var curut = router.route('/phonebook');


//show the CRUD interface | GET
curut.get(function(req,res,next){


    req.getConnection(function(err,conn){

        if (err) return next("Cannot Connect");

        var query = conn.query('SELECT * FROM phonebook',function(err,rows){

            if(err){
                console.log(err);
                return next("Mysql error, check your query");
            }

            res.render('phonebook',{title:"RESTful Crud Example",data:rows});

         });

    });

});
//post data to DB | POST
curut.post(function(req,res,next){

    //validation
    req.assert('first_name','First name is required').notEmpty();
    req.assert('last_name','Last name is required').notEmpty();
    req.assert('telephone_number','Telephone Number').notEmpty();

    var errors = req.validationErrors();
    if(errors){
        res.status(422).json(errors);
        return;
    }

    //get data
    var data = {
        first_name:req.body.first_name,
        last_name:req.body.last_name,
        telephone_number:req.body.telephone_number
     };

    //inserting into mysql
    req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("INSERT INTO phonebook set ? ",data, function(err, rows){

           if(err){
                console.log(err);
                return next("Mysql error, check your query");
           }

          res.sendStatus(200);

        });

     });

});


//now for Single route (GET,DELETE,PUT)
var curut2 = router.route('/phonebook/:id');

/*------------------------------------------------------
route.all is extremely useful. you can use it to do
stuffs for specific routes. for example you need to do
a validation everytime route /api/phonebook/:id it hit.

remove curut2.all() if you dont want it
------------------------------------------------------*/
curut2.all(function(req,res,next){
    console.log("You need to smth about curut2 Route ? Do it here");
    console.log(req.params);
    next();
});

//get data to update
curut2.get(function(req,res,next){

    var id = req.params.id;

    req.getConnection(function(err,conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("SELECT * FROM phonebook WHERE id = ? ",[id],function(err,rows){

            if(err){
                console.log(err);
                return next("Mysql error, check your query");
            }

            //if data not found
            if(rows.length < 1)
                return res.send("Phone Number Not found");

            res.render('edit',{title:"Edit phone number",data:rows});
        });

    });

});

//update data
curut2.put(function(req,res,next){
    var id = req.params.id;

    //validation
    req.assert('first_name','First name is required').notEmpty();
    req.assert('last_name','Last name is required').notEmpty();
    req.assert('phone_number','Phone number is required.').notEmpty();

    var errors = req.validationErrors();
    if(errors){
        res.status(422).json(errors);
        return;
    }

    //get data
    var data = {
        first_name:req.body.first_name,
        last_name:req.body.last_name,
        phone_number:req.body.phone_number
     };

    //inserting into mysql
    req.getConnection(function (err, conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("UPDATE phonebook set ? WHERE id = ? ",[data,id], function(err, rows){

           if(err){
                console.log(err);
                return next("Mysql error, check your query");
           }

          res.sendStatus(200);

        });

     });

});

//delete data
curut2.delete(function(req,res,next){

    var id = req.params.id;

     req.getConnection(function (err, conn) {

        if (err) return next("Cannot Connect");

        var query = conn.query("DELETE FROM phonebook  WHERE id = ? ",[id], function(err, rows){

             if(err){
                console.log(err);
                return next("Mysql error, check your query");
             }

             res.sendStatus(200);

        });
        //console.log(query.sql);

     });
});

//now for phone number search route (GET)
var curut2 = router.route('/phonebook/:search');

//get data to update
curut2.get(function(req,res,next){

    //validation
    req.assert('search','Search string is required').notEmpty();

    var errors = req.validationErrors();
    if(errors){
        res.status(422).json(errors);
        return;
    }

    var search = req.params.search;

    req.getConnection(function(err,conn){

        if (err) return next("Cannot Connect");

        var query = conn.query("SELECT * FROM phonebook WHERE phone_number = ? ",["%" + search + "%"],function(err,rows){

            if(err){
                console.log(err);
                return next("Mysql error, check your query");
            }

            //if data not found
            if(rows.length < 1)
                return res.send("Phone Number Not found");

            res.render('edit',{title:"Edit phone number",data:rows});
        });

    });

});

//now we need to apply our router here
app.use('/api', router);

//start Server
var server = app.listen(3000,function(){

   console.log("Listening to port %s",server.address().port);

});
