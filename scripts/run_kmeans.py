import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from supabase import create_client, Client
from dotenv import load_dotenv

# .env.local dosyasını Python'a yükle
load_dotenv('.env.local')

# 1. SUPABASE BAĞLANTISI
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Supabase URL veya Key bulunamadı! Lütfen .env.local dosyanızı kontrol edin.")

supabase: Client = create_client(url, key)

def main():
    print("🚀 Unsupervised Learning (K-Means) Modeli Başlıyor...\n")

    # 2. VERİYİ LİMİTSİZ ÇEKME (PAGINATION)
    print("📥 Kitaplar Supabase'den çekiliyor (1000 limitini aşmak için sayfalama yapılıyor)...")
    all_books = []
    start = 0
    step = 1000

    while True:
        # range() fonksiyonu ile verileri paketler halinde çekiyoruz
        response = supabase.table("books").select("id, title, author, genre, tags").range(start, start + step - 1).execute()
        data = response.data
        
        if not data:
            break # Veri bittiyse döngüden çık
            
        all_books.extend(data)
        print(f"   📦 {len(all_books)} kitap hafızaya alındı...")
        start += step

    if not all_books:
        print("🔴 Veritabanında kitap bulunamadı.")
        return

    # Veriyi Pandas DataFrame'e çevir
    df = pd.DataFrame(all_books)
    print(f"\n✅ Toplam {len(df)} kitap başarıyla çekildi. Feature Engineering başlıyor...")

    # 3. FEATURE ENGINEERING
    df['author'] = df['author'].fillna('')
    df['genre'] = df['genre'].fillna('')
    df['tags'] = df['tags'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '')

    # Modelin okuyacağı nihai metin bloğu
    df['combined_features'] = df['author'] + " " + df['genre'] + " " + df['tags']

    # 4. VEKTÖRİZASYON
    print("🧮 Metinler matematiksel vektörlere (TF-IDF) dönüştürülüyor...")
    vectorizer = TfidfVectorizer(max_features=1500, stop_words='english')
    X = vectorizer.fit_transform(df['combined_features'])

    # 5. K-MEANS CLUSTERING
    k_clusters = 100
    print(f"🤖 K-Means Algoritması çalışıyor (Tüm kütüphane {k_clusters} kümeye ayrılıyor)...")
    
    kmeans = KMeans(n_clusters=k_clusters, random_state=42, n_init=10)
    df['cluster_id'] = kmeans.fit_predict(X)

    # 6. SONUÇLARI SUPABASE'E KAYDETME
    print("\n💾 Kümeler Supabase'e güncelleniyor (Bu işlem birkaç dakika sürebilir)...")
    
    basarili_kayit = 0
    hata_verildi_mi = False

    for index, row in df.iterrows():
        response = supabase.table("books").update({"cluster_id": int(row['cluster_id'])}).eq("id", row['id']).execute()
        
        if len(response.data) == 0:
            print(f"🔴 KRİTİK HATA: {row['title']} güncellenemedi! (RLS engeli veya ID bulunamadı)")
            hata_verildi_mi = True
            break
        else:
            basarili_kayit += 1
            if basarili_kayit % 500 == 0:
                print(f"   ⏳ {basarili_kayit} / {len(df)} kitap başarıyla güncellendi...")

    if not hata_verildi_mi:
        print(f"\n🎉 BÜYÜK BAŞARI: Tüm kütüphane tarandı ve {basarili_kayit} kitabın cluster_id'si veritabanına işlendi!")

if __name__ == "__main__":
    main()