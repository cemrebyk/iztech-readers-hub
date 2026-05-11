"use server"

import { createClient } from "@/lib/supabase-server" //
import { revalidatePath } from "next/cache"

export async function followUserByEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const supabase = await createClient();

    // ÇÖZÜM: user değişkenini çekiyoruz ve ':' kullanarak ona 'currentUser' ismini veriyoruz.
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    // Güvenlik Kontrolü: currentUser artık tanımlı
    if (authError || !currentUser) {
        throw new Error("İşlem başarısız: Oturumunuzun süresi dolmuş olabilir.");
    }

    // 1. Hedef kullanıcıyı bul
    const { data: targetUser, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

    if (searchError || !targetUser) {
        throw new Error("Belirtilen e-posta adresiyle kayıtlı bir öğrenci bulunamadı.");
    }

    // Kendini takip etme kontrolü
    if (targetUser.id === currentUser.id) {
        throw new Error("Kendi profilinizi takip edemezsiniz.");
    }

    // 2. Takip işlemini gerçekleştir
    const { error: followError } = await supabase
        .from('follows')
        .insert({
            follower_id: currentUser.id, // Takip eden (sen)
            following_id: targetUser.id   // Takip edilen (arkadaşın)
        });

    if (followError) {
        if (followError.code === '23505') throw new Error("Bu kişiyi zaten takip ediyorsunuz.");
        throw followError;
    }

    revalidatePath('/feed');
    return { success: true };
}