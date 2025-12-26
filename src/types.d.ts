// Extend the Express Request interface with custom properties
global {
  namespace Express {
    interface Request {
      user: {
        userId: string
        tenantId: string
        dbName: string
      }
    }
  }
}

export {}
