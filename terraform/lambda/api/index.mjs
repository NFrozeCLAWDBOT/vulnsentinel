const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

export const handler = async (event) => {
  console.log("API Lambda placeholder - will be implemented in Phase 2");
  return {
    statusCode: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ message: "VulnSentinel API placeholder" }),
  };
};
