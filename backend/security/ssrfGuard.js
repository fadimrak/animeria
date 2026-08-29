import { URL } from "node:url";
import net from "node:net";

// List of Private / Loopback / Cloud Metadata IP blocks to reject
function isPrivateOrRestrictedIp(ip) {
  if (!ip) return true;

  // IPv4 Loopback
  if (ip === "127.0.0.1" || ip.startsWith("127.")) return true;

  // IPv6 Loopback / Unspecified
  if (ip === "::1" || ip === "::") return true;

  // AWS / Cloud Metadata IP (169.254.169.254 / Link Local)
  if (ip.startsWith("169.254.")) return true;

  // Private RFC 1918 subnets
  // 10.0.0.0 – 10.255.255.255
  if (ip.startsWith("10.")) return true;
  // 192.168.0.0 – 192.168.255.255
  if (ip.startsWith("192.168.")) return true;
  // 172.16.0.0 – 172.31.255.255
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;

  // Carrier-grade NAT (100.64.0.0/10)
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(ip)) return true;

  // 0.0.0.0
  if (ip === "0.0.0.0") return true;

  return false;
}

// SSRF Guard Middleware & URL Validator
export function validateSafeExternalUrl(targetUrlString) {
  if (!targetUrlString || typeof targetUrlString !== "string") {
    return { valid: false, error: "URL parametresi eksik veya geçersiz." };
  }

  try {
    const parsed = new URL(targetUrlString);

    // 1. Enforce HTTP / HTTPS protocols only (blocks file://, gopher://, dict://, ldap://)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "Yalnızca HTTP ve HTTPS protokollerine izin verilir." };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Reject localhost names
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "metadata.google.internal"
    ) {
      return { valid: false, error: "Yerel ağ veya loopback adreslerine erişim engellendi." };
    }

    // 3. Reject direct raw IP addresses if they are private
    if (net.isIP(hostname)) {
      if (isPrivateOrRestrictedIp(hostname)) {
        return { valid: false, error: "Özel IP aralıklarına erişim güvenlik nedeniyle engellendi." };
      }
    }

    return { valid: true, url: parsed.toString() };
  } catch (err) {
    return { valid: false, error: "Geçersiz URL formatı." };
  }
}

// Open Redirect Guard: Validates that redirect destination stays on domain
export function isSafeRedirectUrl(targetUrl, hostDomain = "") {
  if (!targetUrl || typeof targetUrl !== "string") return false;

  // Safe relative paths: e.g. "/watch?id=1"
  if (targetUrl.startsWith("/") && !targetUrl.startsWith("//") && !targetUrl.startsWith("/\\")) {
    return true;
  }

  try {
    const parsed = new URL(targetUrl);
    if (!hostDomain) return false;
    return parsed.hostname === hostDomain || parsed.hostname.endsWith(`.${hostDomain}`);
  } catch {
    return false;
  }
}
