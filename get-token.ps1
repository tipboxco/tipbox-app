# Token Alma Script'i
# Bu script uygulama log'larından veya SecureStore'dan token'ı almaya çalışır

Write-Host "Token araniyor..." -ForegroundColor Cyan
Write-Host ""

# Metro bundler log dosyasını kontrol et
$metroLogPath = "$env:USERPROFILE\.metro\logs\*.log"
$logFiles = Get-ChildItem -Path $metroLogPath -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 5

if ($logFiles) {
    Write-Host "Metro bundler log dosyalari bulundu, token araniyor..." -ForegroundColor Yellow
    foreach ($logFile in $logFiles) {
        $content = Get-Content $logFile.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match 'Bearer\s+([A-Za-z0-9\-_\.]+)') {
            $token = $matches[1]
            Write-Host "✅ Token bulundu!" -ForegroundColor Green
            Write-Host "Token: $token" -ForegroundColor Green
            Write-Host ""
            return $token
        }
    }
}

# Eğer log'lardan bulunamazsa, kullanıcıdan token iste
Write-Host "⚠️  Token log'lardan bulunamadi." -ForegroundColor Yellow
Write-Host ""
Write-Host "Token'i manuel olarak girebilirsiniz:" -ForegroundColor Cyan
Write-Host "  1. Uygulamada giris yapin" -ForegroundColor White
Write-Host "  2. React Native Debugger veya Metro bundler'da token'i arayin" -ForegroundColor White
Write-Host "  3. Veya uygulama icinde console.log ile token'i yazdirin" -ForegroundColor White
Write-Host ""
$manualToken = Read-Host "Token'i buraya yapistirin (Enter'a basin, bos birakmak icin)"

if ($manualToken) {
    return $manualToken
} else {
    Write-Host "❌ Token bulunamadi!" -ForegroundColor Red
    return $null
}

