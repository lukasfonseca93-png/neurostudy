export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { topics, areas, folders } = req.body || {};
  if (!topics?.length) return res.status(400).json({ error: 'Sem tópicos' });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key não configurada' });

  // Process in batches of 30
  const BATCH = 30;
  const results = {};
  for (let i = 0; i < topics.length; i += BATCH) {
    const batch = topics.slice(i, i + BATCH);
    const prompt = `Classifique cada tópico abaixo na área e pasta mais adequada.

ÁREAS E PASTAS DISPONÍVEIS:
${areas.map(a => `- ${a.id} (${a.label}):\n${(folders[a.id]||[]).map(f=>`  * ${f.id}: ${f.name}`).join('\n')}`).join('\n')}

TÓPICOS PARA CLASSIFICAR:
${batch.map(t => `ID:${t.id} | "${t.title}" | notas: ${(t.notes||'').slice(0,120)}`).join('\n')}

Responda APENAS com JSON: {"ID_DO_TOPICO": {"area": "area_id", "folder_id": "folder_id"}, ...}
Use os IDs exatos das áreas e pastas. Se não souber, use a área mais próxima.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2048, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { Object.assign(results, JSON.parse(match[0])); } catch {}
    }
  }
  return res.status(200).json({ assignments: results });
}
