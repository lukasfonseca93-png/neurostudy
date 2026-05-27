export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { notes, title } = req.body || {};
  if (!notes) return res.status(400).json({ error: 'Sem conteúdo para gerar quiz' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key não configurada' });

  try {
    const prompt = `Você é um professor especialista criando uma prova difícil. Crie exatamente 10 perguntas de múltipla escolha em português brasileiro sobre o conteúdo abaixo.

REGRAS OBRIGATÓRIAS:
1. Responda APENAS com JSON válido, sem nenhum texto antes ou depois
2. Formato exato: [{"q":"pergunta?","opts":["A. opção","B. opção","C. opção","D. opção"],"ans":0}]
3. "ans" é o índice da resposta correta: 0=A, 1=B, 2=C, 3=D
4. DISTRIBUA as respostas certas: use cada letra (A, B, C, D) pelo menos 2 vezes. NÃO coloque todas as respostas na mesma letra.
5. As perguntas devem ser DIFÍCEIS — exijam compreensão profunda, não memorização simples
6. Os distratores (respostas erradas) devem ser plausíveis e bem elaborados
7. Varie os tipos: definição, aplicação, comparação, causa/efeito, exemplo prático
8. NÃO repita conceitos entre perguntas

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

    const questions = JSON.parse(match[0]);
    if (!questions.length) throw new Error('Nenhuma pergunta gerada');

    return res.status(200).json({ questions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
