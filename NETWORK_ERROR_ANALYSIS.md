# Network Error Detaylı Analiz

## 🔴 Hata: `ERR_NETWORK`

### Hata Detayları
```
Error Code: ERR_NETWORK
Error Response: undefined
baseURL: http://188.245.150.117
URL: /auth/register
```

## 🔍 Sorun Analizi

### 1. **502 Bad Gateway Hatası (Ana Sorun)**

Curl testi sonucu:
```bash
< HTTP/1.1 502 Bad Gateway
< Server: nginx/1.29.3
```

**Anlamı:**
- ✅ Network bağlantısı VAR (sunucuya ulaşıyor)
- ✅ Nginx çalışıyor
- ❌ Backend servisi çalışmıyor veya nginx yönlendirme yapamıyor
- ❌ iOS'ta 502 hatası "Network Error" olarak görünüyor

**Neden iOS'ta "Network Error" görünüyor?**
- iOS, 502 gibi HTTP hatalarını bazen "Network Error" olarak gösterir
- Axios, response alamadığında `ERR_NETWORK` hatası verir
- `error.response` undefined olduğu için gerçek hata görünmüyor

### 2. **Olası Nedenler**

#### A. Backend Servisi Çalışmıyor
- Backend API servisi down olabilir
- Port yanlış yapılandırılmış olabilir
- Backend servisi başlatılmamış olabilir

#### B. Nginx Yapılandırma Sorunu
- Nginx backend servisine yönlendirme yapamıyor
- Upstream servisi tanımlı değil
- Port yanlış yapılandırılmış

#### C. iOS Simulator Network Sorunu
- Simulator network ayarları sorunlu olabilir
- Firewall engellemesi olabilir
- DNS çözümleme sorunu olabilir

### 3. **Axios Adapter Sorunu (İkincil)**

React Native'de Axios bazen adapter sorunu yaşayabilir:
- XMLHttpRequest adapter'ı React Native'de çalışmayabilir
- Fetch adapter kullanılmalı

## ✅ Çözüm Adımları

### 1. Backend Servisini Kontrol Edin

```bash
# Backend servisinin çalışıp çalışmadığını kontrol edin
# Sunucuda:
systemctl status your-backend-service
# veya
docker ps  # Eğer Docker kullanıyorsanız
```

### 2. Nginx Yapılandırmasını Kontrol Edin

```nginx
# /etc/nginx/sites-available/your-site
upstream backend {
    server localhost:3000;  # Backend port'unuz
}

server {
    listen 80;
    server_name 188.245.150.117;
    
    location /auth {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Port Kontrolü

Backend servisi farklı bir port'ta çalışıyorsa:
```typescript
// src/config/api.config.ts
BASE_URL: 'http://188.245.150.117:PORT'  // Port numarasını ekleyin
```

### 4. Error Handling İyileştirmesi

Axios error handling'i geliştirildi, artık daha detaylı hata göreceksiniz.

### 5. Test Komutları

```bash
# Sunucuya direkt bağlantı testi
curl -v http://188.245.150.117/auth/register

# Backend servisine direkt bağlantı (eğer port biliyorsanız)
curl -v http://188.245.150.117:3000/auth/register

# Nginx loglarını kontrol
tail -f /var/log/nginx/error.log
```

## 🎯 Öncelikli Kontroller

1. **Backend servisi çalışıyor mu?**
   - Sunucuda backend servisini kontrol edin
   - Logları kontrol edin

2. **Nginx yapılandırması doğru mu?**
   - Upstream tanımlı mı?
   - Proxy pass doğru mu?

3. **Port doğru mu?**
   - Backend hangi port'ta çalışıyor?
   - Nginx doğru port'a yönlendiriyor mu?

## 📝 Notlar

- iOS'ta 502 hatası bazen "Network Error" olarak görünür
- Axios error handling geliştirildi
- Backend servisi çalıştığında sorun çözülecek

