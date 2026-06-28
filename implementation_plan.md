# Uygulama Planı - Harita Seçimi, Zorluk Dereceleri ve Radar Ayarı Güncellemesi

Bu güncelleme ile oyuna şık bir başlangıç ekranı (Setup Menu) ekleyeceğiz. Oyuncular oyuna başlamadan önce harita boyutunu, zorluk derecesini ve Proximity Radar'ın aktif olup olmayacağını seçebilecekler. Bu seçimler oyun içi puan çarpanlarını (Score Multipliers) doğrudan etkileyecektir.

---

## 🛠️ Yapılacak Değişiklikler

### 1. Başlangıç Ekranı (Game Setup Screen)
- **Arayüz Tasarımı**: Glassmorphic tarzda, neon ışıklı ve fütüristik bir "Görev Parametreleri" seçim ekranı tasarlanacak.
- **Seçenekler**:
  - **Harita Boyutu (Map Size)**:
    - `12x12` (Küçük Sektör - 0.8x Çarpan)
    - `16x16` (Standart Sektör - 1.0x Çarpan)
    - `20x20` (Geniş Sektör - 1.3x Çarpan)
  - **Zorluk Derecesi (Difficulty)**:
    - `Kolay` (Kutulardan -3 ile +3 arası değerler çıkar - 1.0x Çarpan)
    - `Orta` (Kutulardan -4 ile +4 arası değerler çıkar - 1.5x Çarpan)
    - `Zor` (Kutulardan -5 ile +5 arası değerler çıkar - 2.0x Çarpan)
  - **Proximity Radar (Sensör Seçimi)**:
    - `Aktif` (Sensörler çalışır, komşu toplamlarını gösterir - 1.0x Çarpan)
    - `Pasif` (Körlemesine oynanır, komşu toplamları gösterilmez - 2.0x Çarpan)
- **Dinamik Çarpan Göstergesi**: Seçenekler değiştikçe anlık olarak toplam puan çarpanı gösterilecek (örneğin: `ÇARPAN: 3.0x`).
- **Görevi Başlat Butonu**: Canlı ve parlayan bir `LAUNCH MISSION` butonu ile oyun başlatılacak.

### 2. Oyun İçi Değişiklikler ve Puan Dengesi (Scoring & Balance)
- **Puanlama Mantığı**:
  - Alınan baz puanlar (Kolay Hedef = 1, Orta = 2, Zor = 3) seçilen seçeneklerin çarpanları ile çarpılıp en yakın tam sayıya yuvarlanacak:
    `Kazanılan Puan = Math.round(Baz Puan * HaritaÇarpanı * ZorlukÇarpanı * SensörÇarpanı)`
  - Örneğin; **20x20 Harita (1.3x)**, **Zor Seviye (2.0x)** ve **Sensör Kapalı (2.0x)** oynayan bir oyuncu:
    - Toplam Çarpan: `1.3 * 2.0 * 2.0 = 5.2x` olur.
    - Kolay Hedef: `1 * 5.2 = 5 puan` kazandırır.
    - Orta Hedef: `2 * 5.2 = 10 puan` kazandırır.
    - Zor Hedef: `3 * 5.2 = 16 puan` kazandırır.
- **Aktif Parametreler Paneli**: HUD üzerinde o anki oyun ayarları (`16x16 • Zor • Radar Kapalı`) ve aktif çarpan gösterilecek.
- **Menüye Dönüş (Quit Round)**: Oyundan istendiğinde çıkıp ana menüye dönebilmek için "GÖREVİ İPTAL ET" (Abort Mission) butonu eklenecek.
- **Radar Kontrolü**: Sensör kapalı seçildiyse:
  - Fareyle üzerine gelindiğinde kutular parlamayacak.
  - Açılan kutularda komşu toplamı ipuçları gösterilmeyecek.
  - Dashboard'daki sensör paneli `SENSÖR ÇEVRİM DIŞI (Zorlu Mod Çarpanı Aktif)` uyarısı gösterecek.

---

## 📂 Güncellenecek Dosyalar

### 1. [score-game.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/components/games/score-game.tsx)
- Başlangıç ekranını yönetmek için `gameStarted` state'i eklenecek.
- `gridSize` (12, 16, 20), `difficulty` ("easy", "medium", "hard") ve `radarEnabled` (boolean) state'leri eklenecek.
- Tahta boyutuna göre dinamik grid sütun ve satır sayısını React inline styles kullanarak `.gameGrid` elemanına uygulayacak yapı kurulacak.
- Çarpan hesaplama mantığı (`getMultiplier` ve `recordWin` içi) güncellenecek.
- Oyun içi HUD'a aktif ayar göstergesi ve "Menüye Dön" butonu yerleştirilecek.
- Radar kapalı olduğunda sensör okumalarını ve kutu içi ipuçlarını maskeleyecek mantık eklenecek.

### 2. [score-game-style.module.sass](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/components/games/score-game-style.module.sass)
- Başlangıç ekranı (Setup Screen) için gerekli olan `.setupContainer`, `.setupCard`, `.optionGroup`, `.optionTitle`, `.optionCard`, `.activeOption`, `.multiplierBadge` ve `.launchButton` stilleri eklenecek.
- Oyun içi "Görevi İptal Et" butonu stili eklenecek.

### 3. [pages/index.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/pages/index.tsx)
- Modal içindeki kurallara çarpanlar ve zorluk seviyeleri hakkında yeni bir kural maddesi eklenecek.

---

## 🚀 Doğrulama Planı

- **Kurulum Ekranı**: Başlangıç ekranında seçenekler değiştirildiğinde çarpanın anlık ve doğru şekilde güncellendiği doğrulanacak.
- **Radar Kapama**: Radar kapatılıp oyuna girildiğinde kutuların üzerinde ipucu çıkmadığı, üzerine gelindiğinde parlamadığı ve dashboard sensörünün çevrimdışı yazdığı doğrulanacak.
- **Dinamik Grid**: 12x12 veya 20x20 seçildiğinde haritanın doğru sayıda kutuyla (144 veya 400) oluştuğu doğrulanacak.
- **Puanlama Doğrulaması**: Yüksek çarpanlı oyunda kazanılan puanların katlanarak global skora eklendiği doğrulanacak.
