const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Domains = mongoose.model('Domains');
const DomainsLog = mongoose.model('DomainsLog');
const ScanDomain = mongoose.model('ScanDomain');

const request = require('request');
const baseInputPath  = __dirname+'/engine/urls';
const baseOutputPath = __dirname+'/engine/data';
const puppeteer = require('puppeteer');
/**
 * Add Account
 */
router.post('/add', auth.required, (req, res, next) => {
    const { body: { domain } } = req;
    const { payload: { id } }  = req;

    domain['createdBy'] = id;
    const finalDomain = new Domains(domain);

    return finalDomain.save()
        .then((record)=> {

            Users.findById(domain['createdBy']).then((user) => {
                if(!user){
                    return res.status(400).json({
                        errors: {
                            message: 'user not found'
                        }
                    });
                }else{

                    const userDomainArr = user.domains;
                    user.domains = [...userDomainArr,record._id];
                    user.save(function(err) {
                        if(err) {
                            return res.status(400).json({
                                errors: {
                                    message: 'user not found'
                                }
                            });
                        }
                        else {


                            /*const logObj = {domainID:record['_id'],violation:record['violation']};
                            const domainLog = new DomainsLog(logObj);
                            domainLog.save().then((log)=> {
                                return res.json({
                                    message: "domain is created."
                                });
                            },(err)=>{
                                return res.status(400).json({
                                    errors: {
                                        message: err.message
                                    }
                                });
                            });*/

                            const scanObj    =  {
                                domainID:record['_id'],
                                url:domain['url'],
                                createdBy:domain['createdBy']
                            };
                            const scanDomain = new ScanDomain(scanObj);
                            scanDomain.save().then((log)=> {
                                return res.json({
                                    message: "domain is created."
                                });
                            },(err)=>{
                                return res.status(400).json({
                                    errors: {
                                        message: err.message
                                    }
                                });
                            });


                            var obj={};
                            obj["SITEMAP"]   = domain['url'];
                            writePropertyFile(baseInputPath,baseOutputPath,record['_id'],new Date().getTime(),JSON.stringify(obj));
                        }
                    });

                }
            });

         },(err)=>{

          return res.status(400).json({
            errors: {
              message: err.message
            }
          });
    });
});

/**
 * Get Domains by user id
 */
router.get('/createdbyme', auth.required, (req, res, next) => {
    const { payload: { id } } = req;

    //domains
    Users.find({_id:id},"domains")
    .populate('domains',"-error -__v")
    .exec(function (err, users) {
        if (err){
            return res.status(400).json({
                errors: {
                    message: err.message
                }
            });
        };



        const PROGRESS_FAILED = users[0]['domains'].filter(function(domain) {
            return (domain.status == "0" || domain.status == "2"); // return only domain with in progress or failed
        });

        const COMPLETED  = users[0]['domains'].filter(function(domain) {
                return (domain.status == "1"); // return only domain with success
            });

        let domains = {
            PROGRESS_FAILED:PROGRESS_FAILED,
            COMPLETED :COMPLETED
        };

        res.json(domains);
    });
});


/**
 * Delete domain
 */
router.delete('/delete/:id', auth.required, (req, res, next) => {
    Domains.findOneAndRemove({_id:req.params.id}).then((domainDetail) => {
        if(!domainDetail){
            return res.status(400).json({
                errors: {
                    message: "Domain not found"
                }
            });
        }else{


            DomainsLog.remove({_id:req.params.id}).then((domains) => {if(!domains){}else{}});
            ScanDomain.remove({domainID:req.params.id}).then((domain) => {if(!domain){}else{}});
            Users.update({}, {$pullAll : { domains : [req.params.id] }}, {multi : true }, function(err, count) {
                if (err) {} else {console.log(count)}
            });
            return res.json({
                errors: {
                    message: 'domain deleted successfully '
                }
            });
        }
    });
});


/**
 * Get Domain Detail By account id
 */
router.get('/detail/:id', auth.required, (req, res, next) => {

    Domains.findOne({_id:req.params.id},"-error").then((domain) => {
        if(!domain){
            return res.status(400).json({
                errors: {
                    message: "Domain not found"
                }
            });
        }else{
            return res.json(domain);
        }
    });
});


/**
 * Get Domain Error JSON By account id
 */
router.get('/json/:id', auth.required, (req, res, next) => {

    Domains.findOne({_id:req.params.id},"name error").then((domain) => {
    if(!domain){
    return res.status(400).json({
        errors: {
            message: "Domain not found"
        }
    });
}else{
    return res.json(domain);
}
});
});


/**
 * Scrape website
 */
router.post('/scrape',auth.optional, function(req, res) {
    const url = req.body.url;
    if(url){
        request(url, function(error, response, html){
            if(!error){
                const isBadRequest = html.indexOf('400 Bad Request') == -1 ? false : true;

                if(isBadRequest){
                    (async () => {
                        const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
                        const page = await browser.newPage();
                        await page.goto(url);
                        // console.log(await page.content());
                        const htmlContent = await page.content();
                        //  await page.screenshot({path: 'example.png'});
                        res.json({
                            "status": "1",
                            "message":"Retrieved successfully",
                            "data": htmlContent
                        });

                    await browser.close();


                     })();
                }else{
                    res.json({
                        "status": "1",
                        "message":"Retrieved successfully",
                        "data": html
                    });
                }

            }else{
                res.json({
                    "status": "0",
                    "message": error,
                    "data":''
                });
            }
        })
    }else{
        res.json({
            "status": "0",
            "data":'',
            "message":'URL is missing'
        });
    }
});


router.post('/scrape-page',auth.optional, function(req, res) {
    const url = req.body.url;
    if(url){
        (async () => {
            const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();
        await page.goto(url);
       // console.log(await page.content());
        const html = await page.content();
      //  await page.screenshot({path: 'example.png'});
        res.json({
            "status": "1",
            "message":"Retrieved successfully",
            "data": html
    });

        await browser.close();


    })();


    }else{
        res.json({
            "status": "0",
            "data":'',
            "message":'URL is missing'
        });
    }
});




function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}

function writePropertyFile(inputPath,outPutPath,projectid,time,json){

    var filePathInput  = inputPath+'/'+projectid+'_'+time;
    var filePathOutput = outPutPath+'/'+projectid+'_'+time;
    ensureExists(filePathInput, 0744, function(err) {
        if (err) {

        }else{

            //input  properties
            fs.open(filePathInput+'/input.properties', 'w', function(err, fd) {
                if (err) {}

                var jsonParsed = JSON.parse(json);

                for (var el in jsonParsed) {
                    var buffer = new Buffer(el + " = " + jsonParsed[el] + '\n');
                    var bufferLength = buffer.length;
                    var bufferPosition = 0;
                    var filePosition = null;

                    fs.write(fd, buffer, bufferPosition, bufferLength, filePosition,
                        function(err, written) {
                            if(err) {}
                        });
                }

            });


            //output  properties
            fs.open(filePathInput+'/output.properties', 'w', function(err, fd) {
                if (err) {}

                var jsonParsed = {path:filePathOutput};

                for (var el in jsonParsed) {
                    var buffer = new Buffer(el + " = " + jsonParsed[el] + '\n');
                    var bufferLength = buffer.length;
                    var bufferPosition = 0;
                    var filePosition = null;

                    fs.write(fd, buffer, bufferPosition, bufferLength, filePosition,
                        function(err, written) {
                            if(err) {}
                        });
                }

            });

        }
    });
}

module.exports = router;