# Windows Noutbukda 24/7 Bot Ishga Tushirish

## Variant 1: PM2 (Tavsiya etiladi)

### 1. PM2 o'rnatish

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

### 2. PM2 bilan botni ishga tushirish

```powershell
cd "C:\Users\Acer\Desktop\fut bto"
pm2 start index.js --name "stadium-bot"
```

### 3. PM2 ni Windows startup ga qo'shish (noutbuk ochilganda avtomatik ishga tushishi uchun)

```powershell
pm2 startup
pm2 save
```

### 4. PM2 buyruqlari

```powershell
# Bot holatini ko'rish
pm2 status

# Bot loglarini ko'rish
pm2 logs stadium-bot

# Botni qayta ishga tushirish
pm2 restart stadium-bot

# Botni to'xtatish
pm2 stop stadium-bot

# Botni o'chirish
pm2 delete stadium-bot

# Barcha loglarni tozalash
pm2 flush
```

### 5. Noutbuk sozlamalari

**Muhim:** Noutbuk uyqu rejimiga o'tmasligi kerak:

1. **Power Settings:**
   - `Win + X` → Power Options
   - "Choose what closing the lid does" → "Do nothing" (noutbuk yopilganda ham ishlaydi)
   - "When plugged in, PC goes to sleep" → Never

2. **Windows Update:**
   - Windows Update ni avtomatik restart qilmasligi uchun sozlang

## Variant 2: Windows Task Scheduler

### 1. Task Scheduler orqali

1. `Win + R` → `taskschd.msc`
2. "Create Basic Task"
3. Name: "Stadium Bot"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `node`
7. Arguments: `C:\Users\Acer\Desktop\fut bto\index.js`
8. Start in: `C:\Users\Acer\Desktop\fut bto`

## Variant 3: NSSM (Non-Sucking Service Manager)

### 1. NSSM o'rnatish

1. [NSSM](https://nssm.cc/download) dan yuklab oling
2. Extract qiling va `nssm.exe` ni PATH ga qo'shing

### 2. Service yaratish

```powershell
nssm install StadiumBot
```

Keyin quyidagilarni kiriting:
- Path: `C:\Program Files\nodejs\node.exe`
- Startup directory: `C:\Users\Acer\Desktop\fut bto`
- Arguments: `index.js`

### 3. Service ni ishga tushirish

```powershell
nssm start StadiumBot
```

## Muhim Eslatmalar

⚠️ **Noutbukda 24/7 ishlatish:**

1. **Internet:** Doimiy internet kerak
2. **Quvvat:** Noutbuk doimiy quvvatda bo'lishi kerak (batareya tugamasligi kerak)
3. **Uyqu rejimi:** Noutbuk uyqu rejimiga o'tmasligi kerak
4. **Windows Update:** Avtomatik restart qilmasligi kerak

✅ **Tavsiya:** Cloud hosting ishlatish (Render, Railway) - bu noutbukdan mustaqil ishlaydi va 24/7 ishonchli.

## Cloud Hosting (Tavsiya etiladi)

Agar noutbukdan mustaqil ishlashni xohlasangiz, quyidagi variantlardan birini tanlang:

- **Render.com** - Bepul (750 soat/oy)
- **Railway.app** - Bepul ($5 kredit/oy)
- **Heroku** - Pullar (bepul variant yo'q)
- **VPS** (DigitalOcean, AWS, etc.) - $5-10/oy

Batafsil: `DEPLOYMENT.md` faylini ko'ring.

