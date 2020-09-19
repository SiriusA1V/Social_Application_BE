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

    var result = await get_events_id(event.member_id);
    
    param.event_info=  await get_event_info(result.Items, result.Count);
   
    res.statusCode = 200;
    res.headers = headers;
    res.body = param;
    return res;
}

async function get_events_id(id){
    var result;
    
    
    var params = {
        TableName : "ohaco_event_member",
        IndexName : "member_id-index",
        ExpressionAttributeNames : {
            "#member_id" : "member_id"
        },
        ExpressionAttributeValues : {
            ":val" : id
        },
        KeyConditionExpression : "#member_id = :val"
    };
    
    result = (await ddb.query(params).promise());
    
    return result;
}

async function get_event_info(data, len){
    var result = new Array();
    var params;

    var idx = 0;
    for(var i = 0; i < len; i++){
        params = {
            TableName : "ohaco_event",
            ExpressionAttributeNames : {"#event_id" : "event_id", "#end_date" : "end_date"},
            ExpressionAttributeValues : {
                ":val" : data[i].event_id,
                ":val2" : now_date
            },
            KeyConditionExpression : "#event_id = :val",
            FilterExpression : "#end_date > :val2"
        };
        
        var save_result = (await ddb.query(params).promise()).Items[0];
        
        if(save_result) {
            result[idx] = save_result;
            params = {
                TableName : "ohaco_shop",
                ExpressionAttributeNames : {"#shop_id" : "shop_id"},
                ExpressionAttributeValues : {
                    ":val" : result[idx].shop_id
                },
                KeyConditionExpression : "#shop_id = :val"
            };
            
            save_result = (await ddb.query(params).promise()).Items[0];
            
            if(save_result){
                result[idx].shop_name = save_result.shop_name;
            }
            
            idx++;
        }
        
    }
    
    
    return result;
    
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