const https = require('https');

function httpsPost(url, headers, bodyData) {
  return new Promise(function(resolve, reject) {
    var urlObj = new URL(url);
    var bodyStr = JSON.stringify(bodyData);
    var options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: Object.assign({
        'Content-Length': Buffer.byteLength(bodyStr)
      }, headers)
    };
    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk){ data += chunk; });
      res.on('end', function(){
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, function(){ req.destroy(new Error('Request timeout')); });
    req.write(bodyStr);
    req.end();
  });
}

exports.handler = async function(event) {
  if(event.httpMethod !== 'POST'){
    return {statusCode:405, body:'Method Not Allowed'};
  }

  var body;
  try{ body = JSON.parse(event.body); }
  catch(e){ return {statusCode:400, body:'Invalid JSON'}; }

  var prompt = body.prompt;
  if(!prompt){ return {statusCode:400, body:'Missing prompt'}; }

  var apiKey = process.env.GROQ_API_KEY;
  if(!apiKey){ return {statusCode:500, body:JSON.stringify({error:'API key not configured'})}; }

  try{
    var result = await httpsPost(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Groq-Model-Version': 'latest'
      },
      {
        model: 'groq/compound',
        messages: [{role:'user', content: prompt}],
        temperature: 0.5,
        max_tokens: 5000,
        compound_custom: {
          tools: { enabled_tools: ['web_search', 'visit_website'] }
        }
      }
    );

    if(result.status !== 200){
      return {
        statusCode: result.status,
        body: JSON.stringify({error: 'Groq error: ' + result.status, detail: result.body})
      };
    }

    return {
      statusCode: 200,
      headers: {'Content-Type': 'application/json'},
      body: result.body
    };
  } catch(e){
    return {statusCode:500, body: JSON.stringify({error: e.message})};
  }
};
