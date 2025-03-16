@echo off
echo ===== Exécution des tests du frontend =====
cd frontend
call npm test

echo.
echo ===== Exécution des tests du backend =====
cd ../backend
call npm test

echo.
echo ===== Tests terminés =====
cd .. 