exports.handler = async function(event) {
  if(event.httpMethod !== 'POST'){
    return {statusCode:405, body:'Method Not Allowed'};
  }

  var body;
  try{ body = JSON.parse(event.body); }
  catch(e){ return {statusCode:400, body:'Invalid JSON'}; }

  var prompt = body.prompt;
  if(!prompt){ return {statusCode:400, body:'Missing prompt'}; }

  var apiKey = process.env.OR_API_KEY;
  var model  = process.env.OR_MODEL || 'perplexity/sonar';

  if(!apiKey){ return {statusCode:500, body:'API key not configured'}; }

  try{
    var response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aischolarshiphunter.netlify.app',
        'X-Title': 'AI Scholarship Hunter'
      },
      body: JSON.stringify({
        model: model,
        messages: [{role:'user', content:prompt}],
        temperature: 0.5,
        max_tokens: 5000
      })
    });

    if(!response.ok){
      var errText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({error: 'OpenRouter error: ' + response.status, detail: errText})
      };
    }

    var data = await response.json();
    return {
      statusCode: 200,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    };
  } catch(e){
    return {statusCode:500, body: JSON.stringify({error: e.message})};
  }
};
