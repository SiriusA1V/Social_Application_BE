const AWS = require('aws-sdk');
const constants = require('./constants');
process.env.TZ = "Asia/Tokyo";

var ddb = new AWS.DynamoDB.DocumentClient(constants.access);
var param = new Object();
var now_date = parseInt(_dstring(new Date()));

async function main(event){
    var res = new Object();
    var headers = new Object();

    headers = {
        'Access-Control-Allow-Origin' : '*',
        'Content-Type' : 'text/plain',
        'Access-Control-Allow-Headers' : 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Credentials' : true
    }

    await get_event_info(event.event_id);
   
    res.statusCode = 200;
    res.headers = headers;
    res.body = param;
    return res;
}


async function get_event_info(event_id){
    var result = [], all_member_list = [];
    var params;

    params = {
        TableName : "ohaco_event",
        ExpressionAttributeNames : {"#event_id" : "event_id"},
        ExpressionAttributeValues : {
            ":val" : event_id,
        },
        KeyConditionExpression : "#event_id = :val"
    };
    
    param.event_info = (await ddb.query(params).promise()).Items[0];
    
    params = {
        TableName : "ohaco_event_tag",
        ExpressionAttributeNames : {"#event_id" : "event_id"},
        ExpressionAttributeValues : {
            ":val" : event_id
        },
        KeyConditionExpression : "#event_id = :val"
    }
    
    param.event_info.tag = (await ddb.query(params).promise()).Items;
    
    
    if(param.event_info.shop_id != 0){
        params = {
            TableName : "ohaco_shop",
            ExpressionAttributeNames : {"#shop_id" : "shop_id"},
            ExpressionAttributeValues : {
                ":val" : param.event_info.shop_id
            },
            KeyConditionExpression : "#shop_id = :val"
        };
        
        var save_shop_info = (await ddb.query(params).promise()).Items[0];
        
        if(save_shop_info){
            param.event_info.shop_name = save_shop_info.shop_name;
            param.event_info.address = save_shop_info.address;
        }
    }
    
    params = {
            TableName : "ohaco_event_member",
            ExpressionAttributeNames : {"#event_id" : "event_id"},
            ExpressionAttributeValues : {
                ":eventId" : event_id
            },
            KeyConditionExpression : "#event_id = :eventId"
        };
        
    all_member_list = (await ddb.query(params).promise()).Items;
            
    for(var i = 0; i < all_member_list.length; i++){
    params = {
        TableName : "ohaco_user",
        ExpressionAttributeNames : {"#member_id" : "member_id"},
        ExpressionAttributeValues : {
            ":val" : all_member_list[i].member_id
        },
        KeyConditionExpression : "#member_id = :val",
    };
    
    result[i] = (await ddb.query(params).promise()).Items[0];
    }
    
    param.member_info = result;
    
    params = {
        TableName : "ohaco_event_friend_nice_list",
        ExpressionAttributeNames : {"#event_id" : "event_id"},
        ExpressionAttributeValues : {
            ":val" : event_id
        },
        KeyConditionExpression : "#event_id = :val",
    }
    
    param.interest_list = (await ddb.query(params).promise()).Items;
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