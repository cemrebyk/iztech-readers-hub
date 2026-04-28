async function profileLibraryLocations() {
    console.log("🕵️‍♂️ İYTE Kütüphanesi Gizli Konum Kodları Çıkarılıyor...");

    // Sadece "the" kelimesiyle kütüphanenin ortasından 1000 kitaplık bir kepçe alıyoruz
    const searchUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="the"&hitsToDisplay=1000&includeAvailabilityInfo=true&json=true`;

    try {
        const res = await fetch(searchUrl);
        const data = await res.json();

        if (!data.HitlistTitleInfo) {
            console.log("❌ Veri alınamadı.");
            return;
        }

        // Aynı konumları tekrar eklememek için Set kullanıyoruz
        const locations = new Set();
        const materialTypes = new Set();

        data.HitlistTitleInfo.forEach(b => {
            // Materyal tiplerini de görelim (BOOK, EBOOK, vb.)
            if (b.materialType) materialTypes.add(b.materialType);

            // Konum bilgilerini toplayalım
            const loc = b.locationOfFirstAvailableItem || "KONUM_GİRİLMEMİŞ";
            locations.add(loc);
        });

        console.log(`\n📚 Sistemdeki Materyal Tipleri:`);
        console.log(Array.from(materialTypes).join(', '));

        console.log(`\n📍 Sistemdeki Fiziksel Konum (Location) Kodları:`);
        console.log(Array.from(locations).join('\n- '));

    } catch (error) {
        console.error("💥 Hata:", error.message);
    }
}

profileLibraryLocations();