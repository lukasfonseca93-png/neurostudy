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
    const cleanOpts = q.opts.map(o => o.replace(/^[A-Da-d][.)]\s*/,'').trim());
    const correct = cleanOpts[q.ans];
    const shuffled = shuffle(cleanOpts);
    return { ...q, opts: shuffled, ans: shuffled.indexOf(correct) };
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { notes, title, noteContent } = req.body || {};
  if (!notes && !noteContent) return res.status(400).json({ error: 'Sem conteúdo para gerar quiz' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key não configurada' });

  // Se tem noteContent (nota original do Obsidian), usa ela como fonte primária
  const hasOriginalNote = noteContent && noteContent.trim().length > 50;
  const contentToUse = hasOriginalNote
    ? `NOTA ORIGINAL DO AUTOR:\n${noteContent.slice(0,4000)}\n\nRESUMO ADICIONAL:\n${(notes||'').slice(0,1000)}`
    : (notes||'').slice(0, 5000);

  const sourceInstruction = hasOriginalNote
    ? `IMPORTANTE: As perguntas devem ser baseadas EXCLUSIVAMENTE no conteúdo da nota original do autor acima. Teste se ele realmente internalizou o que anotou — não gere perguntas sobre conhecimento geral do tema.`
    : `As perguntas devem cobrir os conceitos principais do conteúdo fornecido.`;

  try {
    const prompt = `Você é um professor universitário especialista em avaliação cognitiva. Crie exatamente 10 perguntas de múltipla escolha em português brasileiro sobre o conteúdo abaixo.

${sourceInstruction}

NÍVEL DE DIFICULDADE: Intermediário-avançado. As perguntas devem:
- Exigir compreensão e raciocínio, não simples memorização
- Usar cenários hipotéticos ou situações de aplicação prática
- Incluir distratores altamente plausíveis (erros comuns, conceitos similares mas incorretos)
- Misturar tipos: análise, síntese, aplicação, causa/efeito, diferenciação entre conceitos
- Evitar perguntas óbvias — prefira "Qual das afirmações está INCORRETA?" ou "Dado o contexto X, qual é o mecanismo mais provável?"

REGRAS DE FORMATO:
1. Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois
2. Formato exato: [{"q":"pergunta?","opts":["opção sem letra","opção sem letra","opção sem letra","opção sem letra"],"ans":0,"exp":"Justificativa completa: explique por que a resposta correta está certa E por que as outras estão erradas."}]
3. "ans" é o índice (0-3) da resposta correta em opts
4. NÃO inclua "A)", "B)", "C)", "D)" ou "a.", "b." nas opções — só o texto puro
5. A resposta correta deve aparecer em posições variadas (0, 1, 2 ou 3)
6. "exp" deve ter 2-4 frases explicando o raciocínio completo
7. Exatamente 4 opções por pergunta, exatamente 10 perguntas

CONTEÚDO:
Título: ${title || 'Tópico de estudo'}
${contentToUse}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5000,
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

    const questions = shuffleAnswers(raw);
    return res.status(200).json({ questions, fromOriginalNote: hasOriginalNote });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
