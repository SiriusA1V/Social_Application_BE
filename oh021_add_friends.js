const AWS = require('aws-sdk');
const constants = require('./constants');
var ddb = new AWS.DynamoDB.DocumentClient(constants.access);
process.env.TZ = "Asia/Tokyo";

var param = new Object();

async function main(event){
    var res = new Object();
    var headers = new Object();

    headers = {
        'Access-Control-Allow-Origin' : '*',
        'Content-Type' : 'text/plain',
        'Access-Control-Allow-Headers' : 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Credentials' : true
    }
    res.statusCode = 200;
    res.headers = headers;

    await set_friend(event);
    
    res.body = param;
    return res;
}

async function set_friend(event){
    var params
    
    params = {
            TableName : "ohaco_member_friends",
            Item : {
                "member_id" : event.member_id,
                "friend_id" : event.friend_id,
                "state_flag" : 1
            }
    }
    
    await ddb.put(params).promise();
    
    params = {
            TableName : "ohaco_member_friends",
            Item : {
                "member_id" : event.friend_id,
                "friend_id" : event.member_id,
                "state_flag" : 0
            }
    }
    
    await ddb.put(params).promise();
}

function _dstring(__in){
    let _d_form = (_in) => {
        return ('0' + (_in)).slice(-2);
    };
    return  __in.getFullYear() + _d_form(__in.getMonth()+1) + _d_form(__in.getDate())
        + _d_form(__in.getHours()) + _d_form(__in.getMinutes())+ _d_form(__in.getSeconds())
        + ('00' + __in.getMilliseconds()).slice(-2);
}

exports.handler = async (event, context) => main(event);