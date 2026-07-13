# Setup Domain Cloudflare + Tunnel Token (buat Panel Pterodactyl)

Panduan ini buat kamu yang mau deploy base ini di panel Pterodactyl yang udah ada fitur **Cloudflare Tunnel built-in** — jadi kamu gak perlu install `cloudflared` manual, tinggal tempel token-nya di panel.

Ada 3 tahap: (1) daftarin domain ke Cloudflare, (2) bikin Tunnel & ambil token, (3) pasang token + route di panel.

---

## 1. Daftarin domain ke Cloudflare

Skip bagian ini kalau domain kamu udah aktif di Cloudflare (nameserver-nya udah `*.ns.cloudflare.com`).

1. Login ke [dash.cloudflare.com](https://dash.cloudflare.com/), buka menu **Domains** → **Onboard a domain**.
2. Masukin domain apex kamu (contoh: `domainkamu.com`), lalu **Continue**.
3. Cloudflare bakal scan DNS record yang udah ada. Cek sekilas, kalau ada yang kurang bisa ditambah manual nanti — buat base API ini kamu gak butuh record khusus, tunnel yang bakal handle routing-nya.
4. Pilih plan (Free udah cukup), lanjut.
5. Cloudflare kasih 2 nameserver (contoh: `xxx.ns.cloudflare.com`). **Ganti nameserver domain kamu ke 2 nameserver itu di tempat kamu beli domain** (Niagahoster, Namecheap, dll — cari menu "Nameserver" atau "DNS Management" di panel registrar-nya).
6. Tunggu propagasi (biasanya beberapa menit sampai beberapa jam). Status domain di dashboard Cloudflare bakal berubah jadi **Active** kalau udah kepasang.

---

## 2. Bikin Cloudflare Tunnel & ambil token

1. Di dashboard Cloudflare, buka **Networking** → **Tunnels**.
2. Klik **Create a tunnel**, pilih connector **Cloudflared**.
3. Kasih nama tunnel (bebas, misal `base-rest-api`), klik **Save tunnel**.
4. Di halaman berikutnya bakal muncul perintah instalasi `cloudflared` — **kamu gak perlu jalanin perintah itu**, karena panel Pterodactyl kamu udah punya `cloudflared` built-in. Yang kamu butuh cuma token-nya:
   - Salin perintah instalasi ke text editor.
   - Token-nya adalah string panjang yang diawali `eyJ...` di dalam perintah tersebut (setelah flag `--token`).
   - Kalau tunnel-nya udah kebuat duluan, kamu bisa ambil token yang sama lewat: pilih tunnel → **Add a replica** → salin perintah instalasi → ambil string `eyJ...`-nya.
5. **Simpan token ini baik-baik, jangan disebar** — siapa aja yang pegang token ini bisa jalanin tunnel atas nama kamu.
6. Masih di halaman yang sama, atur **Published application route**:
   - **Subdomain**: misal `api` (jadi `api.domainkamu.com`), atau kosongin kalau mau pakai root domain.
   - **Domain**: pilih domain kamu dari dropdown.
   - **Service** → **Type**: `HTTP`, **URL**: `localhost:6000` (sesuaikan angka port-nya sama `PORT` yang kepakai di panel — cek bagian **3** di bawah).
   - **Save**.

Tunnel status di dashboard bakal jadi **Healthy** begitu server-nya jalan dan konek.

---

## 3. Pasang token & jalanin di panel Pterodactyl

1. Buka server kamu di panel, masuk ke tab **Startup** (atau **Variables**, tergantung tampilan panel).
2. Cari variable yang berhubungan sama Cloudflare Tunnel — biasanya namanya semacam `CLOUDFLARE TOKEN`, `TUNNEL TOKEN`, atau `CFTOKEN` (nama persisnya beda-beda tergantung egg yang dipakai provider panel kamu).
3. Tempel token `eyJ...` yang tadi disalin ke situ, save.
4. Pastikan variable **PORT** (atau sejenisnya) di panel sama dengan port yang dipakai `index.js` (default `6000`), dan sama juga dengan **Service URL** yang diisi di step 2.6 di atas.
5. Restart/start server dari panel. Cek log konsol — harusnya ada baris dari `cloudflared` yang bilang koneksi ke Cloudflare berhasil (connection registered / connected), berbarengan sama log `Server jalan di port 6000` dari aplikasi ini.
6. Buka `https://api.domainkamu.com` (sesuai subdomain yang kamu set) — kalau tunnel & app-nya jalan bareng, halaman depan base API ini bakal muncul.

### Troubleshooting singkat

| Masalah | Kemungkinan penyebab |
| --- | --- |
| Domain gak kebuka, DNS error | Nameserver belum aktif/belum propagasi, tunggu dulu |
| Tunnel status `Down`/`Inactive` di dashboard Cloudflare | Server di panel mati, atau token salah/ke-rotate |
| Domain kebuka tapi 502/504 | Port di **Service URL** Cloudflare gak sama sama `PORT` aplikasi, atau aplikasinya belum jalan |
| Domain kebuka tapi nampilin punya orang lain | Ada 2 route beda yang nabrak ke domain yang sama di tunnel |

Kalau mau ganti port aplikasi, cukup update environment variable `PORT` di panel — gak perlu ubah kode.
