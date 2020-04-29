const mongoose = require('mongoose');
const passport = require('passport');
const _ = require('lodash');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Roles = mongoose.model('Roles');
const sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

const EMAIL_SENT = "We have sent an email with a confirmation link to your email address. Please allow 5-10 minutes for this message to arrive.";
const EMAIL_EXIST = "This email already exists";
const USER_NOT_FOUND = "Your email does not match our records";
const USER_VERIFIED = "Email address has been successfully verified.Please login to continue";
const USER_NOT_VERIFIED = "Your email does not match our records.";
const EMAIL_SENDGRID_REGISTER_USER = "Confirm your account on Inclusive Web";
const PATH_SENDGRID_REGISTER_USER = "https://www.inclusive.digital/new-password?user=new&uid=";

const EMAIL_SENDGRID_RECOVER_PASSWORD = "Password recovery";
const PATH_SENDGRID_RECOVER_PASSWORD = "https://www.inclusive.digital/new-password?uid=";


/**
 * Login user
 */
router.post('/login', auth.optional, (req, res, next) => {
    const { body: { user } } = req;

    return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
        if(err) {
            return next(err);
        }

        if(passportUser) {
            const user = passportUser;
            user.token = passportUser.generateJWT();

            if(!user.isActive()){
                return res.status(400).json({
                    errors: {
                        message: 'user not active'
                    }
                });
            }else{

                user.populate('role',"roleID label -_id",function (err, loggedUser) {
                    if (err){
                        return res.status(400).json({
                            errors: {
                                message: err.message
                            }
                        });
                    };

                    return res.json({
                        user: loggedUser.toAuthJSON()
                    });
                });
            }
        }else{

            return res.status(400).json({
                errors: {
                    message:USER_NOT_FOUND
                }
            });
    }})(req, res, next);
});

/**
* Register user
*/
router.post('/register', auth.optional, (req, res, next)=> {
    const { body: { user } } = req;
    user['roleID'] = "1";

    //find id based on role ID
    Roles.findOne({ roleID : user['roleID'].toString()},function(err, role){
        if (err){
            return res.status(400).json({
                errors: {
                    message: err.message
                }
            });
        };

        //find user if already exist
        Users.findOne({ email : user['email']},function(err, userDetail){
            if (err){
                return res.status(400).json({
                    errors: {
                        message: err.message
                    }
                });
            };

            //if user exist
            if(userDetail){
                //if it is not active
                if(userDetail['status'] == '0'){
                    //send email again
                    sendMailToNewUser(userDetail.email,userDetail._id);
                    return res.json({
                        message: EMAIL_SENT
                    });
                }else{
                    return res.status(400).json({
                        errors: {
                            message: EMAIL_EXIST
                        }
                    });
                }

            }else{

                var finalUser = new Users(user);
                finalUser.role = role._id;
                finalUser.setPassword(user.password);

                finalUser.save().then((savedUser)=> {
                        sendMailToNewUser(savedUser.email,savedUser._id);
                        return res.json({
                            message: EMAIL_SENT
                        });
                 },(err)=>{
                    return res.status(400).json({
                        errors: {
                            message:  (err.name === 'MongoError' && err.code === 11000) ? EMAIL_EXIST : err.message
                        }
                    });
                });
            }

        });

    });
});


/**
 * Activate user
 */
router.get('/activate/:id', auth.optional, (req, res, next) => {

    Users.findOne({_id:req.params.id}).then((user) => {
        if(!user){
            return res.status(400).json({
                errors: {
                    message: USER_NOT_FOUND
                }
            });
        }else{
            user.status = "1";
            user.save(function(err) {
                if(!err) {
                    return res.json({
                        message: USER_VERIFIED
                    });
                }
                else {
                    return res.status(400).json({
                        message: USER_NOT_VERIFIED
                    });
                }
            });
        }
    });
});

/**
 * Recover Password
 */
