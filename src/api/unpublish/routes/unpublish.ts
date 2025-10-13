export default {
  routes: [
    {
      method: 'POST',
      path: '/unpublish/:contentType/:id',
      handler: 'unpublish.unpublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
