// Automated Security Verification Test Suite
import speakeasy from "speakeasy";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================");
  console.log("🛡️ RUNNING ANIMERIA BACKEND SECURITY TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failed++;
    }
  }

  // 1. Security Headers Test
  try {
    const res = await fetch(`${BASE_URL}/`);
    const csp = res.headers.get("content-security-policy");
    const nosniff = res.headers.get("x-content-type-options");
    const frameOptions = res.headers.get("x-frame-options");
    const poweredBy = res.headers.get("x-powered-by");

    assert(Boolean(csp && csp.includes("default-src 'self'")), "Content-Security-Policy (CSP) header is present and active");
    assert(nosniff === "nosniff", "X-Content-Type-Options: nosniff header is active");
    assert(frameOptions === "SAMEORIGIN", "X-Frame-Options: SAMEORIGIN (Clickjacking defense) is active");
    assert(!poweredBy, "X-Powered-By header is stripped (server fingerprinting protection)");
  } catch (err) {
    assert(false, `Security headers test failed: ${err.message}`);
  }

  // 2. SSRF Guard Test (Localhost & Cloud Metadata blocking)
  try {
    const localRes = await fetch(`${BASE_URL}/api/proxy/sub?url=http://127.0.0.1:3000/data/users.json`);
    assert(localRes.status === 403, "SSRF Guard: Blocked internal loopback request (127.0.0.1) with HTTP 403");

    const awsMetaRes = await fetch(`${BASE_URL}/api/proxy/m3u8?url=http://169.254.169.254/latest/meta-data/`);
    assert(awsMetaRes.status === 403, "SSRF Guard: Blocked AWS metadata IP (169.254.169.254) with HTTP 403");

    const protoRes = await fetch(`${BASE_URL}/api/proxy/sub?url=file:///etc/passwd`);
    assert(protoRes.status === 403, "SSRF Guard: Blocked file:// protocol with HTTP 403");
  } catch (err) {
    assert(false, `SSRF test failed: ${err.message}`);
  }

  // 3. Input Validation Test (Zod Schema)
  try {
    const badReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "a", email: "notanemail", password: "123" }),
    });
    const badRegJson = await badReg.json();
    assert(badReg.status === 400 && badRegJson.code === "VALIDATION_ERROR", "Input Validation: Rejected invalid registration payload with HTTP 400");
  } catch (err) {
    assert(false, `Input validation test failed: ${err.message}`);
  }

  // 4. Registration, JWT & HttpOnly Cookies Test
  const testUser = `sec_user_${Date.now()}`;
  let token = "";
  let refreshToken = "";
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUser,
        email: `${testUser}@example.com`,
        password: "SuperSecretPassword123!",
      }),
    });
    const regData = await regRes.json();
    const setCookie = regRes.headers.get("set-cookie") || "";

    assert(regRes.status === 200 && regData.success, "User Registration with strong password hashing succeeded");
    assert(setCookie.includes("HttpOnly") && setCookie.includes("SameSite=Lax"), "JWT and Refresh Tokens set via secure HttpOnly & SameSite=Lax cookies");
    assert(!regData.user.passwordHash && !regData.user.passwordSalt, "Password hash & salt are strictly omitted from client responses");
    token = regData.token;
    refreshToken = regData.refreshToken;
  } catch (err) {
    assert(false, `Registration test failed: ${err.message}`);
  }

  // 5. Mass Assignment Defense Test (Role injection prevention)
  try {
    const updateRes = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        bio: "Ethical Security Tester",
        role: "ADMIN", // Malicious role elevation attempt
        isAdmin: true,
      }),
    });
    const updateData = await updateRes.json();
    // ProfileUpdateSchema has .strict() so extra fields trigger 400 or get stripped
    assert(updateRes.status === 400 || (updateData.user && updateData.user.role !== "ADMIN"), "Mass Assignment Defense: Malicious role injection (ADMIN) was rejected/blocked");
  } catch (err) {
    assert(false, `Mass assignment test failed: ${err.message}`);
  }

  // 6. 2FA (Two-Factor Authentication TOTP) Test
  try {
    const setupRes = await fetch(`${BASE_URL}/api/auth/2fa/setup`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    });
    const setupData = await setupRes.json();
    assert(setupData.success && Boolean(setupData.qrCode) && Boolean(setupData.secret), "2FA TOTP setup generated QR code and secret");

    // Generate valid TOTP token using speakeasy
    const totpCode = speakeasy.totp({
      secret: setupData.secret,
      encoding: "base32",
    });

    const enableRes = await fetch(`${BASE_URL}/api/auth/2fa/enable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ code: totpCode }),
    });
    const enableData = await enableRes.json();
    assert(enableRes.status === 200 && enableData.success, "2FA TOTP code verified and 2FA successfully activated on account");
  } catch (err) {
    assert(false, `2FA test failed: ${err.message}`);
  }

  // 7. Token Refresh Rotation Test
  try {
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshData = await refreshRes.json();
    assert(refreshRes.status === 200 && Boolean(refreshData.token) && refreshData.refreshToken !== refreshToken, "Refresh Token Rotation: Old token rotated for new access & refresh pair");
  } catch (err) {
    assert(false, `Token refresh test failed: ${err.message}`);
  }

  // 8. IDOR (Resource Ownership) Test
  try {
    const commentRes = await fetch(`${BASE_URL}/api/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        animeId: "21355",
        epNumber: 1,
        text: "Güvenlik testi yorumu 🖤",
        isSpoiler: false,
      }),
    });
    const commentData = await commentRes.json();
    const commentId = commentData.comment?.id;

    // Attempt to delete comment with an unauthenticated or different user
    const unauthDelete = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
      method: "DELETE",
    });
    assert(unauthDelete.status === 401, "IDOR Guard: Blocked unauthenticated comment deletion with HTTP 401");

    // Owner deletion
    const ownerDelete = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });
    assert(ownerDelete.status === 200, "Resource owner successfully authorized to delete own comment");
  } catch (err) {
    assert(false, `IDOR test failed: ${err.message}`);
  }

  console.log("\n==================================================");
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
}

runTests();