router.get('/passwordrecover/:email', auth.optional, (req, res, next) => {
    Users.findOne({email:req.params.email}).then((user) => {
        if(!user){
            return res.status(400).json({
                errors: {
                    message: USER_NOT_FOUND
                }
            });
        }else{
            sendMailForPasswordRecovery(user.email,user._id);
            return res.json({
                message: "Recovery mail has been sent plz check ur email"
            });
        }
    });
});

/**
 * Change password
 */
router.put('/updatepassword/:id', auth.optional, (req, res, next) => {
    const { body: { user } } = req;

    Users.findOne({_id:req.params.id}).then((userDetail) => {
        if(!userDetail){
            return res.status(400).json({
                errors: {
                    message: USER_NOT_FOUND
                }
            });
        }else{

            user['password'] ?  userDetail.setPassword(user['password']):'';
            userDetail.save(function(err) {
                if(!err) {
                    return res.json({
                        message: "Password is updated successfully.Please login to continue."
                    });
                } else {
                    return res.status(400).json({
                        message: "Error in password updation."
                    });
                }
            });

        }
    });
});

/**
 * Add new user
 */
router.post('/add', auth.required, (req, res, next) => {
   const { body: { user } } = req;

    //find id based on role ID
    Roles.findOne({ roleID : user['roleID'].toString()},function(err, role){
        if (err){
            return res.status(400).json({
                errors: {
                    message: err.message
                }
            });
        };

        //find user if already exist
        Users.findOne({ email : user['email']},function(err, userDetail){
            if (err){
                return res.status(400).json({
                    errors: {
                        message: err.message
                    }
                });
            };

            //if user exist
            if(userDetail){
                //if it is not active
                if(userDetail['status'] == '0'){
                    //send email again
                    sendMailToNewUser(userDetail.email,userDetail._id);
                    return res.json({
                        message: EMAIL_SENT
                    });
                }else{
                    return res.status(400).json({
                        errors: {
                            message: EMAIL_EXIST
                        }
                    });
                }

            }else{

                var finalUser = new Users(user);
                finalUser.role = role._id;
                finalUser.setPassword(user.password);

                finalUser.save().then((savedUser)=> {
                    sendMailToNewUser(savedUser.email,savedUser._id);
                return res.json({
                    message: EMAIL_SENT
                });
            },(err)=>{
                    return res.status(400).json({
                        errors: {
                            message:  (err.name === 'MongoError' && err.code === 11000) ? EMAIL_EXIST : err.message
                        }
                    });
                });
            }

        });

    });
});

/**
 * update user
 */
router.put('/update/:id', auth.required, (req, res, next) => {
      const { body: { user } } = req;

      Users.findOne({_id:req.params.id}).then((userDetail) => {

        if(!userDetail){
            return res.status(400).json({
              errors: {
                message: USER_NOT_FOUND
              }
            });
        }else{

              user['firstName'] ? userDetail.firstName = user['firstName'] :'';
              user['lastName'] ? userDetail.lastName = user['lastName'] :'';
              user['company'] ? userDetail.company = user['company']:'';
              user['domains'] ? userDetail.domains = user['domains']:'';
              user['password'] ?  userDetail.setPassword(user['password']):'';

              if(user['roleID']) {
                Roles.findOne({roleID: user['roleID'].toString()}, function (err, role) {
                  if (err) {
                    return res.status(400).json({
                      errors: {
                        message: err.message
                      }
                    });
                  }


                  userDetail.role = role._id;

                  userDetail.save(function(err) {
                    if(!err) {
                      return res.json({
                        message: "user is updated"
                      });
                    }
                    else {
                      return res.status(400).json({
                        message: "user is not updated"
                      });
                    }
                  });

                });
              }else{

                  userDetail.save(function(err) {
                        if(!err) {
                          return res.json({
                            message: "user is updated"
                          });
                        }
                        else {
                          return res.status(400).json({
                            message: "user is not updated"
                          });
                        }
                      });
              }
      }
  });
});


/**
 * Delete user
 */
