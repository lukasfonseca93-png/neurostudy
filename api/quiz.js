export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { notes, title } = req.body || {};
  if (!notes) return res.status(400).json({ error: 'Sem conteúdo para gerar quiz' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key não configurada' });

  try {
    const prompt = `Você é um professor especialista. Crie exatamente 5 perguntas de múltipla escolha em português brasileiro sobre o conteúdo abaixo.

REGRAS:
- Responda APENAS com JSON válido, sem texto antes ou depois
- Formato: [{"q":"pergunta?","opts":["A. opção","B. opção","C. opção","D. opção"],"ans":0}]
- "ans" é o índice da resposta correta (0=A, 1=B, 2=C, 3=D)
- Perguntas devem testar compreensão real, não apenas memorização

CONTEÚDO:
${notes.slice(0, 4000)}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Erro na API');

    const text = data.content?.[0]?.text || '[]';
    const match = text.match(/\[[\s\S]*\]/);
    const questions = match ? JSON.parse(match[0]) : [];

    if (!questions.length) throw new Error('Nenhuma pergunta gerada');
    return res.status(200).json({ questions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
