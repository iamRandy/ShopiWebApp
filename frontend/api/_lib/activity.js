// A note that someone used Chaos today, and where: the iPhone app or the
// website. The admin dashboard (the Chaos repo, web/) reads these to tell the
// two apart, since both sign in the same way and call the same routes.
//
// One row per person, per day (UTC), per platform, in `activity`:
//   { _id: "2026-11-19|ios|<sub>", sub, platform, day, first, last, count }
// so it grows with active people, not with requests.
//
// The browser extension never calls this API (it saves through its Render
// server), so it has no rows here; the dashboard counts its saves instead.
//
// Never lets a request fail: a missed note costs a dot on a chart, a failed
// launch costs a user.

/** "ios" for the iPhone app and its share extension, "web" for a browser. */
function platformOf(req) {
  const agent = String(req.headers?.["user-agent"] || "");
  // URLSession sends "Chaos/1 CFNetwork/… Darwin/…" (or ChaosShare/…).
  if (/CFNetwork|Darwin/.test(agent) && !/Mozilla/.test(agent)) return "ios";
  if (/Mozilla/.test(agent)) return "web";
  return null;
}

async function recordVisit(db, sub, req) {
  try {
    const platform = platformOf(req);
    if (!db || !sub || !platform) return;
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    await db.collection("activity").updateOne(
      { _id: `${day}|${platform}|${sub}` },
      {
        $setOnInsert: { sub, platform, day, first: now },
        $set: { last: now },
        $inc: { count: 1 },
      },
      { upsert: true }
    );
  } catch (error) {
    console.error("recordVisit failed:", error);
  }
}

module.exports = { platformOf, recordVisit };