router.delete('/delete/:id', auth.required, (req, res, next) => {
    Users.findOneAndRemove({_id:req.params.id}).then((userDetail) => {
        if(!userDetail){
          return res.status(400).json({
            errors: {
              message: USER_NOT_FOUND
            }
          });
        }else{
          return res.json({
            errors: {
              message: 'user deleted successfully '
            }
          });
        }
    });
});


/**
 * Get logged user detail
 */
router.get('/detail', auth.required, (req, res, next) => {
  const { payload: { id } } = req;

      return Users.findById(id).then((user) => {
            if(!user) {
                return res.sendStatus(400);
             }

            return res.json(user);
  });
});

/**
 * Get All users created by me
 */

// router.get('/createdbyme', auth.required, (req, res, next) => {
//       const { payload: { id } } = req;
//       Users.find({createdBy:id},"firstName lastName email company id status")
//           .populate('domains',"id name url")
//           .populate('role',"roleID label -_id")
//           .exec(function (err, user) {
//               console.log(user);
//             if (err){
//               return res.status(400).json({
//                 errors: {
//                   message: err.message
//                 }
//               });
//             };

//             res.json(user);
//       });
// });

/**
 * Get All users created by me
 */

router.get('/createdbyme', auth.required, (req, res, next) => {
    const { payload: { id } } = req;
Users.find({createdBy:id},"firstName lastName email company id status")
    .populate('domains',"id name url")
    .populate('role',"roleID label -_id")
    .exec(function (err, user) {
        console.log(user);
        if (err){
            return res.status(400).json({
                errors: {
                    message: err.message
                }
            });
        };

        res.json(user);
    });
});


/**
 * Get All users created by me
 */

router.get('/profile', auth.required, (req, res, next) => {
    const { payload: { id } } = req;
        Users.find({_id:id},"firstName lastName email company id status")
            .populate('domains',"id name url")
            .populate('role',"roleID label -_id")
            .exec(function (err, user) {
                console.log(user);
                if (err){
                    return res.status(400).json({
                        errors: {
                            message: err.message
                        }
                    });
                };

                res.json(user[0]);
        });
});

/**
 * Share
 */
router.post('/share', auth.optional, (req, res, next) => {
    const { body: { share } } = req;
    console.log(share['url']); 
    const users = share['users'];
    const accountID = share['accountID'];

    _.each(users,function(id){
        Users.findOne({_id:id}).then((user) => {
            if(!user){
               
            }else{
                const domains = user.domains;
                domains.push(accountID)
                user.domains = _.uniq(domains);
                console.log("SEND MAIL TO EXISTING USER");
                user.save(function(err) {
                    if(!err) { } else { }
                });
            }
        });
    });

    res.json(share); 
});
/**
 * Send email to newly regsitered user
 * @param id
 */
function sendMailToNewUser(emailID ,ID){
    const request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: {
            personalizations: [
                {
                    to: [{email: emailID}],
                    subject: EMAIL_SENDGRID_REGISTER_USER,
                    dynamic_template_data:{
                        path:PATH_SENDGRID_REGISTER_USER+ID
                    }
                }
            ],
            template_id:"d-6762260d6f2542f596c7fd5dd2457e13",
            from: {
                email: 'admin@inclusive.digital'
            }
        }
    });
    sg.API(request).then((response)=>{}).catch((error)=> {});
}

/**
 * Send email to recover password
 * @param emaild id
 */
function sendMailForPasswordRecovery(emailID,ID){
    const request = sg.emptyRequest({
        method: 'POST',
        path: '/v3/mail/send',
        body: {
            personalizations: [
                {
                    to: [{email: emailID}],
                    subject: EMAIL_SENDGRID_RECOVER_PASSWORD,
                    dynamic_template_data:{
                        path:PATH_SENDGRID_RECOVER_PASSWORD+ID
                    }
                }
            ],
            template_id:"d-d39393de0d6f48948104c464902ed564",
            from: {
                email: 'admin@inclusive.digital'
            }
        }
    });
    sg.API(request).then((response)=>{}).catch((error)=> {});
}

module.exports = router;