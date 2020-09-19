const http = require('http');
const AWS = require('aws-sdk');
const constants = require('./constants');
var ddb = new AWS.DynamoDB.DocumentClient(constants.access);

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

    var result = await get_friends_id(event.member_id);
    
    param.friend_info=  await get_user_info(result.Items, result.Count);

    res.statusCode = 200;
    res.headers = headers;
    res.body = param;
    return res;
}

async function get_friends_id(id){
    var result;
    
    
    var params = {
        TableName : "ohaco_member_friends",
        //IndexName : "",
        ExpressionAttributeNames : {
            "#member_id" : "member_id",
            "#state_flag" : "state_flag"
        },
        ExpressionAttributeValues : {
            ":val" : id,
            ":flag" : 1
        },
        KeyConditionExpression : "#member_id = :val",
        FilterExpression : "#state_flag = :flag"
        
    };
    
    result = (await ddb.query(params).promise());
    
    return result;
}

async function get_user_info(data, len){
    var result = new Array();
    var params;

    for(var i = 0; i < len; i++){
        params = {
            TableName : "ohaco_user",
            ExpressionAttributeNames : {"#member_id" : "member_id"},
            ExpressionAttributeValues : {
                ":val" : data[i].friend_id
            },
            KeyConditionExpression : "#member_id = :val",
        };
        
        result[i] = (await ddb.query(params).promise()).Items[0];
        
        params = {
            TableName : "ohaco_user_tag",
            ExpressionAttributeNames : {"#member_id" : "member_id"},
            ExpressionAttributeValues : {
                ":val" : data[i].friend_id
            },
            KeyConditionExpression : "#member_id = :val",
        };
        
        var get_tag_rslt = await ddb.query(params).promise();
        
        if(get_tag_rslt.Count != 0) result[i].tag = (await ddb.query(params).promise()).Items;
    }
    
    
    return result;
    
}

exports.handler = async (event, context) => main(event);