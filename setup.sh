#!/usr/bin/env bash
set -e

# ── GIS Demo Helper - Tek Komutla Kurulum ───────────────────────────────────
# Kullanım: chmod +x setup.sh && ./setup.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║       GIS Demo Helper Setup          ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# 1. Node.js kontrolü
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}Node.js bulunamadı. Lütfen Node.js 18+ yükleyin:${NC}"
  echo "  https://nodejs.org/"
  exit 1
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "${YELLOW}Node.js 18+ gerekli. Mevcut: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# 2. npm kontrolü
if ! command -v npm &> /dev/null; then
  echo -e "${YELLOW}npm bulunamadı.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm -v)"

# 3. Bağımlılıkları yükle
echo ""
echo -e "${CYAN}▸ Bağımlılıklar yükleniyor...${NC}"
npm install --legacy-peer-deps
echo -e "${GREEN}✓${NC} Bağımlılıklar yüklendi"

# 4. .env.local dosyasını oluştur (yoksa)
if [ ! -f .env.local ]; then
  cat > .env.local << 'ENVEOF'
# Overpass API endpoint (varsayılan, değiştirmenize gerek yok)
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
ENVEOF
  echo -e "${GREEN}✓${NC} .env.local oluşturuldu"
else
  echo -e "${GREEN}✓${NC} .env.local zaten mevcut"
fi

# 5. Build
echo ""
echo -e "${CYAN}▸ Proje derleniyor...${NC}"
npm run build
echo -e "${GREEN}✓${NC} Build başarılı"

# 6. Başlat
echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  Kurulum tamamlandı!${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo -e "  Geliştirme modu:  ${CYAN}npm run dev${NC}"
echo -e "  Production modu:  ${CYAN}npm run start${NC}"
echo -e "  Tarayıcıda aç:   ${CYAN}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Not: Hiçbir API key gerekmez!${NC}"
echo ""

# Otomatik başlat
read -p "Şimdi başlatılsın mı? (dev modu) [E/h]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Hh]$ ]]; then
  echo -e "${CYAN}▸ Dev sunucu başlatılıyor...${NC}"
  npm run dev
fi
