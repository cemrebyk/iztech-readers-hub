// Centralized list of available review tags for the rating/review system.
// Grouped by category for clarity, but rendered as a flat list.

export const AVAILABLE_TAGS = [
  // --- Okuma Deneyimi ve Akıcılık ---
  "Page-Turner",       // Sürükleyici
  "Fast-Paced",        // Hızlı ilerleyen
  "Easy Read",         // Rahat okunan
  "Quick-Read",        // Bir oturuşta biten
  "Heavy Language",    // Ağır dil/anlatım
  "Dense",             // Yoğun/Ağır içerik
  "Hard-to-Finish",    // Bitirmesi güç
  "Boring",            // Sıkıcı
  "Confusing",         // Kafa karıştırıcı

  // --- Ton ve Atmosfer ---
  "Funny",             // Eğlenceli
  "Dark",              // Karanlık/Kasvetli
  "Emotional",         // Duygusal
  "Heartbreaking",     // Yürek burkan
  "Melancholic",       // Melankolik
  "Nostalgic",         // Nostaljik
  "Uplifting",         // Neşelendirici/Motivasyon verici
  "Tense",             // Gerilimli
  "Mind-Bending",      // Zihin açıcı/Ters köşe

  // --- Değer ve Etki ---
  "Must-Read",         // Mutlaka okunmalı
  "Masterpiece",       // Başyapıt
  "Cult-Classic",      // Kült klasik
  "Life-Changing",     // Hayat değiştiren
  "Thought-Provoking", // Düşündürücü
  "Inspiring",         // İlham verici
  "Underrated",        // Değeri bilinmemiş
  "Overrated",         // Abartılmış

  // --- Akademik ve Teknik (İYTE Özel) ---
  "Academic",          // Akademik
  "Introductory",      // Başlangıç seviyesi
  "Comprehensive",     // Kapsamlı/A'dan Z'ye
  "Practical-Guide",   // Uygulama/Lab odaklı
  "Practical",         // Pratik bilgiler içeren
  "Exam-Saver",        // Sınav kurtarıcı
] as const;

export type ReviewTag = typeof AVAILABLE_TAGS[number];
