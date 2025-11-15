# Tezkor 24/7 Deployment

## Eng Oson Usul: Render.com (Bepul)

### 1. GitHub ga kod yuklash

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Render.com da yaratish

1. [Render.com](https://render.com) ga kiring
2. "New" → "Web Service"
3. GitHub reponi tanlang
4. Sozlamalar:
   - **Name:** `stadium-bot`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. **Environment Variables** qo'shing:
   ```
   BOT_TOKEN=your_bot_token
   ADMIN_BOT_TOKEN=your_admin_bot_token
   ADMIN_CHAT_ID=your_admin_chat_id
   CHANNEL_ID=your_channel_id
   MONGODB_URI=your_mongodb_uri
   PAYMENT_CARD=your_card_number
   ADMIN_USERNAME=Cyberphantom001
   ADMIN_PHONE=+998970986226
   TZ=Asia/Tashkent
   ```

6. "Create Web Service" ni bosing

✅ **Tayyor!** Bot 24/7 ishlaydi va noutbukdan mustaqil.

## Windows Noutbukda PM2

### 1. PM2 o'rnatish

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

### 2. Botni ishga tushirish

```powershell
cd "C:\Users\Acer\Desktop\fut bto"
npm run pm2:start
```

### 3. Windows startup ga qo'shish

```powershell
pm2 startup
pm2 save
```

### 4. Noutbuk sozlamalari

- Power Settings: Uyqu rejimini o'chirish
- Lid close: "Do nothing" qilish
- Internet: Doimiy internet kerak

**Batafsil:** `WINDOWS_24_7_SETUP.md` faylini ko'ring.

