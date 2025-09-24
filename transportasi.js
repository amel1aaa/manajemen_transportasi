// Class Kendaraan: representasi kendaraan sederhana
class Kendaraan {
    constructor(jenis, merk, plat) {
      this.jenis = jenis;
      this.merk = merk;
      this.plat = plat;
    }
  
    // Mengembalikan info ringkas kendaraan
    info() {
      return `${this.jenis} • ${this.merk} (${this.plat})`;
        }
    }
  
    // Class Pelanggan sesuai tugas: nama, nomorTelepon, kendaraanDisewa
    class Pelanggan {
        constructor(nama, nomorTelepon, kendaraanDisewa = null) {
            this.nama = nama;
            this.nomorTelepon = nomorTelepon;
            this.kendaraanDisewa = kendaraanDisewa;
            this.sejarah = []; // catatan transaksi
        }
  
        // Metode mencatat transaksi penyewaan kendaraan
        sewaKendaraan(kendaraan) {
        if (!kendaraan) throw new Error('Kendaraan tidak valid');
        this.kendaraanDisewa = kendaraan;
        this.sejarah.push({
            tipe: 'SEWA',
            waktu: new Date().toISOString(),
            kendaraan: kendaraan.info()
        });
    }
  
        // Metode mencatat pengembalian
        kembaliKendaraan() {
        if (!this.kendaraanDisewa) return;
        this.sejarah.push({
            tipe: 'KEMBALI',
            waktu: new Date().toISOString(),
            kendaraan: this.kendaraanDisewa.info()
            });
            this.kendaraanDisewa = null;
        }
    
        // Apakah sedang menyewa?
        sedangMenyewa() {
        return this.kendaraanDisewa !== null;
        }
    }
  
    // Sistem manajemen (menyimpan data pelanggan + operasi)
    class TransportManagementSystem {
        constructor() {
            this.pelangganList = [];
            // coba load dari localStorage jika tersedia
            this._loadFromStorage();
        }
        // Simpan ke localStorage (opsional)
        _saveToStorage() {
            try {
                const raw = JSON.stringify(this.pelangganList.map(p => ({
                    nama: p.nama,
                    nomorTelepon: p.nomorTelepon,
                    kendaraanDisewa: p.kendaraanDisewa ? {
                        jenis: p.kendaraanDisewa.jenis,
                        merk: p.kendaraanDisewa.merk,
                        plat: p.kendaraanDisewa.plat
                    } : null,
                    sejarah: p.sejarah
                })));
                localStorage.setItem('tms_data', raw);
                } catch (e) { /* ignore */ }
            }

            _loadFromStorage() {
                try {
                    const raw = localStorage.getItem('tms_data');
                    if (!raw) return;
                    const arr = JSON.parse(raw);
                    this.pelangganList = arr.map(obj => {
                        const kendaraan = obj.kendaraanDisewa ? new Kendaraan(obj.kendaraanDisewa.jenis, obj.kendaraanDisewa.merk, obj.kendaraanDisewa.plat) : null;
                        const p = new Pelanggan(obj.nama, obj.nomorTelepon, kendaraan);
                        p.sejarah = obj.sejarah || [];
                        return p;
                    });
                } catch (e) {
                    this.pelangganList = [];
                }
            }

            tambahPelanggan(pelanggan) {
                const exist = this.pelangganList.find(p => p.nomorTelepon === pelanggan.nomorTelepon);
                if (exist) throw new Error('Pelanggan dengan nomor telepon sudah terdaftar');
                this.pelangganList.push(pelanggan);
                this._saveToStorage();
            }
            
        // Mencatat transaksi sewa; bila pelanggan baru -> dibuat
        catatTransaksi({ nama, nomorTelepon, kendaraan }) {
            let pelanggan = this.pelangganList.find(p => p.nomorTelepon === nomorTelepon);
            if (!pelanggan) {
                pelanggan = new Pelanggan(nama, nomorTelepon);
                this.pelangganList.push(pelanggan);
            }
            pelanggan.sewaKendaraan(kendaraan);
            this._saveToStorage();
            return pelanggan;
        }
  
        catatPengembalianByTelepon(nomorTelepon) {
            const pelanggan = this.pelangganList.find(p => p.nomorTelepon === nomorTelepon);
            if (!pelanggan) throw new Error('Pelanggan tidak ditemukan');
            pelanggan.kembaliKendaraan();
            this._saveToStorage();
            return pelanggan;
        }
  
        daftarPelangganMenyewa() {
            return this.pelangganList.filter(p => p.sedangMenyewa());
        }
    }
  
    /* ========== Inisialisasi & UI ========== */
    const system = new TransportManagementSystem();
    
    // Elemen DOM
    const listEl = document.getElementById('list');
    const form = document.getElementById('rentalForm');
    
    // Sanitasi output untuk mencegah XSS
    const escapeHtml = (text = '') => {
        return String(text).replace(/[&<>"']/g, match => {
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[match];
        });
    };
  
    // Render daftar pelanggan yang sedang menyewa
    const renderList = () => {
        const daftar = system.daftarPelangganMenyewa();
        if (daftar.length === 0) {
            listEl.innerHTML = '<p>Tidak ada pelanggan yang sedang menyewa kendaraan.</p>';
            return;
        }
  
        const html = daftar.map(p => {
            const kendaraanInfo = p.kendaraanDisewa ? escapeHtml(p.kendaraanDisewa.info()) : '-';
            const sejarahHtml = p.sejarah.map(s => {
                const waktu = new Date(s.waktu).toLocaleString();
                return `<div class="meta">${escapeHtml(s.tipe)} • ${escapeHtml(waktu)} • ${escapeHtml(s.kendaraan)}</div>`;
            }).join('');
            return `
            <li>
                <div class="list-item-title">
                    <div>
                        <strong>${escapeHtml(p.nama)}</strong><br>
                        <small>${escapeHtml(p.nomorTelepon)}</small>
                    </div>
                    <div>
                        <div class="label-badge">Menyewa</div>
                    </div>
                </div>
                <div style="margin-top:8px">Kendaraan: ${kendaraanInfo}</div>
                <div style="margin-top:8px">${sejarahHtml}</div>
            </li>
        `;
    }).join('');
    listEl.innerHTML = `<ul>${html}</ul>`;
};
  
// Render awal
renderList();
  
/* Tangani submit form -> catat sewa */
form.addEventListener('submit', ev => {
    ev.preventDefault();
    const nama = document.getElementById('nama').value.trim();
    const telepon = document.getElementById('telepon').value.trim();
    const jenis = document.getElementById('jenis').value;
    const merk = document.getElementById('merk').value.trim();
    const plat = document.getElementById('plat').value.trim();
  
    if (!nama || !telepon || !jenis || !merk || !plat) {
      alert('Lengkapi semua field sebelum mencatat sewa.');
      return;
    }
  
    const kend = new Kendaraan(jenis, merk, plat);
    try {
      system.catatTransaksi({ nama, nomorTelepon: telepon, kendaraan: kend });
      form.reset();
      renderList();
      alert('Transaksi sewa berhasil dicatat.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
});
  
/* Tombol pengembalian sederhana */
document.getElementById('kembaliBtn').addEventListener('click', () => {
    const nomor = prompt('Masukkan nomor telepon pelanggan yang mengembalikan kendaraan:');
    if (!nomor) return;
    try {
      system.catatPengembalianByTelepon(nomor.trim());
      renderList();
      alert('Pengembalian tercatat.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
});  