export function openAiProxyPlugin(env = {}) {
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
            const { systemPrompt = '', userPrompt = '', model = 'gpt-5-mini' } = JSON.parse(body || '{}')
            const apiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY || env.VITE_API_KEY || process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || process.env.VITE_API_KEY || ''

            if (!apiKey) {
              console.warn('[OpenAI] No API key configured on the server proxy.')
              res.statusCode = 503
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'OpenAI API key is not configured on the server.' }))
              return
            }

            console.info('[OpenAI] API key detected. Proxy is sending the request to OpenAI.')

            const requestBody = {
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ]
            }

            if (model && /gpt-5|gpt-4\.1|o[0-9]/i.test(model)) {
              requestBody.max_completion_tokens = 2000
            } else {
              requestBody.max_tokens = 2000
            }

            const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
              },
              body: JSON.stringify(requestBody)
            })
            // console.warn('[OpenAI]' + await openAiResponse.text());

            if (!openAiResponse.ok) {
              const errorText = await openAiResponse.text().catch(() => '')
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `OpenAI proxy error: ${openAiResponse.status} ${errorText}` }))
              return
            }

            const data = await openAiResponse.json()
            console.info('[OpenAI] Proxy received a response from OpenAI successfully.')
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ content: data.choices?.[0]?.message?.content || '' }))
          } catch (error) {
            console.error('[OpenAI] Proxy request failed.', error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Failed to complete chat request.' }))
          }
        })
      })
    }
  }
}
