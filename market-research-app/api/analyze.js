module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }
    try {
        const { productName } = req.body;
        if (!productName) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อสินค้า' });
        }
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const GEMINI_MODEL = "gemini-3.1-flash-lite";
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ success: false, error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel' });
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
        const promptText = `
วิเคราะห์ตลาดสำหรับสินค้า: "${productName}"
โปรดวิเคราะห์โดยใช้หลักการ Market Research Framework™ และส่งผลลัพธ์กลับมาเป็น JSON Object โครงสร้างดังนี้เท่านั้น (ไม่ต้องใส่ Markdown Fences เช่น \`\`\`json):
{
  "currentPhase": "ระบุชื่อช่วง เช่น 2. Growth Opportunity™",
  "nextPhase": "ระบุชื่อช่วงถัดไป",
  "opportunity": "วิเคราะห์โอกาสทางธุรกิจสั้นๆ 2-3 บรรทัด",
  "risk": "วิเคราะห์ความเสี่ยงสั้นๆ 2-3 บรรทัด",
  "strategy": "เสนอแนะกลยุทธ์สั้นๆ 2-3 บรรทัด",
  "framework": {
    "opportunity": ["ประเด็นที่ 1", "ประเด็นที่ 2", "ประเด็นที่ 3"],
    "learning": ["ประเด็นที่ 1", "ประเด็นที่ 2", "ประเด็นที่ 3"],
    "trading": ["ประเด็นที่ 1", "ประเด็นที่ 2", "ประเด็นที่ 3"],
    "insight": ["ประเด็นที่ 1", "ประเด็นที่ 2", "ประเด็นที่ 3"],
    "rare": ["ประเด็นที่ 1", "ประเด็นที่ 2", "ประเด็นที่ 3"],
    "networking": ["ประเด็นที่ 1", "ประเด็นที่ 2", "ประเด็นที่ 3"],
    "platform": ["ประเด็นที่ 1", "ประเด็นที่ 2", "ประเด็นที่ 3"]
  },
  "moneyFlow": ["เงินมาจากไหน...", "เงินไหลไปหาใคร...", "ใครสร้างกำไรสูงสุด..."]
}
        `;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google API Error Status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanJsonText = rawText.replace(/```json|```/g, '').trim();
        return res.status(200).json({ success: true, data: JSON.parse(cleanJsonText) });
    } catch (error) {
        console.error('Serverless Function Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
