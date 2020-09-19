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

    var limit_date = parseInt(event.limit_date)
    var friends_info = await get_friends_id(event.member_id);
    var result_f = await get_event_info_f(friends_info.Items, friends_info.Count, event.member_id,limit_date, event.search);
    var result_a = await get_event_info_a(limit_date, event.search);
    var result_m = await get_event_info_m(event.member_id, limit_date, event.search);
    
    var result = new Array();
    
    result = result.concat(result_f);
    result = result.concat(result_a);
    result = result.concat(result_m);
    
    param.event_info = result;
   
    res.statusCode = 200;
    res.headers = headers;
    res.body = param;
    return res;
}

async function get_event_info_m(member_id, limit_date, search){
    var params, result;

    params = {
        TableName : "ohaco_event",
        IndexName : "hiding-end_date-index",
        ExpressionAttributeNames : {"#hiding" : "hiding", "#end_date" : "end_date", "#member_id" : "member_id", "#event_name" : "event_name"},
        ExpressionAttributeValues : {
            ":val" : "lock",
            ":now_date" : now_date,
            ":limit_date" : limit_date,
            ":member_id" : member_id,
            ":event_name" : search
        },
        KeyConditionExpression : "#hiding = :val and (#end_date BETWEEN :now_date and :limit_date)",
        FilterExpression : "#member_id = :member_id and begins_with(#event_name, :event_name)", //contains(#event_name, :event_name)
        ScanIndexForward : true
    };
    
    result = (await ddb.query(params).promise()).Items;
    
    return result;
}

async function get_event_info_a(limit_date, search){
    var params, result;

    params = {
        TableName : "ohaco_event",
        IndexName : "hiding-end_date-index",
        ExpressionAttributeNames : {"#hiding" : "hiding", "#end_date" : "end_date", "#event_name" : "event_name"},
        ExpressionAttributeValues : {
            ":val" : "all",
            ":now_date" : now_date,
            ":limit_date" : limit_date,
            ":event_name" : search
        },
        KeyConditionExpression : "#hiding = :val and (#end_date BETWEEN :now_date and :limit_date)",
        FilterExpression : "begins_with(#event_name, :event_name)", //contains(#event_name, :event_name)
        ScanIndexForward : true
    };
    
    result = (await ddb.query(params).promise()).Items;
    
    return result;
}

async function get_friends_id(id){
    var result;
    
    
    var params = {
        TableName : "ohaco_member_friends",
        //IndexName : "",
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

async function get_event_info_f(data, len, user_id,limit_date, search){
    var params, result;
    
    data[data.length] = new Object();
    data[data.length-1].friend_id = user_id;

    var value = new Object(), filter = "(";
    for(var i = 0; i < len+1; i++){
        value[":id_"+i] = data[i].friend_id;
        filter += ":id_"+i + ",";
    }
    value[":limit"] = "friend";
    value[":now_date"] = now_date;
    value[":limit_date"] = limit_date;
    value[":event_name"] = search;
    filter = filter.substr(0, filter.length-1) + ")";
    
    
    
    params = {
        TableName : "ohaco_event",
        IndexName : "hiding-end_date-index",
        ExpressionAttributeNames : {"#hiding" : "hiding", "#end_date" : "end_date", "#member_id" : "member_id", "#event_name" : "event_name"},
        ExpressionAttributeValues : value,
        KeyConditionExpression : "#hiding = :limit and (#end_date BETWEEN :now_date and :limit_date)",
        FilterExpression : "#member_id IN"+filter+" and begins_with(#event_name, :event_name)", //contains(#event_name, :event_name)
        ScanIndexForward : true
    };
    
    
    result = (await ddb.query(params).promise()).Items;
    
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