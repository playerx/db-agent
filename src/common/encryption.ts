import { createCipheriv, createDecipheriv, randomBytes, type CipherGCM, type DecipherGCM } from "crypto"

class Encryption {
  private algorithm = "aes-256-gcm"
  private key: Buffer

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY environment variable is not set")
    }
    // Convert base64 key to buffer
    this.key = Buffer.from(encryptionKey, "base64")
  }

  encrypt(text: string): string {
    // Generate a random initialization vector
    const iv = randomBytes(12)

    // Create cipher (cast to CipherGCM for auth tag methods)
    const cipher = createCipheriv(this.algorithm, this.key, iv) as CipherGCM

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    // Get the auth tag
    const authTag = cipher.getAuthTag()

    // Combine iv, authTag, and encrypted data
    // Format: iv:authTag:encryptedData
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
  }

  decrypt(encryptedText: string): string {
    // Split the encrypted text into its components
    const parts = encryptedText.split(":")
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format")
    }

    const iv = Buffer.from(parts[0]!, "hex")
    const authTag = Buffer.from(parts[1]!, "hex")
    const encrypted = parts[2]!

    // Create decipher (cast to DecipherGCM for auth tag methods)
    const decipher = createDecipheriv(this.algorithm, this.key, iv) as DecipherGCM
    decipher.setAuthTag(authTag)

    // Decrypt the text
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  }
}

export const encryption = new Encryption()
