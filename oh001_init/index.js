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
    
    await set_id_controller(event.token_id);

    res.statusCode = 200;
    res.headers = headers;
    res.body = param;
    return res;
}

async function set_id_controller(token_id){
    var ran_id, ran_name;

    while(true){
        ran_id = "m_"+uuid.v4();
        ran_name = constants.adjective[Math.floor(Math.random()*(constants.adjective.length))] + constants.noun[Math.floor(Math.random()*(constants.noun.length))];

        if(await unique_check(ran_id)){
            await init_id(ran_id, ran_name, token_id);
            param.member_id = ran_id;
            param.name = ran_name;
            break;
        }
    }
}

async function init_id(serial_id, name, token_id){
    var result, params;

    params = {
        TableName : "ohaco_user",
        Item : {
            "member_id" : serial_id,
            "name" : name,
            "token_id" : token_id,
            "premium" : 0,
            "insert_date" : parseInt(_dstring(new Date()))
        }
    }
    console.log(params);

    result = await ddb.put(params).promise();

    console.log(result);
}

async function unique_check(serial_id){
    var result, params;
    
    params = {
        TableName : "ohaco_user",
        KeyConditionExpression : "member_id = :member_id",
        ExpressionAttributeValues : {
            ":member_id" : serial_id
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