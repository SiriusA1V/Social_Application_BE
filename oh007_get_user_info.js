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

    param.user_info=  await get_user_info(event.member_id);

    res.statusCode = 200;
    res.headers = headers;
    res.body = param;
    return res;
}

async function get_user_info(id){
    var result = new Array();
    var params;

    params = {
        TableName : "ohaco_user",
        ExpressionAttributeNames : {"#member_id" : "member_id"},
        ExpressionAttributeValues : {
            ":val" : id
        },
        KeyConditionExpression : "#member_id = :val",
    };
        
    result = (await ddb.query(params).promise()).Items[0];
        
    params = {
        TableName : "ohaco_user_tag",
        ExpressionAttributeNames : {"#member_id" : "member_id"},
        ExpressionAttributeValues : {
            ":val" : id
        },
        KeyConditionExpression : "#member_id = :val",
    };
        
    var get_tag_rslt = await ddb.query(params).promise();
        
    if(get_tag_rslt.Count != 0) result.tag = (await ddb.query(params).promise()).Items;
    
    return result;
    
}

exports.handler = async (event, context) => main(event);