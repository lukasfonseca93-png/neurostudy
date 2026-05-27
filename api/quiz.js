function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleAnswers(questions) {
  return questions.map(q => {
    const correct = q.opts[q.ans];
    const shuffled = shuffle(q.opts);
    return { ...q, opts: shuffled, ans: shuffled.indexOf(correct) };
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { notes, title } = req.body || {};
  if (!notes) return res.status(400).json({ error: 'Sem conteúdo para gerar quiz' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key não configurada' });

  try {
    const prompt = `Você é um professor especialista. Crie exatamente 10 perguntas de múltipla escolha em português brasileiro sobre o conteúdo abaixo.

REGRAS:
1. Responda APENAS com JSON válido, sem texto antes ou depois
2. Formato: [{"q":"pergunta?","opts":["A. opção","B. opção","C. opção","D. opção"],"ans":0}]
3. "ans" é o índice (0-3) da resposta correta
4. Perguntas difíceis: exijam compreensão profunda, não memorização
5. Distratores plausíveis e bem elaborados
6. Varie os tipos: definição, aplicação, comparação, causa/efeito
7. Não repita conceitos entre perguntas

CONTEÚDO:
${notes.slice(0, 5000)}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Erro na API Anthropic');

    const text = data.content?.[0]?.text || '[]';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Formato inválido retornado pela IA');

    const raw = JSON.parse(match[0]);
    if (!raw.length) throw new Error('Nenhuma pergunta gerada');

    // Embaralha as respostas de cada pergunta para garantir distribuição
    const questions = shuffleAnswers(raw);

    return res.status(200).json({ questions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
