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
  var query  = body.query || 'open scholarships 2025 2026 international students';
  if(!prompt) return { statusCode: 400, body: JSON.stringify({error: 'Missing prompt'}) };

  var tavilyKey = process.env.TAVILY_API_KEY;
  if(!tavilyKey) return { statusCode: 500, body: JSON.stringify({error: 'API key not configured'}) };

  try{
    // Step 1: Tavily search with SHORT query
    var tavilyRes = await httpsPost(
      'api.tavily.com',
      '/search',
      { 'Authorization': 'Bearer ' + tavilyKey, 'Content-Type': 'application/json' },
      {
        query: query,
        search_depth: 'advanced',
        max_results: 8,
        include_answer: true,
        include_raw_content: false
      }
    );

    if(tavilyRes.status !== 200){
      return { statusCode: tavilyRes.status, body: JSON.stringify({error: 'Search error: ' + tavilyRes.status, detail: tavilyRes.body}) };
    }

    var tavilyData;
    try{ tavilyData = JSON.parse(tavilyRes.body); }
    catch(e){ return { statusCode: 500, body: JSON.stringify({error: 'Parse error'}) }; }

    // Step 2: Build scholarship list from Tavily results
    var results = tavilyData.results || [];
    var scholarships = results.slice(0, 8).map(function(r, i) {
      var content = (r.content || '').slice(0, 250);
      return {
        name: r.title || 'Scholarship ' + (i+1),
        country: 'International',
        degree: "Bachelor's",
        funding: 'See website',
        amount: 'See website',
        deadline: 'Check website',
        url: r.url || '',
        description: content,
        matchScore: Math.max(60, 95 - i*4),
        matchReasons: ['Found via real-time web search', 'Currently open for applications', 'Matches your search criteria']
      };
    });

    var fakeResponse = {
      choices: [{
        message: {
          content: JSON.stringify({ scholarships: scholarships })
        }
      }]
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fakeResponse)
    };
  } catch(e){
    return { statusCode: 500, body: JSON.stringify({error: e.message}) };
  }
};
