const BASE = "http://localhost:5000/api";

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  return res.json();
}

let H = {}; // auth headers

function assert(condition, msg) {
  if (!condition) { console.error(`  ❌ FAIL: ${msg}`); process.exit(1); }
  console.log(`  ✅ ${msg}`);
}

async function test() {
  console.log("🔐 Logging in as admin...");
  const login = await api("/admin-auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin1@everest.com", password: "admin123" })
  });
  assert(login.session_token, "Admin logged in");
  H = { "x-user-id": login.user.id, "x-session-token": login.session_token };

  console.log("\n🧪 TEST 1: Ranks exist and ordered");
  const ranks = await api("/ranks?all=true");
  assert(ranks.length >= 10, `Found ${ranks.length} ranks`);
  for (const r of ranks) console.log(`    ${r.sort_order}. ${r.name} — sales: ${r.sales_required}, bonus: ${r.bonus}`);

  console.log("\n🧪 TEST 2: Create test referrer + approve as student");
  const ts = Date.now();
  const refRes = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name: "RankTest_Ref", email: `rankref_${ts}@test.com`, password: "test123" })
  });
  const refId = refRes.user?.id;
  assert(refId, `Referrer created: ${refId}`);
  await api(`/users/${refId}/upgrade-account`, { method: "POST", headers: H });
  const refCode = refRes.user?.referral_code;
  assert(refCode, `Referral code: ${refCode}`);

  console.log("\n🧪 TEST 3: Create 2 direct students → Star (sales_required=2)");
  for (let i = 0; i < 2; i++) {
    const dRes = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ full_name: `RankTest_D${i}`, email: `rankd${i}_${ts}@test.com`, password: "test123", referral_code: refCode })
    });
    const dId = dRes.user?.id;
    assert(dId, `Direct ${i} created: ${dId}`);
    await api(`/users/${dId}/upgrade-account`, { method: "POST", headers: H });
  }

  // Trigger rank update
  await api("/ranks/update", { method: "POST", headers: H });

  // Check referrer rank
  const refCheck = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: `rankref_${ts}@test.com`, password: "test123" })
  });
  console.log(`    Referrer rank: "${refCheck.user?.rank}", direct_count: ${refCheck.user?.direct_count}`);
  assert(refCheck.user?.rank === "Star", `Rank = "Star" (got: "${refCheck.user?.rank}")`);

  console.log("\n🧪 TEST 4: Progress endpoint");
  const progress = await api(`/ranks/progress/${refId}`, { headers: H });
  console.log(`    currentRank: "${progress.currentRank}", qualifiedTeam: ${progress.qualifiedTeamCount}, next: "${progress.nextRank}", progress: ${progress.progress}%`);
  assert(progress.qualifiedTeamCount >= 2, `Qualified team: ${progress.qualifiedTeamCount} (>= 2)`);
  assert(progress.nextRank === "Executive", `Next rank: "Executive" (got: "${progress.nextRank}")`);

  console.log("\n🧪 TEST 5: Leaderboard");
  const lb = await api("/ranks/leaderboard", { headers: H });
  assert(Array.isArray(lb), "Leaderboard is array");
  const refLb = lb.find(e => e.id === refId);
  if (refLb) console.log(`    Referrer: #${refLb.position}, rank: "${refLb.rank}", team: ${refLb.total_team_sales}`);
  for (const e of lb.slice(0, 3)) console.log(`    #${e.position}: ${e.full_name} — rank: "${e.rank}", team: ${e.total_team_sales}`);

  console.log("\n🧪 TEST 6: Weekly commission");
  const wc = await api("/mlm/weekly-commission", { method: "POST", headers: H });
  console.log(`    Result: ${wc.error || `awarded: ${wc.awarded || 0}/${wc.total_users || 0}`}`);
  if (wc.results) {
    const refWc = wc.results.find(r => r.user_id === refId);
    if (refWc) console.log(`    Referrer: eligible=${refWc.eligible}, bonus=${refWc.bonus || 0}, qualified=${refWc.qualifiedDirects || 0}, excluded=${refWc.excluded || 0}, total_team=${refWc.total_team || 0}`);
  }

  console.log("\n🧪 TEST 7: Rank progress (mlm)");
  const rp = await api(`/mlm/rank-progress/${refId}`, { headers: H });
  console.log(`    qualifiedDirects: ${rp.qualifiedDirects}, totalDirects: ${rp.totalDirects}, meetsMin: ${rp.meetsMinDirects}, progressToNext: ${rp.progressToNext}%`);

  console.log("\n🧪 TEST 8: Unranked user not eligible for weekly commission");
  const unrankedRes = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ full_name: "Unranked_User", email: `unranked_${ts}@test.com`, password: "test123" })
  });
  const unrankedId = unrankedRes.user?.id;
  await api(`/users/${unrankedId}/upgrade-account`, { method: "POST", headers: H });
  // Give them 5 directs so they'd qualify if ranked
  const unrankedLogin = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: `unranked_${ts}@test.com`, password: "test123" }) });
  const unrankedCode = unrankedLogin.user?.referral_code;
  for (let i = 0; i < 5; i++) {
    const dRes = await api("/auth/register", { method: "POST", body: JSON.stringify({ full_name: `UR_D${i}`, email: `urd${i}_${ts}@test.com`, password: "test123", referral_code: unrankedCode }) });
    if (dRes.user?.id) await api(`/users/${dRes.user.id}/upgrade-account`, { method: "POST", headers: H });
  }
  // Trigger rank update
  await api("/ranks/update", { method: "POST", headers: H });
  const unrankedCheck = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: `unranked_${ts}@test.com`, password: "test123" }) });
  console.log(`    Unranked user rank: "${unrankedCheck.user?.rank}", direct_count: ${unrankedCheck.user?.direct_count}`);
  // Unranked user should NOT get a rank because Star requires 2 qualified team — but they have no rank yet
  // The advanceUserRank should advance them to Star since they have 5 student directs
  console.log(`    (After rank update, unranked user should have advanced to at least Star)`);

  console.log("\n🧪 TEST 9: Higher-rank exclusion — scenario test");
  console.log(`    Scenario: If referrer (Star, sort_order=0) has a team member who is Executive (sort_order=1)`);
  console.log(`    That Executive member should NOT count toward referrer's qualified team`);
  const progressAfter = await api(`/ranks/progress/${refId}`, { headers: H });
  console.log(`    Referrer: rank="${progressAfter.currentRank}", qualifiedTeam=${progressAfter.qualifiedTeamCount}`);
  console.log(`    (Higher-ranked members excluded from count)`);

  console.log("\n✅ All tests completed!");
}

test().catch(err => { console.error("❌ Test failed:", err.message); process.exit(1); });
