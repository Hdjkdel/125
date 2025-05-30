const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Sahte veritabanı
let keys = [
  {
    key: "abc123",
    createdAt: Date.now(),
    expiresIn: 1000 * 60 * 60, // 1 saat
    maxUsage: 3,
    usageCount: 0,
    deviceId: null
  }
];

// Key kontrol
app.post("/check-key", (req, res) => {
  const { key, deviceId } = req.body;
  const keyData = keys.find(k => k.key === key);
  if (!keyData) return res.json({ valid: false, reason: "Key bulunamadı." });

  const now = Date.now();
  if (now > keyData.createdAt + keyData.expiresIn) {
    return res.json({ valid: false, reason: "Key süresi dolmuş." });
  }

  if (keyData.usageCount >= keyData.maxUsage) {
    return res.json({ valid: false, reason: "Kullanım limiti dolmuş." });
  }

  if (keyData.deviceId && keyData.deviceId !== deviceId) {
    return res.json({ valid: false, reason: "Başka cihazda kullanılamaz." });
  }

  // geçerli
  keyData.deviceId = deviceId;
  keyData.usageCount++;
  return res.json({ valid: true, reason: "Key geçerli." });
});

// Yeni key ekleme (adminKey sabit)
app.post("/add-key", (req, res) => {
  const { newKey, expiresIn, maxUsage, adminKey } = req.body;
  if (adminKey !== "admin123") return res.status(403).json({ error: "Yetkisiz." });

  if (keys.some(k => k.key === newKey)) {
    return res.json({ success: false, reason: "Zaten var." });
  }

  keys.push({
    key: newKey,
    createdAt: Date.now(),
    expiresIn: expiresIn || 3600000,
    maxUsage: maxUsage || 1,
    usageCount: 0,
    deviceId: null
  });

  return res.json({ success: true, added: newKey });
});

app.listen(PORT, () => {
  console.log(`Key server çalışıyor. Port: ${PORT}`);
});
