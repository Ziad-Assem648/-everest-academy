const BASE = "http://localhost:5000/api";
async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const json = await res.json();
  return json;
}

async function test() {
  const ts = Date.now();
  // 1. Register
  const reg = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name: "Test", email: `t${ts}@t.com`, password: "test123" })
  });
  console.log("Register:", JSON.stringify(reg).slice(0, 200));

  // 2. Admin login
  const admin = await api("/admin-auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin1@everest.com", password: "admin123" })
  });
  console.log("Admin login:", !!admin.session_token);
  const H = { "x-user-id": admin.user.id, "x-session-token": admin.session_token };

  // 3. Upgrade
  const upRes = await api(`/users/${reg.user.id}/upgrade-account`, {
    method: "POST",
    headers: H
  });
  console.log("Upgrade:", JSON.stringify(upRes));

  // 4. Login as user
  const login = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: `t${ts}@t.com`, password: "test123" })
  });
  console.log("Login:", JSON.stringify(login).slice(0, 300));
  console.log("Login user rank:", login.user?.rank);
  console.log("Login error:", login.error);
}

test().catch(e => console.error("ERROR:", e));
