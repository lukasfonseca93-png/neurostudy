export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { notes, title } = req.body || {};
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key não configurada' });

  const prompt = `Analise este conteúdo de estudo e gere um resumo + mapa mental estruturado.

Título: ${title}
Conteúdo: ${(notes || '').slice(0, 2500)}

Responda APENAS com JSON válido neste formato exato:
{
  "resumo": "resumo conciso em 3-5 frases destacando os conceitos principais",
  "mapa": {
    "centro": "${(title || '').replace(/"/g, '')}",
    "ramos": [
      {"label": "Conceito Principal 1", "cor": "#9D95E8", "filhos": ["detalhe A", "detalhe B", "detalhe C"]},
      {"label": "Conceito Principal 2", "cor": "#60A5FA", "filhos": ["detalhe A", "detalhe B"]},
      {"label": "Conceito Principal 3", "cor": "#FBBF24", "filhos": ["detalhe A", "detalhe B", "detalhe C"]},
      {"label": "Aplicações", "cor": "#34C98A", "filhos": ["aplicacao 1", "aplicacao 2"]}
    ]
  }
}

Use no máximo 6 ramos. Cada ramo com 2-4 filhos. Filhos com no máximo 4 palavras cada.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      return res.status(200).json(result);
    }
    throw new Error('Resposta inválida da IA');
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
