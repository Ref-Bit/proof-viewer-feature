"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side Supabase client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export interface ProofSubmission {
  proofLink?: string
  fileName?: string
  fileUrl?: string
  fileSize?: number
  fileType?: string
}

export async function insertProofRecord(
  proofData: ProofSubmission,
): Promise<{ success: boolean; error?: string; id?: number }> {
  try {
    const { data, error } = await supabaseAdmin
      .from("proofs")
      .insert([
        {
          proof_link: proofData.proofLink,
          file_name: proofData.fileName,
          file_url: proofData.fileUrl,
          file_size: proofData.fileSize,
          file_type: proofData.fileType,
          created_at: new Date().toISOString(),
          status: "pending",
        },
      ])
      .select("id")
      .single()

    if (error) {
      console.error("Database error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error("Database error:", error)
    return { success: false, error: "Failed to save proof record" }
  }
}
