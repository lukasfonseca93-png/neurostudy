export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { rawNote } = req.body || {};
  if (!rawNote || rawNote.trim().length < 20) return res.status(400).json({ error: 'Nota muito curta para processar' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key não configurada' });

  const AREAS = ['neuro','biblia','ingles','livros','geral'];
  const AREA_LABELS = { neuro:'Neurociências', biblia:'Estudo Bíblico', ingles:'Inglês', livros:'Livros', geral:'Área Geral' };

  try {
    const prompt = `Você é um assistente de aprendizado especializado em processar notas e transformá-las em material de estudo estruturado.

Analise a nota abaixo e extraia as informações mais importantes.

RESPONDA APENAS com JSON válido neste formato exato (sem markdown, sem texto antes ou depois):
{
  "title": "título conciso do tópico principal (máx 60 chars)",
  "area": "uma das opções: neuro | biblia | ingles | livros | geral",
  "summary": "resumo do conteúdo em 2-3 frases diretas, capturando a essência",
  "keyPoints": ["ponto-chave 1", "ponto-chave 2", "ponto-chave 3", "ponto-chave 4", "ponto-chave 5"],
  "tags": ["tag1", "tag2", "tag3"],
  "connections": ["conceito relacionado que o autor provavelmente conhece 1", "conceito relacionado 2"]
}

REGRAS:
- "area": escolha com base no conteúdo (neuro=neurociência/psicologia/comportamento, biblia=teologia/fé, ingles=idiomas, livros=literatura/ensaios, geral=outros)
- "keyPoints": exatamente 5 pontos, cada um uma frase completa de aprendizado
- "tags": 2-5 palavras-chave relevantes, minúsculas
- "connections": 2 conceitos que se conectam com essa nota (para o Commonplace Book)
- Se a nota for muito curta ou sem sentido, retorne {"error": "nota insuficiente"}

NOTA A PROCESSAR:
${rawNote.slice(0, 6000)}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Erro na API Anthropic');

    const text = data.content?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Formato inválido');

    const result = JSON.parse(match[0]);
    if (result.error) return res.status(400).json({ error: result.error });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
