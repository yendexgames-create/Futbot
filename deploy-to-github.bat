@echo off
echo ====================================
echo GitHub ga Kod Yuklash
echo ====================================
echo.

cd /d "%~dp0"

echo [1/6] Git init...
git init

echo.
echo [2/6] Barcha fayllarni qo'shish...
git add .

echo.
echo [3/6] Commit qilish...
git commit -m "Stadium booking bot - complete project"

echo.
echo [4/6] Branch nomini main qilish...
git branch -M main

echo.
echo [5/6] Remote qo'shish...
git remote remove origin 2>nul
git remote add origin https://github.com/yendexgames-create/Futbot.git

echo.
echo [6/6] GitHub ga yuklash...
git push -u origin main

echo.
echo ====================================
echo Tayyor!
echo ====================================
echo.
echo Agar xatolik bo'lsa, Git o'rnatilganligini tekshiring:
echo https://git-scm.com/download/win
echo.
pause

