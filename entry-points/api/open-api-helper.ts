export const OpenAPIOptions = {
  openapi: {
    info: {
      title: 'Plan Service',
      description: 'API for personal plan',
      version: '1.0.0',
    },
    tags: [{ name: 'v1.0', description: 'Current version for Plan Service' }],
  },
}

export const OpenAPIUIOptions = {
  routePrefix: '/docs',
  exposeRoute: true,
}
