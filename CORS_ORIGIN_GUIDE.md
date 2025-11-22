# CORS Origin Rehberi - React Native

## 🔍 React Native'de Origin Header

### React Native'de Origin Nasıl Gönderilir?

React Native uygulamalarında:
- **Origin header'ı genellikle gönderilmez** veya **`null`** olur
- Web tarayıcılarında `window.location.origin` kullanılır (örn: `https://example.com`)
- React Native'de `window` objesi yoktur
- Axios/React Native fetch otomatik olarak Origin header'ı eklemez

### Test Sonucu

```javascript
// React Native'de
typeof window !== 'undefined' ? window.location?.origin : 'null (React Native)'
// Sonuç: "null (React Native)"
```

## 🎯 Backend'de CORS_ORIGIN Değeri

### Seçenek 1: Tüm Origin'lere İzin Ver (Önerilen - Development)

```javascript
// Backend (Express.js örneği)
const cors = require('cors');

app.use(cors({
  origin: '*',  // Tüm origin'lere izin ver
  credentials: false,  // * ile credentials kullanılamaz
}));
```

**Avantajlar:**
- ✅ Kolay kurulum
- ✅ Development için uygun
- ✅ React Native uygulamaları için çalışır

**Dezavantajlar:**
- ❌ Production'da güvenlik riski
- ❌ Credentials ile kullanılamaz

### Seçenek 2: Null Origin'e İzin Ver (React Native için)

```javascript
// Backend (Express.js örneği)
const cors = require('cors');

app.use(cors({
  origin: (origin, callback) => {
    // React Native'den gelen istekler origin olmadan gelir
    // null origin'e izin ver
    if (!origin || origin === 'null') {
      callback(null, true);
    } else {
      // Web'den gelen istekler için spesifik origin kontrolü
      const allowedOrigins = [
        'https://your-web-app.com',
        'http://localhost:3000',
      ];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
}));
```

**Avantajlar:**
- ✅ React Native uygulamaları için çalışır
- ✅ Web uygulamaları için de kontrol yapılabilir
- ✅ Credentials kullanılabilir

### Seçenek 3: Origin Kontrolü Yapma (Mobil Uygulamalar için)

```javascript
// Backend (Express.js örneği)
const cors = require('cors');

app.use(cors({
  origin: (origin, callback) => {
    // Mobil uygulamalar için origin kontrolü yapma
    // Sadece web uygulamaları için kontrol yap
    if (!origin) {
      // Origin yok = Mobil uygulama (React Native)
      callback(null, true);
    } else {
      // Origin var = Web uygulaması
      const allowedOrigins = [
        'https://your-web-app.com',
        'http://localhost:3000',
      ];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
}));
```

## 📝 Backend Örnekleri

### Express.js ile CORS

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// React Native için CORS ayarı
app.use(cors({
  origin: (origin, callback) => {
    // Origin yoksa (React Native) veya null ise izin ver
    if (!origin || origin === 'null') {
      callback(null, true);
    } else {
      // Web uygulamaları için kontrol
      const allowedOrigins = [
        'https://your-web-app.com',
        'http://localhost:3000',
      ];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### NestJS ile CORS

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin === 'null') {
        callback(null, true); // React Native
      } else {
        const allowedOrigins = [
          'https://your-web-app.com',
          'http://localhost:3000',
        ];
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(3000);
}
bootstrap();
```

### FastAPI ile CORS (Python)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Development için
    # veya
    # allow_origin_regex=r".*",  # Tüm origin'lere izin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🎯 Önerilen CORS_ORIGIN Değeri

### Development Ortamı için:
```javascript
CORS_ORIGIN = "*"
```

### Production Ortamı için:
```javascript
CORS_ORIGIN = (origin, callback) => {
  if (!origin || origin === 'null') {
    // React Native uygulaması
    callback(null, true);
  } else {
    // Web uygulaması - spesifik origin kontrolü
    const allowedOrigins = ['https://your-web-app.com'];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}
```

## ⚠️ Önemli Notlar

1. **React Native'de Origin Header Yok:**
   - React Native uygulamalarından gelen isteklerde Origin header'ı genellikle yoktur
   - Backend'de `origin === undefined` veya `origin === null` kontrolü yapılmalı

2. **Credentials ile Kullanım:**
   - `origin: "*"` ile `credentials: true` kullanılamaz
   - React Native için `origin: null` veya fonksiyon kullanılmalı

3. **Güvenlik:**
   - Production'da `origin: "*"` kullanmayın
   - Spesifik origin kontrolü yapın
   - React Native için `null` origin'e izin verin

## 🔍 Test Etme

Backend'de hangi origin'in geldiğini görmek için:

```javascript
app.use((req, res, next) => {
  console.log('Origin:', req.headers.origin);
  console.log('All Headers:', req.headers);
  next();
});
```

React Native'den istek atıldığında:
- `req.headers.origin` → `undefined` veya `null` olacak

