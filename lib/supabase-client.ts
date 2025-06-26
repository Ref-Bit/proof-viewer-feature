import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadFileToSupabase(file: File): Promise<{ url: string; error?: string }> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `proofs/${fileName}`

    const { data, error } = await supabase.storage.from("proof-files").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Upload error:", error)
      return { url: "", error: error.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("proof-files").getPublicUrl(filePath)

    return { url: publicUrl }
  } catch (error) {
    console.error("Upload error:", error)
    return { url: "", error: "Failed to upload file" }
  }
}
