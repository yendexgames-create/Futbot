# 🚀 Noutbukda 24/7 Bot Ishga Tushirish

## Eng Oson Usul: PM2 (Tavsiya etiladi)

### 1️⃣ PM2 o'rnatish

PowerShell ni **Administrator** sifatida oching va quyidagilarni bajaring:

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

### 2️⃣ Botni ishga tushirish

```powershell
cd "C:\Users\Acer\Desktop\fut bto"
npm run pm2:start
```

### 3️⃣ Windows startup ga qo'shish (noutbuk ochilganda avtomatik ishga tushishi uchun)

```powershell
pm2 startup
pm2 save
```

**Eslatma:** `pm2 startup` buyrug'i bajarilgandan keyin ko'rsatilgan buyruqni **Administrator PowerShell** da bajarishingiz kerak.

### 4️⃣ Noutbuk sozlamalari (MUHIM!)

**Power Settings:**
1. `Win + X` → **Power Options**
2. **"Choose what closing the lid does"** → **"Do nothing"** (noutbuk yopilganda ham ishlaydi)
3. **"When plugged in, PC goes to sleep"** → **Never**
4. **"When plugged in, turn off the display"** → **Never** (yoki istalgan vaqt)

**Internet:**
- Doimiy internet kerak (Wi-Fi yoki Ethernet)
- Noutbuk uyqu rejimiga o'tmasligi kerak

### 5️⃣ PM2 Buyruqlari

```powershell
# Bot holatini ko'rish
npm run pm2:status

# Bot loglarini ko'rish
npm run pm2:logs

# Botni qayta ishga tushirish
npm run pm2:restart

# Botni to'xtatish
pm2 stop telegram-stadium-bot

# Botni o'chirish
pm2 delete telegram-stadium-bot
```

---

## ⚠️ Muhim Eslatmalar

1. **Internet:** Doimiy internet kerak
2. **Quvvat:** Noutbuk doimiy quvvatda bo'lishi kerak (batareya tugamasligi kerak)
3. **Uyqu rejimi:** Noutbuk uyqu rejimiga o'tmasligi kerak
4. **Windows Update:** Avtomatik restart qilmasligi kerak

---

## 🌐 Cloud Hosting (Tavsiya etiladi)

Agar noutbukdan mustaqil ishlashni xohlasangiz, quyidagi variantlardan birini tanlang:

### Render.com (Bepul - 750 soat/oy)
1. [Render.com](https://render.com) ga kiring
2. GitHub ga kodni yuklang
3. "New Web Service" → Repository ni tanlang
4. Environment variables qo'shing
5. Deploy!

**Batafsil:** `QUICK_DEPLOY.md` yoki `DEPLOYMENT.md` faylini ko'ring.

---

## ✅ Tekshirish

Bot ishlayotganini tekshirish:

```powershell
npm run pm2:status
```

Yoki Telegram da botga `/start` yuboring.

---

## 🔧 Muammolar bo'lsa

1. **Bot ishlamayapti:**
   ```powershell
   npm run pm2:logs
   ```
   Loglarni ko'rib xatolarni toping.

2. **PM2 ishlamayapti:**
   ```powershell
   npm install -g pm2 --force
   ```

3. **Windows startup ishlamayapti:**
   ```powershell
   pm2-startup install
   ```

---

**Tavsiya:** Cloud hosting (Render, Railway) ishlatish - bu noutbukdan mustaqil ishlaydi va 24/7 ishonchli.

