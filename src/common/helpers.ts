export function createDbProxy(db: any) {
  return new Proxy(db, {
    get(target, prop) {
      if (typeof prop !== "string") return target[prop]

      const collection = target.collection(prop)

      return new Proxy(collection, {
        get(colTarget, colProp) {
          return colTarget[colProp]
        },
      })
    },
  })
}

export function run(expr: string, ctx: Object) {
  return Function(...Object.keys(ctx), `return ${expr}`)(...Object.values(ctx))
}
