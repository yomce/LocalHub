export function openAiProxyPlugin() {
  return {
    name: 'openai-proxy',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })

        req.on('end', async () => {
          try {
            const { systemPrompt = '', userPrompt = '', model = 'gpt-3.5-turbo' } = JSON.parse(body || '{}')
            const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || ''

            if (!apiKey) {
              res.statusCode = 503
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'OpenAI API key is not configured on the server.' }))
              return
            }

            const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                max_tokens: 512,
                temperature: 0.6
              })
            })

            if (!openAiResponse.ok) {
              const errorText = await openAiResponse.text().catch(() => '')
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `OpenAI proxy error: ${openAiResponse.status} ${errorText}` }))
              return
            }

            const data = await openAiResponse.json()
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ content: data.choices?.[0]?.message?.content || '' }))
          } catch (error) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Failed to complete chat request.' }))
          }
        })
      })
    }
  }
}
