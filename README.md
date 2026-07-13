# Base REST API

Base sederhana buat bikin REST API sendiri pakai Express.js. Endpoint baru otomatis ke-load, tinggal taruh file di folder yang benar. Halaman `/docs` nampilin semua endpoint dalam bentuk card basic yang bisa langsung dicoba dari browser.

## Fitur

- Auto-load endpoint — taruh file `.js` di `src/api/<kategori>/`, gak perlu import manual di `index.js`.
- Halaman dokumentasi (`/docs`) yang generate otomatis dari `src/settings.json`, ada fitur cari + tombol coba endpoint langsung.
- Tampilan simpel: tanpa banner, tanpa animasi, cuma card basic (nama, method, status, path).
- Semua response `res.json()` otomatis ditambahin field `creator` dari `src/settings.json`, gak perlu ditulis manual tiap endpoint.

## Struktur folder

```text
.
├── index.js                  # entry point, auto-load semua endpoint
├── package.json
├── src/
│   ├── settings.json         # nama/versi API + daftar endpoint buat halaman /docs
│   ├── icon.png              # icon website
│   └── api/
│       ├── ai/
│       ├── downloader/
│       ├── editor/
│       ├── random/
│       ├── search/
│       └── tools/            # tiap folder = 1 kategori endpoint
├── api-page/
│   ├── index.html            # halaman depan
│   ├── docs.html             # halaman dokumentasi/tester endpoint
│   ├── styles.css
│   ├── script.js
│   ├── 404.html
│   └── 500.html
└── docs/
    ├── ADDING_ENDPOINT.md    # cara nambah endpoint baru
    └── CLOUDFLARE_SETUP.md   # cara setup domain cloudflare + tunnel token (buat deploy di panel)
```

## Jalanin di lokal

Butuh Node.js versi **20.18.1 ke atas** (dipakai sama dependency `cheerio` buat scraping). Kalau Node kamu masih versi 18, endpoint yang makai `cheerio` (`/search/bing-image`) bakal gagal dimuat — endpoint lain tetap jalan normal, tapi tetap disaranin upgrade Node biar semua endpoint kepakai.

```bash
npm install
npm start
```

Default jalan di port `6000`. Buka `http://localhost:6000` buat halaman depan, atau `http://localhost:6000/docs` buat liat & coba semua endpoint.

Mau ganti port, set environment variable `PORT`:

```bash
PORT=3000 npm start
```

### Troubleshooting: `ReferenceError: File is not defined`

Kalau muncul error ini pas `npm start` (biasanya nunjuk ke `node_modules/undici/lib/web/webidl/index.js`), itu tandanya Node.js kamu masih versi 18 ke bawah. Dependency `cheerio` (dipakai di `/search/bing-image`) butuh Node **20.18.1+** karena package internalnya (`undici`) udah drop dukungan Node 18. Solusinya upgrade Node ke versi LTS terbaru (20.x atau 22.x), misal pakai [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install 22
nvm use 22
```

Server ini sendiri udah dibikin tahan banting — kalau ada 1 file endpoint yang gagal dimuat (karena masalah dependency kayak di atas), server tetap jalan dan endpoint lainnya tetap bisa dipakai. Cek log pas start, endpoint yang gagal bakal ditandain merah beserta pesan error-nya.

## Selanjutnya

- **Nambah endpoint baru** → baca [`docs/ADDING_ENDPOINT.md`](docs/ADDING_ENDPOINT.md)
- **Deploy ke panel Pterodactyl + domain sendiri lewat Cloudflare Tunnel** → baca [`docs/CLOUDFLARE_SETUP.md`](docs/CLOUDFLARE_SETUP.md)

## Ganti nama/tampilan API

Edit `src/settings.json` bagian `name`, `version`, dan `description` — otomatis kepakai di halaman depan dan `/docs`. Warna, radius, dan font web bisa diubah lewat variabel CSS di paling atas `api-page/styles.css`.

## Lisensi

MIT — bebas dipake, diubah, disebar. Endpoint di dalam `src/api/` manggil API pihak ketiga punya orang lain, jadi tanggung jawab pemakaian ada di kamu masing-masing.
