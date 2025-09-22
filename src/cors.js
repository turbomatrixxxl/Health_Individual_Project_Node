const corsOptions = {
  // Permite doar cereri de la această origine
  origin: '*',
  // Permite metodele GET,POST,PUT,PATCH si DELETE
  methods: 'GET,POST,PUT,PATCH,DELETE',
  // Returnează un status 204 pentru cererile prefligth (OPTIONS)
  optionsSuccessStatus: 204,
};

module.exports = {
  corsOptions,
};

// Varianta noua !!!
// const corsOptions = {
//   // Permite doar cereri de la această origine
//   origin: '*',
//   // Permite metodele GET,POST,PUT,PATCH si DELETE
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Returnează un status 204 pentru cererile prefligth (OPTIONS)
//   credentials: true,
//   optionsSuccessStatus: 204,
// };

// module.exports = corsOptions;
