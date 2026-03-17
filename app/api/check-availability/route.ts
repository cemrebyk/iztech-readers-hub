import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { createClient } from '../../../lib/supabase-server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const isbn = searchParams.get('isbn');
    const id = searchParams.get('id');

    if (!isbn || !id) {
        return NextResponse.json({ error: 'Eksik parametreler.' }, { status: 400 });
    }

    let browser;
    try {
        const targetUrl = `https://catalog.iyte.edu.tr/client/tr_TR/default_tr/search/results?qu=${isbn}`;

        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(targetUrl, { waitUntil: 'networkidle2' });

        await page.waitForSelector('.asyncFieldSD_ITEM_STATUS', { timeout: 5000 }).catch(() => console.log("Zaman aşımı."));

        const statusText = await page.evaluate(() => {
            const element = document.querySelector('.asyncFieldSD_ITEM_STATUS');
            return element ? element.textContent?.trim() || '' : '';
        });

        // 1. İŞTE SİHİRLİ DOKUNUŞ: TÜRKÇE KARAKTER ÇÖZÜMÜ
        // Hem büyük "İade" kelimesini arıyoruz, hem de Türkçe kurallarına göre küçültüp arıyoruz.
        const isBorrowed = statusText.includes('İade') || statusText.toLocaleLowerCase('tr-TR').includes('iade');

        // Eğer ödünçte (isBorrowed) DEĞİLSE ve metin boş değilse raftadır!
        const isAvailable = statusText.length > 0 && !isBorrowed;

        // 2. VERİTABANINI GÜNCELLEME
        // .select() ekledik ki Supabase bize gerçekten bir satırı güncelleyip güncellemediğini söylesin.
        const supabase = await createClient();
        const { data: updatedRow, error: dbError } = await supabase
            .from('books')
            .update({ is_available: isAvailable })
            .eq('id', id)
            .select();

        if (dbError) {
            console.error("Veritabanı Güncelleme Hatası:", dbError);
        }

        return NextResponse.json({
            isbn: isbn,
            raw_status_text: statusText || 'Metin bulunamadı',
            is_available: isAvailable,
            db_updated: updatedRow && updatedRow.length > 0 // Güncellenen satır varsa true döner
        });

    } catch (error) {
        console.error('Sunucu Hatası:', error);
        return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}