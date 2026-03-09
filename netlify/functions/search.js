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
    var response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Groq-Model-Version': 'latest'
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [{role:'user', content: prompt}],
        temperature: 0.7,
        max_tokens: 4096,
        compound_custom: {
          tools: { enabled_tools: ['web_search'] }
        }
      })
    });

    if(!response.ok){
      var errText = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({error: 'Groq error: ' + response.status, detail: errText})
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
