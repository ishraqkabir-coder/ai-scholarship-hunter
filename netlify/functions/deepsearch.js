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
  if(!tavilyKey) return { statusCode: 500, body: JSON.stringify({error: 'API key not configured'}) };

  try{
    var tavilyRes = await httpsPost(
      'api.tavily.com',
      '/search',
      { 'Authorization': 'Bearer ' + tavilyKey, 'Content-Type': 'application/json' },
      {
        query: prompt.slice(0, 300),
        search_depth: 'advanced',
        max_results: 10,
        include_answer: true,
        include_raw_content: false
      }
    );

    if(tavilyRes.status !== 200){
      return { statusCode: tavilyRes.status, body: JSON.stringify({error: 'Search error: ' + tavilyRes.status}) };
    }

    var tavilyData;
    try{ tavilyData = JSON.parse(tavilyRes.body); }
    catch(e){ return { statusCode: 500, body: JSON.stringify({error: 'Parse error'}) }; }

    var results = tavilyData.results || [];
    var answer = tavilyData.answer || '';

    var deepResult = {
      scholarshipName: '',
      whyForYou: answer || 'Based on real-time web research, this scholarship matches your academic profile and goals.',
      minRequirements: results.slice(0,3).map(function(r){
        return { label: 'Source', value: r.title || '' };
      }),
      requiredDocuments: [
        { name: 'Academic Transcripts', note: 'Official transcripts required' },
        { name: 'Personal Statement', note: 'Essays about goals and achievements' },
        { name: 'Recommendation Letters', note: 'Usually 2-3 letters required' },
        { name: 'English Test Score', note: 'IELTS/TOEFL as required' }
      ],
      pros: results.slice(0,3).map(function(r){ return (r.title||'').slice(0,80); }).filter(Boolean),
      cons: ['Competitive application process', 'Specific eligibility requirements'],
      pastRecipients: { anyFromCountry: false, stories: [] },
      youtubeVideos: [
        { title: 'How to apply for international scholarships', searchQuery: 'how to apply international scholarship guide english', channel: '', relevance: 'General scholarship application guide' },
        { title: 'Scholarship application tips', searchQuery: 'scholarship application tips tricks 2025 english', channel: '', relevance: 'Tips for stronger applications' }
      ]
    };

    var fakeResponse = {
      choices: [{
        message: {
          content: JSON.stringify(deepResult)
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
