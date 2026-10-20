import { createClient } from "npm:@supabase/supabase-js@2";
import { SignJWT, jwtVerify } from "npm:jose@5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const adminSecret = Deno.env.get("ADMIN_JWT_SECRET")!;
const encoder = new TextEncoder();

async function claims(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("unauthorized");
  const { payload } = await jwtVerify(token, encoder.encode(adminSecret));
  return payload;
}
async function requireAdmin(req: Request) {
  const payload = await claims(req);
  if (payload.role !== "admin") throw new Error("forbidden");
  return payload;
}
async function userFor(req: Request) {
  const payload = await claims(req);
  if (typeof payload.sub !== "string" || payload.role === "admin") throw new Error("unauthorized");
  return payload.sub;
}
const day = (date: Date) => date.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const route = url.pathname.split("/").filter(Boolean).at(-1);
  try {
    if (req.method === "POST" && url.pathname.endsWith("/admin/login")) {
      const { email, password } = await req.json();
      if (email !== Deno.env.get("ADMIN_EMAIL") || password !== Deno.env.get("ADMIN_PASSWORD")) return json({ error: "邮箱或密码错误" }, 401);
      const token = await new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1d").sign(encoder.encode(adminSecret));
      return json({ success: true, token });
    }
    if (req.method === "POST" && route === "send-sms") {
      const { phone } = await req.json();
      if (!phone) return json({ error: "手机号不能为空" }, 400);
      // Supabase Auth sends and rate-limits OTPs using the SMS provider configured in the project.
      const { error } = await supabase.auth.signInWithOtp({ phone });
      return error ? json({ error: "短信发送失败，请稍后重试" }, 502) : json({ success: true, message: "验证码已发送" });
    }
    if (req.method === "POST" && route === "login-sms") {
      const { phone, code } = await req.json();
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: "sms" });
      if (error || !data.user) return json({ error: "验证码无效或已过期" }, 400);
      const { data: user, error: dbError } = await supabase.from("users").upsert({ phone, last_login_at: new Date().toISOString() }, { onConflict: "phone" }).select("*").single();
      if (dbError) throw dbError;
      const token = await new SignJWT({ phone, role: "user" }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime("7d").sign(encoder.encode(adminSecret));
      return json({ success: true, token, user });
    }
    if (req.method === "GET" && route === "me") {
      const id = await userFor(req);
      const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
      if (error) throw error;
      return json({ success: true, user: data });
    }
    if (req.method === "POST" && route === "learning-records") {
      const id = await userFor(req);
      const { action = "unknown", data = {}, duration_seconds = 0 } = await req.json();
      const { data: record, error } = await supabase.from("learning_records").insert({ user_id: id, action, data, duration_seconds: Math.max(0, Number(duration_seconds) || 0) }).select("*").single();
      if (error) throw error;
      return json({ success: true, record });
    }
    if (req.method === "POST" && route === "chat") return await chat(req);
    if (req.method === "GET" && route === "stats") { await requireAdmin(req); return json(await stats()); }
    if (req.method === "GET" && route === "users") {
      await requireAdmin(req);
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return json({ success: true, data });
    }
    if (req.method === "GET" && route === "learning-records" && url.pathname.includes("/admin/")) {
      await requireAdmin(req);
      const limit = Math.min(5000, Math.max(1, Number(url.searchParams.get("limit")) || 5000));
      const { data, error, count } = await supabase.from("learning_records").select("*, users(phone)", { count: "exact" }).order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      const records = data ?? [];
      return json({ success: true, data: records, stats: { total: count ?? 0, learn_word: records.filter((r) => r.action === "learn_word").length, quiz_perfect: records.filter((r) => r.action === "quiz_perfect").length, add_custom_word: records.filter((r) => r.action === "add_custom_word").length, total_duration: records.reduce((n, r) => n + (r.duration_seconds || 0), 0) } });
    }
    if (req.method === "GET" && route === "retention") { await requireAdmin(req); return json(await retention()); }
    if (req.method === "POST" && route === "stt") return await speechToText(req);
    return json({ error: "Not found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    if (message === "unauthorized") return json({ error: "未授权" }, 401);
    if (message === "forbidden") return json({ error: "无管理员权限" }, 403);
    console.error("API error:", message);
    return json({ error: "服务暂不可用，请稍后重试" }, 500);
  }
});

