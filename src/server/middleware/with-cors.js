/**
 * CORS middleware for handling cross-origin requests
 */

const appendHeaders = ({ request, response }) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  if (request.method === "OPTIONS") {
    response.setHeader(
      "Access-Control-Allow-Methods",
      "PUT, POST, PATCH, DELETE, GET",
    );
  }
  return response;
};

const withCors = async ({ request, response }) => ({
  request,
  response: appendHeaders({ request, response }),
});

export default withCors;
