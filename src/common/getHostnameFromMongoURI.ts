export function getHostnameFromMongoURI(connectionString: string) {
  try {
    // Remove the mongodb:// or mongodb+srv:// protocol
    const withoutProtocol = connectionString.replace(
      /^mongodb(\+srv)?:\/\//,
      ""
    )

    // Remove credentials if present (username:password@)
    const withoutCredentials = withoutProtocol.replace(/^[^@]+@/, "")

    // Extract hostname (everything before the first / or ?)
    const hostname = withoutCredentials.split(/[/?]/)[0]

    // If there are multiple hosts (replica set), split by comma
    const hosts = hostname!.split(",")

    return hosts[0]!
  } catch (error) {
    throw new Error("Invalid MongoDB connection string")
  }
}
