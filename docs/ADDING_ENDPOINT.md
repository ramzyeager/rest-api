# Cara Nambah Endpoint Baru

Endpoint di-load otomatis pas server start — cukup taruh file `.js` di folder yang benar, gak perlu edit `index.js`.

## 1. Bikin file endpoint

Taruh di `src/api/<kategori>/<nama-endpoint>.js`. Nama folder kategori dipakai sebagai prefix URL, jadi harus sama. Contoh: file di `src/api/search/kbbi.js` route-nya `/search/kbbi`.

Kalau kategorinya belum ada, tinggal bikin folder baru di dalam `src/api/` — otomatis ke-detect, gak perlu daftarin di tempat lain.

## 2. Template dasar

Setiap file harus `module.exports` sebuah function yang nerima `app` (instance Express), lalu daftarin route-nya sendiri di dalamnya:

```js
const axios = require('axios');

module.exports = function (app) {

    app.get('/search/kbbi', async (req, res) => {
        const kata = req.query.kata;

        if (!kata) {
            return res.status(400).json({
                status: false,
                message: "Parameter 'kata' diperlukan"
            });
        }

        try {
            const apiUrl = `https://contoh-api.my.id/search/kbbi?kata=${encodeURIComponent(kata)}`;
            const response = await axios.get(apiUrl);

            res.json({
                status: true,
                result: response.data
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    });

};
```

Aturan yang dipakai di semua endpoint (biar konsisten, tolong diikuti pas nambah baru):

- `require(...)` ditaruh di paling atas file, di luar `module.exports`.
- Validasi parameter wajib dulu sebelum lanjut — balikin `res.status(400).json(...)` kalau kosong.
- Bungkus logic utama dengan `try/catch`, kalau error balikin `res.status(500).json(...)`.
- Response sukses selalu `{ status: true, result: ... }`, response gagal selalu `{ status: false, message: "..." }`.
- Gak perlu nulis field `creator` manual — itu otomatis ditambahin sama middleware di `index.js` dari `src/settings.json`.
- Kalau butuh package baru (selain yang udah ada di `package.json`), tambahin lewat `npm install <nama-package>` biar kecatat di `package.json` & `package-lock.json`.

## 3. Daftarin ke halaman `/docs`

File di `src/api/` bikin endpoint-nya jalan, tapi biar muncul sebagai card di halaman `/docs`, tambahin entry-nya di `src/settings.json`.

Cari kategori yang sesuai di dalam array `categories`, terus tambah item baru:

```json
{
  "name": "KBBI Search",
  "desc": "Cari arti kata di KBBI",
  "path": "/search/kbbi?kata=",
  "status": "ready",
  "params": {
    "kata": "Kata yang dicari artinya"
  }
}
```

Keterangan field:

| Field | Wajib | Keterangan |
| --- | --- | --- |
| `name` | ya | Judul yang tampil di card |
| `desc` | ya | Deskripsi singkat |
| `path` | ya | Path endpoint. Kalau ada query param, tulis semua nama param-nya diikuti `=` (contoh: `?url=&type=`) — dari sini form input di panel "Coba Endpoint" otomatis ke-generate |
| `status` | ya | `ready` (hijau), `update` (kuning), atau `error` (merah) |
| `method` | tidak | Default `GET`. Isi `"POST"` kalau endpoint-nya POST |
| `params` | tidak | Object `{ "nama_param": "penjelasan" }`, muncul sebagai hint di bawah tiap input field |

Kalau kategori baru belum ada di `settings.json`, tambahin objek kategori baru di array `categories`:

```json
{
  "name": "Nama Kategori",
  "items": [ ... ]
}
```

## 4. Test

Jalanin `npm start`, terus:

- Buka `http://localhost:6000/search/kbbi?kata=makan` langsung di browser / Postman / curl, atau
- Buka `http://localhost:6000/docs`, cari card-nya, klik **Coba Endpoint**, isi parameter, klik **Kirim Request**.

Kalau responsenya berupa gambar/video (content-type `image/*` atau `video/*`), panel di `/docs` otomatis nampilin previewnya, bukan teks JSON.
