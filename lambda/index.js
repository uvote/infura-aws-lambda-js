/**
 * AWS Lambda handler to proxy request from a client to an Infura endpoint.
 *
 * You should never reveal your Infura API key:
 * the server to server API call implemented here, hides it from the client.
 *
 * The following environment variables are used:
 *
 * - `INFURA_ENDPOINT`: go to your Infura dashboard to get the endpoint; it contains also your Infura API key.
 * - `ALLOW_ORIGIN`: optional but **recommended** to restrict your allowed origin using CORS.
 *
 * Request and response JSON payloads are sent as is, transparently.
 *
 * Internal errors and Infura response errors are sent to the client with data shape
 *
 *     {
 *       error: {
 *         message: string
 *       }
 *     }
 */
export const handler = async (event) => {
  const INFURA_ENDPOINT = process.env.INFURA_ENDPOINT;
  const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN;

  const commonHeaders = {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": ALLOW_ORIGIN ?? "*",
  };

  const errorResponse = (message) => ({
    body: JSON.stringify({
      error: {
        message,
      },
    }),
    headers: {
      "Content-Type": "application/json",
      ...commonHeaders,
    },
    isBase64Encoded: false,
    statusCode: response.status,
  });

  try {
    // Handle CORS.

    if (event.httpMethod === "OPTIONS")
      return {
        body: "",
        headers: {
          "Access-Control-Allow-Headers": "Authorization,Content-type",
          "Access-Control-Allow-Methods": "OPTIONS,POST",
          ...commonHeaders,
        },
        isBase64Encoded: false,
        statusCode: 200,
      };

    // Chech HTTP method.

    if (event.httpMethod !== "POST")
      return {
        body: "",
        headers: commonHeaders,
        isBase64Encoded: false,
        statusCode: 405,
      };

    // Call Infura endpoint with same request body.

    const response = await fetch(INFURA_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: event.body,
    });

    // Handle response errors.

    if (!response.ok) return errorResponse(response.statusText);

    // Send Infura response payload to the client.

    const payload = await response.json();

    return {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        ...commonHeaders,
      },
      isBase64Encoded: false,
      statusCode: response.status,
    };
  } catch (error) {
    console.debug(error);
    return errorResponse(error.message);
  }
};
