export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, pillar, raw } = req.body;

  if (!title || !raw) {
    return res.status(400).json({ error: 'Title and raw capture are required' });
  }

  const NOTION_TOKEN = process.env.NOTION_TOKEN;
  const NOTION_DB_ID = process.env.NOTION_DB_ID || '4c78ff14-6c61-4aac-860b-7c5b981ee91a';

  if (!NOTION_TOKEN) {
    return res.status(500).json({ error: 'Notion token not configured' });
  }

  const properties = {
    "Name": { "title": [{ "text": { "content": title } }] },
    "Raw capture": { "rich_text": [{ "text": { "content": raw } }] },
    "Status": { "select": { "name": "Raw idea" } }
  };

  if (pillar) {
    properties["Pillar"] = { "select": { "name": pillar } };
  }

  const notionRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DB_ID },
      properties
    })
  });

  if (!notionRes.ok) {
    const err = await notionRes.json();
    return res.status(500).json({ error: err.message || 'Notion API error' });
  }

  return res.status(200).json({ success: true });
}
