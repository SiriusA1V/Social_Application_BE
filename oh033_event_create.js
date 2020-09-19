const AWS = require('aws-sdk');
const constants = require('./constants');
const uuid = require('node-uuid');
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

    var ran_id = await set_id_controller(event);
    await del_tag(ran_id);
    await set_tag(event,ran_id);

    res.statusCode = 200;
    res.headers = headers;
    res.body = param;
    return res;
}

async function set_tag(event,ran_id){
    var params
    
    for(var i = 0; i < event.tag.length; i++){
        var item = new Object();
        
        item.event_id = ran_id;
        
        Object.keys(constants.tag_columns).map(key => {
            if(event.tag[i][key] != undefined) item[key] = event.tag[i][key];
        })
        
        params = {
            TableName : "ohaco_event_tag",
            Item : item
        }
    
        console.log(params)
    
        await ddb.put(params).promise();
    }
}

async function del_tag(id){
    var result;
    var params = {
        TableName : "ohaco_event_tag",
        KeyConditionExpression : "event_id = :event_id",
        ExpressionAttributeValues : {
            ":event_id" : id
        }
    };
    
    
    result = await ddb.query(params).promise();
    
    for(var i = 0; i < result.Count; i++){
        params = {
            TableName : "ohaco_event_tag",
            Key : {
                "event_id" : id,
                "tag_id" : result.Items[i].tag_id
            }
        }
        
        await ddb.delete(params).promise();
    }
}

async function set_id_controller(event){
    var ran_id;
    
    if(event.event_id !== null && event.event_id !== undefined){
        ran_id = event.event_id;
        
        await make_event(ran_id, event);
        await inst_member(ran_id, event.member_id, event.member_name);
    }else{
        while(true){
            ran_id = "m_"+uuid.v4();
            
            if(await unique_check(ran_id)){
                await make_event(ran_id, event);
                await inst_member(ran_id, event.member_id, event.member_name);
                break;
            }
        }
    }
    
    return ran_id;
}

async function inst_member(event_id, member_id, member_name){
    var params, item = new Object();
    
    params = {
        TableName : "ohaco_event_member",
        Item : {
            "event_id" : event_id,
            "member_id" : member_id,
            "member_name" : member_name
        }
    }
    
    await ddb.put(params).promise();
}

async function make_event(id, event){
    var result, params, item = new Object();
    
    //Object.keys(constants.event_columns).map(key => {
    //    if(event[key] != undefined) item[key] = event[key];
    //})
    constants.event_columns.map(val => {
        if(event[val.key] != undefined){
            if(val.type == "number"){
                item[val.key] = parseInt(event[val.key]);
            }else{
                item[val.key] = event[val.key] == "" ? null : event[val.key];
            }
        }
    })
    
    
    item.event_id = id;
    item.insert_date = now_date;
    item.update_date = now_date;

    params = {
        TableName : "ohaco_event",
        Item : item
    }
    
    await ddb.put(params).promise();
}

async function unique_check(serial_id){
    var result, params;
    
    params = {
        TableName : "ohaco_event",
        KeyConditionExpression : "event_id = :event_id",
        ExpressionAttributeValues : {
            ":event_id" : serial_id
        }
    };

    result = await ddb.query(params).promise();

    if(""+result.Count == "0") return true;
    else return false;    
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