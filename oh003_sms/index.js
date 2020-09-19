const AWS = require('aws-sdk');
const constants = require('./constants');
var ddb = new AWS.DynamoDB.DocumentClient(constants.access);
const sns = new AWS.SNS({apiVersion: '2010-03-31'});
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


    var rand = ""+Math.floor(Math.random()*(9999)+1);
    rand = "0000".substring(rand.length) + rand;
    
    await send_message(event.tel, rand);
    await set_phone(event.member_id, event.tel)
    param.pswd = rand;

    res.body = param;
    return res;
}

async function set_phone(user_id, tel){
    var params, item;
    
    item = await get_info(user_id);
    item.tel = tel;
    item.update_date = parseInt(_dstring(new Date()));

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
        + ('00' + __in.getMilliseconds()).slice(-3);
}

async function send_message(tel, rand){
    let phoneNumber = "+81"+tel;
    let message = "次の承認番号を入力ください。\n「" + rand + "」";
    
    var params = {
        Message : message,
        PhoneNumber : phoneNumber,
        MessageAttributes : {
            'AWS.SNS.SMS.SenderID': {
            'DataType': 'String',
            'StringValue': 'ohaco'
            }
        }
    }
    
    await sns.publish(params).promise();
}

exports.handler = async (event, context) => main(event);