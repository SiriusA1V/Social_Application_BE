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

    param.event_info=  await get_event_info(event.limit_date, event.member_id);
   
    res.statusCode = 200;
    res.headers = headers;
    res.body = param;
    return res;
}


async function get_event_info(limit_date, user_id){
    var result = new Array(), all_limit_event = [];
    var params;

    params = {
        TableName : "ohaco_event",
        IndexName : "hiding-end_date-index",
        ExpressionAttributeNames : {"#hiding" : "hiding", "#end_date" : "end_date"},
        ExpressionAttributeValues : {
            ":val" : "all",
            ":now_date" : now_date,
            ":limit_date" : parseInt(limit_date)
        },
        KeyConditionExpression : "#hiding = :val and (#end_date BETWEEN :now_date and :limit_date)",
        ScanIndexForward : true
    };
    
    all_limit_event = (await ddb.query(params).promise()).Items;
    
    var idx = 0;
    for(var i = 0; i < all_limit_event.length; i++){
        params = {
            TableName : "ohaco_event_member",
            ExpressionAttributeNames : {"#event_id" : "event_id", "#member_id" : "member_id"},
            ExpressionAttributeValues : {
                ":eventId" : all_limit_event[i].event_id,
                ":memberId" : user_id
            },
            KeyConditionExpression : "#event_id = :eventId and #member_id = :memberId"
        };
        
        if((await ddb.query(params).promise()).Count == 0){
            result[idx] = all_limit_event[i];
            
            params = {
                TableName : "ohaco_shop",
                ExpressionAttributeNames : {"#shop_id" : "shop_id"},
                ExpressionAttributeValues : {
                    ":val" : result[idx].shop_id
                },
                KeyConditionExpression : "#shop_id = :val"
            };
            
            var save_tag = (await ddb.query(params).promise()).Items[0];
            
            if(save_tag){
                result[idx].shop_name = save_tag.shop_name;
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