const AWS = require('aws-sdk');
const constants = require('./constants');
process.env.TZ = "Asia/Tokyo";

const multipart = require('parse-multipart')

const s3 = new AWS.S3(constants.access);
var ddb = new AWS.DynamoDB.DocumentClient(constants.access);
var param = new Object();

var date_str = _dstring(new Date());

async function main(event){
    var res = new Object();
    var headers = new Object();

    headers = {
        'Access-Control-Allow-Origin' : '*',
        'Content-Type' : 'text/plain',
        'Access-Control-Allow-Headers' : 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Credentials' : true
    }
    
    var id = event.member_id;
    var data = event.file.split(",");
    var body = Buffer.from(data[1], 'base64');
    
    await put_the_file(id, body, "image/png");
    await set_photo_url(id);

    res.statusCode = 200;
    res.headers = headers;
    res.body = param;
    return res;
}

async function put_the_file(id, binary, contenttype){
    let params = {
     ACL: "public-read",
     Bucket: "ohaco",
     Key: "src/photo/profile_background/" + id + "_"  + date_str + ".png",
     ContentType: contenttype,
     Body: binary
    };
    
    await s3.putObject(params).promise();
}

async function set_photo_url(id){
    var params, item;
    
    item = await get_info(id);
    item.update_date = parseInt(_dstring(new Date()));
    item.background_url = "url"+id+"_"+date_str + ".png";
    
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