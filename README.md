# 🌌 Positive & Negative
> **Positive & Negative** is a high-fidelity, sci-fi themed mathematical logic puzzle game built using **Next.js**, **React**, **Sass**, **Three.js**, and the **Web Audio API**.

---

## 🌍 Language Options / Dil Seçenekleri
- [🇹🇷 Türkçe Tanıtım ve Kılavuz](#-türkçe-tanıtım-ve-kılavuz)
- [🇺🇸 English Description and Guide](#-english-description-and-guide)

---

## 🇹🇷 Türkçe Tanıtım ve Kılavuz

**Positive & Negative**, oyuncuların gizemli bir ızgara (grid) üzerindeki hücreleri tarayarak ve açarak hedef pozitif veya negatif anomali değerlerine ulaşmaya çalıştığı, risk yönetimi, olasılık ve mantıksal çıkarımlara dayalı fütüristik bir bulmaca oyunudur.

### 🚀 Temel Özellikler
- **Çevre Radarı (Proximity Radar):** Fare imleci kapalı bir hücrenin üzerine getirildiğinde, 3x3'lük çevredeki komşu hücrelerin toplam anomali değerini ve pozitif/negatif/nötr dağılımını gösterir.
- **Dinamik 3D Parçacık Arka Planı (Three.js):** Fare hareketleriyle etkileşime giren (parallax), sine dalgası formunda dalgalanan neon parçacık akışı.
  - **Warp Hızı Efekti:** Kazanma (`victory`) durumunda parçacıklar yeşil renge bürünüp warp hızına geçer; kaybetme (`defeat`) durumunda ise kırmızı renkte anlık patlama yaşar.
- **Sentezlenmiş Ses Motoru (Web Audio API):** Harici ses dosyalarına ihtiyaç duymadan, tıklama, geri alma (undo), pozitif/negatif hücre keşfi, zafer ve yenilgi durumlarında dinamik sentezlenen retro-fütüristik neon ses tonları üretir.
- **Skor ve İstatistik Takibi (LocalStorage):** Galibiyet serisi, en yüksek seri, toplam kazanılan puan ve yenilgi istatistikleri yerel hafızada güvenle saklanır.

---

### 🕹️ Nasıl Oynanır?

1. **Görev Hazırlığı (Deployment Setup):**
   - **Sektör Boyutu (Sector Dimensions):** Grid büyüklüğünü seçin: `12x12` (Küçük), `16x16` (Standart) veya `20x20` (Büyük).
   - **Anomali Derecesi (Anomaly Severity):** Hücrelerin alabileceği değer aralığını belirler: `Kolay` [-3, +3], `Orta` [-4, +4] veya `Zor` [-5, +5].
   - **Çevre Sensörü (Proximity Sensor):** Radarı etkinleştirir veya devre dışı bırakır. Radarı kapatmak ödül çarpanını **2.0 katına** çıkarır!
2. **Hedefler (Targets):**
   - Görev başladığında sistem size rastgele belirlenmiş 3 farklı hedef sunar: **Kolay (Easy)**, **Orta (Medium)** ve **Zor (Hard)**.
   - Hedef değerler pozitif veya negatif olabilir.
3. **Komşu Analizi ve Keşif:**
   - Fareyi hücrelerin üzerinde gezdirerek radardan gelen verileri (toplam komşu değeri, pozitif/negatif hücre sayıları) inceleyin.
   - Mantıklı çıkarımlar yaparak yüksek değerli hücreleri güvenle açın.
4. **Hücre Kapatma ve Undo Limiti:**
   - Açtığınız bir hücreyi tekrar kapatarak (undo) eski haline getirebilirsiniz. Ancak her zorluk seviyesine göre sınırlı sayıda **Kapatma (Closes)** hakkınız bulunur.
   - Kapatma hakkınız 0'a ulaştığında tur otomatik olarak sona erer.
5. **Geri Çekilme (Retreat):**
   - En azından "Easy" hedef seviyesine ulaştığınızda, elinizdeki puanları korumak ve galibiyet serinizi sürdürmek için **Retreat** (Geri Çekil) butonuna basarak turu zaferle tamamlayabilirsiniz.
   - Eğer Kapatma haklarınız bitmeden hiçbir hedefe ulaşamazsanız turu kaybedersiniz ve galibiyet seriniz sıfırlanır.

---

### 📊 Çarpan ve Puanlama Tablosu

Kazanılan puanlar, ulaştığınız hedef derecesine (Easy: 1, Medium: 2, Hard: 3) göre hesaplanır ve aşağıdaki çarpanlarla çarpılır:

| Sektör Boyutu | Çarpan | Anomali Derecesi | Çarpan | Radar Durumu | Çarpan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **12x12 (Small)** | `0.8x` | **Easy** | `1.0x` | **Aktif (Enabled)** | `1.0x` |
| **16x16 (Standard)**| `1.0x` | **Medium** | `1.5x` | **Pasif (Disabled)** | `2.0x` |
| **20x20 (Large)** | `1.3x` | **Hard** | `2.0x` | | |

> **Örnek Hesaplama:** Standard 16x16 grid (`1.0x`), Orta zorluk derecesinde (`1.5x`) ve Radar kapalıyken (`2.0x`) oynadığınızda toplam çarpanınız `1.0 * 1.5 * 2.0 = 3.0x` olur. Bu ayarlarda Hard hedefine ulaşıp geri çekilirseniz `3 * 3.0x = 9` puan kazanırsınız!

---

## 🇺🇸 English Description and Guide

**Positive & Negative** is a futuristic mathematical logic puzzle game where players scan and reveal nodes on a digital grid to reach target positive or negative values, utilizing risk management, probability, and logical deduction.

### 🚀 Key Features
- **Proximity Radar:** Hovering over any hidden node reveals the sum of its 3x3 surrounding neighbors and the exact positive/negative/neutral count composition.
- **Dynamic 3D Particle Background (Three.js):** A fluid, sine-wave oscillating neon particle background reacting to mouse movement (parallax).
  - **Warp Speed Effect:** On `victory`, particles turn green and accelerate into warp speed. On `defeat`, they flash red and disperse erratically.
- **Synthesized Audio Engine (Web Audio API):** Generates retro-cyber sound effects for clicking, undoing, positive/negative node discoveries, victories, and defeats without loading external audio assets.
- **Local Stats Persistence (LocalStorage):** Saves win streaks, high scores, total score, and losses directly in the browser.

---

### 🕹️ How to Play

1. **Deployment Setup:**
   - **Sector Dimensions:** Choose your grid size: `12x12` (Small), `16x16` (Standard), or `20x20` (Large).
   - **Anomaly Severity (Difficulty):** Controls the cell value ranges: `Easy` [-3, +3], `Medium` [-4, +4], or `Hard` [-5, +5].
   - **Proximity Sensor:** Enable or disable the radar. Disabling the radar grants a massive **2.0x** multiplier!
2. **Targets:**
   - At launch, three target tiers are generated: **Easy**, **Medium**, and **Hard**.
   - Target directions can be positive or negative.
3. **Scanning & Revealing:**
   - Hover over hidden nodes to analyze coordinates and neighbor metrics.
   - Click a node to reveal its value.
4. **Undos (Closes Limit):**
   - Click a revealed node again to close (undo) it. Each difficulty grants a limited number of **Closes**.
   - When Closes reach 0, the round automatically ends.
5. **Retreating:**
   - Once you reach at least the "Easy" target, you can click **Retreat** to claim your score multiplied by your setup multiplier and secure your win streak.
   - If you run out of closes without hitting at least the Easy target, you lose and your streak resets.

---

### 📊 Multiplier & Scoring Matrix

Score points are based on the highest target tier reached (Easy: 1, Medium: 2, Hard: 3) multiplied by the configuration settings:

| Sector Dimension | Multiplier | Anomaly Severity | Multiplier | Radar Mode | Multiplier |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **12x12 (Small)** | `0.8x` | **Easy** | `1.0x` | **Enabled** | `1.0x` |
| **16x16 (Standard)**| `1.0x` | **Medium** | `1.5x` | **Disabled** | `2.0x` |
| **20x20 (Large)** | `1.3x` | **Hard** | `2.0x` | | |

> **Example Calculation:** Playing on a Standard 16x16 grid (`1.0x`), Medium difficulty (`1.5x`), with Radar disabled (`2.0x`) yields a total multiplier of `1.0 * 1.5 * 2.0 = 3.0x`. Reaching the Hard target and retreating grants `3 * 3.0x = 9` points!

---

## 🛠️ Technological Stack / Kullanılan Teknolojiler
- **Core:** React, Next.js, TypeScript
- **Styling:** Sass (CSS Modules)
- **Background Physics & Rendering:** Three.js (WebGL)
- **Audio Rendering:** HTML5 Web Audio API (Synthesizers)
- **Persistence:** LocalStorage API

---

## 💻 Getting Started / Kurulum ve Çalıştırma

First, install dependencies:
```bash
npm install
# or
yarn install
```

Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Build for production:
```bash
npm run build
# or
yarn build
```

Run linter checks:
```bash
npm run lint
# or
yarn lint
```