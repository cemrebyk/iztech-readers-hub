// scripts/check-models.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

async function listModels() {
    try {
        // Bu metod her SDK versiyonunda doğrudan olmayabilir, 
        // ama 404 hatasını çözmek için anahtarı doğrular.
        console.log("API Anahtarı kontrol ediliyor...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("test");
        console.log("Bağlantı başarılı, gemini-pro aktif.");
    } catch (e) {
        console.error("Erişim hatası:", e);
    }
}
listModels();