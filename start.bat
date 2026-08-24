@echo off
title instagram-auto-reply-system
chcp 65001 > nul
echo ========================================================
echo 🚀 جاري تشغيل نظام الرد الآلي على تعليقات ورسائل انستغرام...
echo ========================================================

IF NOT EXIST "node_modules" (
    echo 📦 جاري تثبيت الاعتماديات التلقائية...
    call npm install
)

echo 🌐 فتح لوحة التحكم في المتصفح...
start http://localhost:3000

node server.js
pause
