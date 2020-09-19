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

    await set_conf(event);
    await del_tag(event.member_id);
    await set_tag(event);
    
    res.body = param;
    return res;
}

async function set_tag(event){
    var params
    
    for(var i = 0; i < event.tag.length; i++){
        var item = new Object();
        
        item.member_id = event.member_id;
        
        Object.keys(constants.tag_columns).map(key => {
            if(event.tag[i][key] != undefined) item[key] = event.tag[i][key];
        })
        
        params = {
            TableName : "ohaco_user_tag",
            Item : item
        }
    
        await ddb.put(params).promise();
    }
}

async function del_tag(id){
    var result;
    var params = {
        TableName : "ohaco_user_tag",
        KeyConditionExpression : "member_id = :member_id",
        ExpressionAttributeValues : {
            ":member_id" : id
        }
    };
    
    result = await ddb.query(params).promise();
    
    for(var i = 0; i < result.Count; i++){
        params = {
            TableName : "ohaco_user_tag",
            Key : {
                "member_id" : id,
                "tag_id" : result.Items[i].tag_id
            }
        }
        
        await ddb.delete(params).promise();
    }
}

async function set_conf(event){
    var params, item;
    
    item = await get_info(event.member_id);
    item.update_date = parseInt(_dstring(new Date()));
    item.premium = parseInt(1);
    
    //Object.keys(constants.user_columns).map(key => {
    //    if(event[key] != undefined) item[key] = event[key];
    //})
    constants.user_columns.map(val => {
        if(event[val.key] != undefined){
            if(val.type == "number"){
                item[val.key] = parseInt(event[val.key]);
            }else{
                item[val.key] = event[val.key];
            }
        }
    })
    
    console.log(item);
    
    params = {
        TableName : "ohaco_user",
        Item : item
    }
    
    await ddb.put(params).promise();
}

async function get_info(user_id){
    var result;
    var params = {
        TableName : "ohaco_user",
        KeyConditionExpression : "member_id = :member_id",
        ExpressionAttributeValues : {
            ":member_id" : user_id
        }
    };
    
    result = (await ddb.query(params).promise()).Items[0];
    
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