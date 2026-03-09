const https = require('https');

function httpsPost(hostname, path, headers, bodyData) {
  return new Promise(function(resolve, reject) {
    var bodyStr = JSON.stringify(bodyData);
    var options = {
      hostname: hostname,
      path: path,
      method: 'POST',
      headers: Object.assign({ 'Content-Length': Buffer.byteLength(bodyStr) }, headers)
    };
    var req = https.request(options, function(res) {
      var data = '';
      res.on('data', function(chunk){ data += chunk; });
      res.on('end', function(){ resolve({ status: res.statusCode, body: data }); });
    });
    req.on('error', reject);
    req.setTimeout(60000, function(){ req.destroy(new Error('Timeout')); });
    req.write(bodyStr);
    req.end();
  });
}

exports.handler = async function(event) {
  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var body;
  try{ body = JSON.parse(event.body); }
  catch(e){ return { statusCode: 400, body: JSON.stringify({error: 'Invalid JSON'}) }; }

  var prompt = body.prompt;
  if(!prompt) return { statusCode: 400, body: JSON.stringify({error: 'Missing prompt'}) };

  var tavilyKey = process.env.TAVILY_API_KEY;
  var orKey     = process.env.OR_API_KEY;
  if(!tavilyKey || !orKey) return { statusCode: 500, body: JSON.stringify({error: 'API keys not configured'}) };

  try{
    // Step 1: Tavily deep search for this specific scholarship
    var tavilyRes = await httpsPost(
      'api.tavily.com',
      '/search',
      { 'Authorization': 'Bearer ' + tavilyKey, 'Content-Type': 'application/json' },
      {
        query: prompt.slice(0, 200),
        search_depth: 'advanced',
        max_results: 10,
        include_answer: true
      }
    );

    var tavilyData;
    try{ tavilyData = JSON.parse(tavilyRes.body); }
    catch(e){ tavilyData = { results: [] }; }

    var searchContext = (tavilyData.results || []).map(function(r, i){
      return (i+1) + '. ' + (r.title||'') + '\n' + (r.url||'') + '\n' + (r.content||'').slice(0, 500);
    }).join('\n\n');

    // Step 2: Gemma 3 27B deep analysis
    var fullPrompt = prompt + '\n\n=== REAL-TIME WEB SEARCH RESULTS ===\n' + searchContext + '\n\nUse these search results for your deep research analysis.';

    var llmRes = await httpsPost(
      'openrouter.ai',
      '/api/v1/chat/completions',
      {
        'Authorization': 'Bearer ' + orKey,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aischolarshiphunter.netlify.app',
        'X-Title': 'AI Scholarship Hunter'
      },
      {
        model: 'google/gemma-3-27b-it:free',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.5,
        max_tokens: 5000
      }
    );

    if(llmRes.status !== 200){
      return { statusCode: llmRes.status, body: JSON.stringify({error: 'LLM error: ' + llmRes.status, detail: llmRes.body}) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: llmRes.body
    };
  } catch(e){
    return { statusCode: 500, body: JSON.stringify({error: e.message}) };
  }
};
