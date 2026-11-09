const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

async function apiRequest(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

const cloudControlAPI = {
  getHealth: () => apiRequest("/health"),

  // Compute
  getEC2Instances: () => apiRequest("/ec2/instances"),

  // Storage
  getS3Buckets: () => apiRequest("/s3/buckets"),

  // Networking
  getVPCs: () => apiRequest("/network/vpcs"),
  getSubnets: () => apiRequest("/network/subnets"),
  getSecurityGroups: () => apiRequest("/network/security-groups"),
  getInternetGateways: () => apiRequest("/network/internet-gateways"),

  // Databases
  getDatabases: () => apiRequest("/database/instances"),

  // Monitoring
  getAlarms: () => apiRequest("/monitoring/alarms"),
  getLogGroups: () => apiRequest("/monitoring/log-groups"),
  getEC2CPUMetrics: (instanceId) =>
    apiRequest(`/monitoring/ec2-cpu/${instanceId}`),

  // Security
  getMFAAudit: () => apiRequest("/security/mfa-audit"),
  getAccessKeys: () => apiRequest("/security/access-keys"),
  getCredentialReport: () => apiRequest("/security/credential-report"),
  getPolicyAudit: () => apiRequest("/security/policy-audit"),
  getIAMSummary: () => apiRequest("/security/iam-summary"),

  // Cost Optimization
  getCostSummary: () => apiRequest("/cost/summary"),
};

export default cloudControlAPI;