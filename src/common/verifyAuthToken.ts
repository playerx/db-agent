import { nkeys } from "@nats-io/nats-core"

const { JWT_PUBLIC_KEY } = process.env
if (!JWT_PUBLIC_KEY) {
  throw new Error("Please set JWT_PUBLIC_KEY env variable")
}

const publicKey = nkeys.fromPublic(JWT_PUBLIC_KEY)

export const verifyAuthToken = (jwtToken: string | undefined) => {
  if (!jwtToken) {
    console.debug("token not defined")
    return null
  }

  let jwtData: any

  try {
    const encoder = new TextEncoder()

    const jwtParts = jwtToken.split(".")

    const encodedSignature = fromBase64(jwtParts[2]!)

    if (!publicKey.verify(encoder.encode(jwtParts[1]), encodedSignature)) {
      console.debug("verify failed", jwtToken)
      return null
    }
    const payloadString = new TextDecoder().decode(fromBase64(jwtParts[1]!))
    jwtData = JSON.parse(payloadString)
    if (!jwtData.jok) {
      console.debug("jok section not found in jwt data", jwtData)
      return null
    }
  } catch (err) {
    console.debug("error on jwt verification process", err)
  }

  if (!jwtData) {
    console.debug("jwt data is null", jwtToken)
    return null
  }

  const result = jwtData.jok as JwtData

  if (!result.userId || !result.sessionId) {
    /**
     * It should never happen
     */
    console.debug("userId or sessionId not defined in jwtData", jwtData)
    return null
  }

  return {
    ...result,
    createdAt: new Date(jwtData.iat),
    expiresAt: jwtData.exp ? new Date(jwtData.exp) : null,
    nats: jwtData.nats,
  }
}

function fromBase64(x: string): Uint8Array {
  return Uint8Array.from(Buffer.from(fromBase64Decode(x), "base64"))
}

function fromBase64Decode(base64: string) {
  return base64.replace(/-/g, "+").replace(/_/g, "/")
}

export type JwtData = {
  name?: string
  userId: string
  sessionId: string
  email?: string
  roles?: string[]
  webAuthn?: number
  nats: any
  createdAt: Date
  expiresAt: Date | null

  origin: string
  accessToken: string
  url: URL
}
