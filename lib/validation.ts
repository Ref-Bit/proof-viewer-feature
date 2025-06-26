import { z } from "zod"

// File validation schema
const fileSchema = z
  .instanceof(File)
  .refine((file) => {
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    return isImage || isVideo
  }, "File must be an image or video")
  .refine(
    (file) => {
      const isImage = file.type.startsWith("image/")
      const maxSize = isImage ? 1 * 1024 * 1024 : 5 * 1024 * 1024 // 1MB for images, 5MB for videos
      return file.size <= maxSize
    },
    (file) => {
      const isImage = file.type.startsWith("image/")
      return `File size must be less than ${isImage ? "1MB" : "5MB"}`
    },
  )

// Main form schema
export const addProofSchema = z
  .object({
    proofLink: z
      .string()
      .optional()
      .refine((val) => !val || z.string().url().safeParse(val).success, {
        message: "Please enter a valid URL format (e.g., https://example.com)",
      }),
    file: z.instanceof(File).optional().or(z.literal(undefined)),
  })
  .refine((data) => data.proofLink || data.file, {
    message: "Please provide either a proof link or upload a file",
    path: ["root"],
  })
  .refine(
    (data) => {
      if (!data.file) return true

      // Check file type
      const isImage = data.file.type.startsWith("image/")
      const isVideo = data.file.type.startsWith("video/")
      if (!isImage && !isVideo) return false

      // Check file size
      const maxSize = isImage ? 1 * 1024 * 1024 : 5 * 1024 * 1024
      return data.file.size <= maxSize
    },
    (data) => {
      if (!data.file) return { message: "", path: ["file"] }

      const isImage = data.file.type.startsWith("image/")
      const isVideo = data.file.type.startsWith("video/")

      if (!isImage && !isVideo) {
        return {
          message: "File must be an image or video",
          path: ["file"],
        }
      }

      const maxSize = isImage ? 1 * 1024 * 1024 : 5 * 1024 * 1024
      if (data.file.size > maxSize) {
        return {
          message: `File size must be less than ${isImage ? "1MB" : "5MB"}`,
          path: ["file"],
        }
      }

      return { message: "", path: ["file"] }
    },
  )

export type AddProofFormData = z.infer<typeof addProofSchema>
