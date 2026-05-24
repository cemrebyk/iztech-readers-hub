import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
import plotly.express as px

# .env.local dosyasını Python'a yükle
load_dotenv('.env.local')

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def main():
    print("🚀 Galaksi Haritası (Cluster Visualization) Oluşturuluyor...\n")

    # 1. VERİYİ ÇEKME (Sadece cluster_id'si olanları alıyoruz)
    print("📥 Kümelenmiş kitaplar Supabase'den çekiliyor...")
    all_books = []
    start = 0
    step = 1000

    while True:
        response = supabase.table("books").select("id, title, author, genre, tags, cluster_id").not_.is_("cluster_id", "null").range(start, start + step - 1).execute()
        data = response.data
        if not data:
            break
        all_books.extend(data)
        start += step

    df = pd.DataFrame(all_books)
    print(f"✅ Toplam {len(df)} kitap başarıyla çekildi.")

    # 2. ÖZNİTELİK MÜHENDİSLİĞİ VE VEKTÖRİZASYON (K-Means ile aynı mantık)
    df['author'] = df['author'].fillna('')
    df['genre'] = df['genre'].fillna('')
    df['tags'] = df['tags'].apply(lambda x: ' '.join(x) if isinstance(x, list) else '')
    df['combined_features'] = df['author'] + " " + df['genre'] + " " + df['tags']

    print("🧮 Metinler matematiksel uzaya yerleştiriliyor...")
    vectorizer = TfidfVectorizer(max_features=1500, stop_words='english')
    X = vectorizer.fit_transform(df['combined_features'])

    # 3. BOYUT İNDİRGEME (1500 Boyutu -> 2 Boyuta Ezme)
    # PCA'in seyrek (sparse) matrisler için optimize edilmiş versiyonu olan TruncatedSVD kullanıyoruz
    print("📉 1500 Boyutlu veri 2 Boyuta (X, Y) indirgeniyor...")
    svd = TruncatedSVD(n_components=2, random_state=42)
    X_2d = svd.fit_transform(X)

    # 2D koordinatları DataFrame'e ekle
    df['X_Koordinati'] = X_2d[:, 0]
    df['Y_Koordinati'] = X_2d[:, 1]
    
    # Plotly'nin renkleri kesintisiz (gradient) değil, ayrık (discrete) kategoriler olarak algılaması için string'e çeviriyoruz
    df['Küme_No'] = df['cluster_id'].astype(str)

    # 4. İNTERAKTİF GRAFİĞİ OLUŞTURMA
    print("🎨 İnteraktif HTML grafiği çiziliyor...")
    fig = px.scatter(
        df, 
        x='X_Koordinati', 
        y='Y_Koordinati', 
        color='Küme_No', 
        hover_data={'title': True, 'author': True, 'genre': True, 'Küme_No': True, 'X_Koordinati': False, 'Y_Koordinati': False},
        title="IZTECH Reader's Hub - Makine Öğrenmesi Kitap Uzayı (K-Means Clusters)",
        width=1200, 
        height=800,
        opacity=0.7 # Noktalar üst üste bindiğinde yoğunluğu görebilmek için hafif şeffaflık
    )

    # Arka planı koyu (Next.js projene uygun) ve şık yapalım
    fig.update_layout(template="plotly_dark", title_x=0.5)

    # HTML olarak kaydet
    output_file = "kitap_uzayi_haritasi.html"
    fig.write_html(output_file)
    print(f"\n🎉 BÜYÜK BAŞARI: Grafik '{output_file}' dosyasına kaydedildi!")
    print("👉 Proje klasöründeki bu HTML dosyasına çift tıklayıp tarayıcında açabilirsin.")

if __name__ == "__main__":
    main()