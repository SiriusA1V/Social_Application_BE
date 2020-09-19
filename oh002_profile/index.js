const http = require('http');
const AWS = require('aws-sdk');
const constants = require('./constants');
const uuid = require('node-uuid');
process.env.TZ = "Asia/Tokyo";

const s3 = new AWS.S3(constants.access);
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

    if(await check_id(event.member_id, event.token_id)) param.check = true;
    else param.check = false;

    res.statusCode = 200;
    res.headers = headers;
    res.body = param;
    return res;
}

async function check_id(serial_id, token_id){
    var result, params;
    
    params = {
        TableName : "ohaco_user",
        KeyConditionExpression : "#member_id = :val",
        ExpressionAttributeNames : {
            "#member_id" :  "member_id",
            "#token_id" :  "token_id",
        },
        ExpressionAttributeValues : {
            ":val" : serial_id,
            ":val2" : token_id
        },
        FilterExpression : "#token_id = :val2"
    };

    result = await ddb.query(params).promise();

    if(""+result.Count == "1") return true;
    else return false;    
}

const test_server = http.createServer(function(req, res){
    var res_save = new Object();

    req.on('data', async function(data){

        res_save = await main(JSON.parse(data.toString()));
        
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept');
        res.setHeader('Access-Control-Allow-Credentials', true);

        console.log(res_save);

        res.end(JSON.stringify(res_save));
    }) 
})
test_server.listen(4000, () => console.log(`Listening on port ${4000}`))

exports.handler = async (event, context) => main(event);