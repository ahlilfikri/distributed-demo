# Demo load balancing dan failover

Tiga node Express berjalan di tiga container berbeda. Satu container tambahan menjalankan HAProxy, sehingga totalnya empat container.

```text
Client → localhost:8080 → HAProxy → node1:3000
                                → node2:3000
                                → node3:3000
```

Butuh Docker Engine dan Docker Compose. Jalankan perintah berikut dari direktori ini.

## Jalankan

```sh
docker compose up -d --build --wait
```

Hit endpoint beberapa kali untuk melihat nama node bergantian:

```sh
for i in $(seq 1 9); do curl -fsS http://localhost:8080/; echo; done
```

Setiap respons memuat `node`, `hostname`, `timestamp`, dan `message`. Pada kondisi stabil dengan request berurutan, ketiga node menerima giliran round-robin. Node pertama tidak harus node1.

## Demo node mati

Terminal pertama, kirim request terus-menerus:

```sh
while true; do curl -sS --max-time 5 http://localhost:8080/; echo; sleep 1; done
```

Terminal kedua, matikan node2 secara mendadak:

```sh
docker compose kill node2
```

HAProxy memeriksa `/health` setiap satu detik dan mengeluarkan node setelah dua pemeriksaan gagal. Setelah terdeteksi, respons hanya berasal dari node1 dan node3. Request yang sedang diproses saat node mati masih bisa gagal; failover bukan jaminan semua request bebas error.

Hidupkan kembali node2:

```sh
docker compose start node2
```

Setelah dua health check berhasil, node2 kembali menerima request otomatis. Tidak perlu me-restart HAProxy. Restart otomatis aplikasi sengaja tidak diaktifkan agar node tetap mati saat demonstrasi.

## Pantau dan bersihkan

```sh
docker compose ps -a
docker compose logs -f load-balancer node1 node2 node3
docker compose down
```

Demo ini memperlihatkan pembagian request dan failover aplikasi stateless, bukan replikasi database atau pemindahan proses yang sedang berjalan. Semua container berada di satu host, dan HAProxy tunggal masih menjadi titik kegagalan. Jika semua node mati, HAProxy mengembalikan HTTP 503.

Konfigurasi mengacu pada [manual HAProxy](https://www.haproxy.com/documentation/haproxy-configuration-manual/latest/) dan [dokumentasi health check](https://www.haproxy.com/documentation/haproxy-configuration-tutorials/reliability/health-checks/).
