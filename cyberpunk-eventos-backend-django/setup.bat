@echo off
echo ========================================
echo  Configurando Backend Django
echo ========================================
echo.

echo [1/4] Instalando dependencias...
pip install -r requirements.txt
if errorlevel 1 (
    echo Erro ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo [2/4] Criando migracoes...
python manage.py makemigrations
if errorlevel 1 (
    echo Erro ao criar migracoes!
    pause
    exit /b 1
)

echo.
echo [3/4] Aplicando migracoes...
python manage.py migrate
if errorlevel 1 (
    echo Erro ao aplicar migracoes!
    pause
    exit /b 1
)

echo.
echo [4/4] Configuracao concluida!
echo.
echo ========================================
echo  Backend configurado com sucesso!
echo ========================================
echo.
echo Para iniciar o servidor, execute:
echo   python manage.py runserver
echo.
echo Acesse: http://localhost:8000
echo.
pause