async function chat(req: Request) {
  const { messages, gradeLevel } = await req.json();
  if (!Array.isArray(messages)) return json({ error: "无效的消息格式" }, 400);
  const deepseek = Deno.env.get("DEEPSEEK_API_KEY");
  const openai = Deno.env.get("OPENAI_API_KEY");
  const key = deepseek || openai;
  if (!key) return json({ success: true, reply: "Hi! Please configure an AI API key in the backend to start a real conversation." });
  const grade = ({ primary1: "1st grade, very simple words", primary2: "2nd grade", primary3: "3rd grade", primary4: "4th grade", primary5: "5th grade", primary6: "6th grade", junior1: "7th grade", junior2: "8th grade", junior3: "9th grade", senior1: "10th grade", senior2: "11th grade", senior3: "12th grade" } as Record<string, string>)[gradeLevel] || "beginner";
  const response = await fetch(deepseek ? "https://api.deepseek.com/chat/completions" : "https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: deepseek ? "deepseek-chat" : "gpt-3.5-turbo", messages: [{ role: "system", content: `You are a friendly English speaking partner for a ${grade} student. Keep replies to 1-3 sentences.` }, ...messages] }) });
  const result = await response.json();
  if (!response.ok || !result.choices?.length) return json({ error: "请求 AI 服务失败，请稍后再试" }, 502);
  return json({ success: true, reply: result.choices[0].message.content });
}

async function speechToText(req: Request) {
  const apiKey = Deno.env.get("BAIDU_API_KEY"), secretKey = Deno.env.get("BAIDU_SECRET_KEY");
  if (!apiKey || !secretKey) return json({ success: false, error: "语音识别服务尚未配置" }, 503);
  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size > 8 * 1024 * 1024) return json({ success: false, error: "音频文件无效或超过 8MB" }, 400);
  const tokenResponse = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`, { method: "POST" });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) throw new Error("Speech provider token request failed");
  const bytes = new Uint8Array(await audio.arrayBuffer());
  // Input from the website is a mono, 16 kHz, 16-bit PCM WAV produced in-browser.
  if (audio.type !== "audio/wav" || bytes.length < 44) return json({ success: false, error: "音频格式不支持，请重试" }, 400);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  const body = { format: "wav", rate: 16000, channel: 1, cuid: "wheatspace-user", token: tokenData.access_token, speech: btoa(binary), len: bytes.length };
  const response = await fetch("https://vop.baidu.com/server_api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (result.err_no === 0 && result.result?.length) return json({ success: true, text: result.result[0] });
  return json({ success: false, error: "语音识别失败，请重试" }, 502);
}

async function stats() {
  const [{ count: totalUsers }, { data: users }, { data: records }] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id,phone,created_at,last_login_at").order("last_login_at", { ascending: false }).limit(10000),
    supabase.from("learning_records").select("user_id,action,duration_seconds,created_at").limit(100000),
  ]);
  const us = users ?? [], rs = records ?? [], today = day(new Date()), yesterday = day(new Date(Date.now() - 86400000));
  const todayRecords = rs.filter((r) => r.created_at.startsWith(today));
  const daily = (d: string) => new Set(rs.filter((r) => r.created_at.startsWith(d)).map((r) => r.user_id)).size;
  const dauHistory: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) dauHistory[day(new Date(Date.now() - i * 86400000))] = daily(day(new Date(Date.now() - i * 86400000)));
  const actions: Record<string, number> = {}; rs.forEach((r) => actions[r.action] = (actions[r.action] || 0) + 1);
  const totalDuration = rs.reduce((n, r) => n + (r.duration_seconds || 0), 0), activeDays = new Set(rs.map((r) => `${r.user_id}_${r.created_at.slice(0, 10)}`)).size, dau = new Set(todayRecords.map((r) => r.user_id)).size;
  return { totalUsers: totalUsers ?? 0, dau, yesterdayRecordsCount: rs.filter((r) => r.created_at.startsWith(yesterday)).length, newWeek: us.filter((u) => u.created_at >= new Date(Date.now() - 7 * 86400000).toISOString()).length, recentUsers: us.slice(0, 10), dauHistory, actions, totalDuration, todayDuration: todayRecords.reduce((n, r) => n + (r.duration_seconds || 0), 0), avgTodayDuration: dau ? Math.floor(todayRecords.reduce((n, r) => n + (r.duration_seconds || 0), 0) / dau) : 0, avgDailyDuration: activeDays ? Math.floor(totalDuration / activeDays) : 0 };
}

async function retention() {
  const [{ data: users }, { data: records }] = await Promise.all([supabase.from("users").select("id,created_at").limit(100000), supabase.from("learning_records").select("user_id,created_at").limit(100000)]);
  const us = users ?? [], rs = records ?? [];
  const calc = (days: number) => {
    const cohortDay = day(new Date(Date.now() - (days + 1) * 86400000)), targetDay = day(new Date(Date.now() - 86400000));
    const cohort = us.filter((u) => u.created_at.startsWith(cohortDay));
    if (!cohort.length) return "—";
    const ids = new Set(cohort.map((u) => u.id));
    const retained = new Set(rs.filter((r) => ids.has(r.user_id) && r.created_at >= targetDay).map((r) => r.user_id));
    return `${Math.round(retained.size / cohort.length * 100)}%`;
  };
  const growth: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) { const d = day(new Date(Date.now() - i * 86400000)); growth[d] = us.filter((u) => u.created_at.startsWith(d)).length; }
  return { d1: calc(1), d7: calc(7), d30: calc(30), growth };
}
