const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Domains = mongoose.model('Domains');
const DomainsLog = mongoose.model('DomainsLog');
const moment = require('moment');
const _ = require('lodash');

/**
 * Add Log
 */
router.post('/add', auth.required, (req, res, next) => {
    const {body: {domain}} = req;
    const domainLog = new DomainsLog(domain);

    return domainLog.save()
        .then((record)=> {
        return res.json(record);
    },(err)=>{
        return res.status(400).json({
            errors: {
                message: err.message
            }
        });
    });
});

/**
 * Get report last n months
 */
router.get('/report/wcagerror/:accountID/:month', auth.required, (req, res, next) => {
        const accID = req.params.accountID;
        const month = req.params.month;

        const startDate = moment().subtract(month,"months");
        DomainsLog.find({
            createdDate:{$gte:startDate},
            domainID:accID
        },"violation.wcagError createdDate -_id").then((log) => {
            if(!log){
                return res.status(400).json({
                    errors: {
                        message: 'log not found'
                    }
                });
            }else{

            let LEVEL_A =[];
            let LEVEL_AA =[];
            let SECTION_508 =[];
            let OTHER =[];
            let data = [];

                for(var i=0;i< month;i++){
                    const date = moment().subtract((i),"months");
                    const month  = date.format('MMMM');
                    const year   = date.format('YYYY');

                    LEVEL_A[i]     = {name:month,value:0};
                    LEVEL_AA[i]    = {name:month,value:0};
                    SECTION_508[i] = {name:month,value:0};
                    OTHER[i]       = {name:month,value:0};

                     _.each(log,(v,k)=>{
                        const wcagError  = v['violation']['wcagError'];
                        const dataDate   = moment(v['createdDate']);
                        const dataMonth  = dataDate.format('MMMM');
                        const dataYear   = dataDate.format('YYYY');

                        if(dataMonth == month && dataYear == year){
                            LEVEL_A[i] = {name:month,value:_.find(wcagError,{name:"Level A"})['violation']};
                            LEVEL_AA[i] = {name:month,value:_.find(wcagError,{name:"Level AA"})['violation']};
                            SECTION_508[i] = {name:month,value:_.find(wcagError,{name:"Section 508"})['violation']};
                            OTHER[i] = {name:month,value: _.find(wcagError,{name:"Other"})['violation']};
                        }
                     });
                }

            data.push({name:'Level A',series:LEVEL_A.reverse()});
            data.push({name:'Level AA',series:LEVEL_AA.reverse()});
            data.push({name:'Section 508',series:SECTION_508.reverse()});
            data.push({name:'Other',series:OTHER.reverse()});

            return res.json(data);
            }
        });



});

/**
 * Get report last n months
 */
router.get('/report/dashboard/totalErrors/:month', auth.required, (req, res, next) => {
        const { payload: { id } } = req;
        const month = req.params.month;

        const startDate = moment().subtract(month,"months");

        Users.find({_id:id})
            .populate('domains',"-error -__v")
            .exec(function (err, user) {
                console.log(user[0]['domains']);
                if (err){
                    return res.status(400).json({
                        errors: {
                            message: err.message
                        }
                    });
                };

                let userDomains = user[0]['domains'].filter(function(domain) {
                    return (domain.status == "1"); // return only domain with success
                });
                userDomains = _.map(userDomains,"_id");

                DomainsLog.find({createdDate:{$gte:startDate},domainID:{$in:userDomains}},"violation domainID createdDate -_id")
                    .populate('domainID',"name").then((log) => {
                    if(!log){
                    return res.status(400).json({
                        errors: {
                            message: 'log not found'
                        }
                    });
                }else{

                    const groups     = _.groupBy(log,'domainID');
                    const totalError =[];
                    _.each(groups,(log,k1)=>{
                        let VIOLATION  = [];
                        let domainName = '';
                        for(var i=0;i< month;i++){
                            const date = moment().subtract((i),"months");
                            const month  = date.format('MMMM YY');
                            const year   = date.format('YYYY');

                            VIOLATION[i]   = {name:month,value:0};

                            _.each(log,(v,k)=>{
                                const totalError  = v['violation']['totalError'];
                                const dataDate   = moment(v['createdDate']);
                                const dataMonth  = dataDate.format('MMMM YY');
                                const dataYear   = dataDate.format('YYYY');

                                if(dataMonth == month && dataYear == year){
                                    VIOLATION[i] = {name:month,value:totalError};
                                }
                                domainName = v['domainID']['name'];
                            });
                        }

                        totalError.push({name:domainName,series:VIOLATION.reverse()});

                });

                    return res.json(totalError);

                }
            });








            });





});

module.exports = router;