@echo off
echo ============================================
echo   MR2 Breeding Calculator - Instalando...
echo ============================================
pip install flask --quiet
echo.
echo Iniciando servidor...
echo Abra o navegador em: http://127.0.0.1:5000
echo.
start "" http://127.0.0.1:5000
python app.py
pause
