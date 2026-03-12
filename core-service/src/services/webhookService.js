const http = require("http");
const https = require("https");
const { URL } = require("url");

function postJson(urlString, body) {
  return new Promise((resolve, reject) => {
    if (!urlString) return resolve();
    let parsed;
    try {
      parsed = new URL(urlString);
    } catch (err) {
      console.error("[webhook] Invalid URL:", urlString);
      return resolve();
    }

    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    const data = JSON.stringify(body);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + (parsed.search || ""),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 5000,
    };

    const req = client.request(options, (res) => {
      // Drain response to free up memory
      res.on("data", () => {});
      res.on("end", () => resolve());
    });

    req.on("error", (err) => {
      console.error("[webhook] Request error:", err.message);
      resolve(); // fail silently, do not reject to avoid breaking business flow
    });

    req.on("timeout", () => {
      req.destroy();
      console.error("[webhook] Request timeout");
      resolve();
    });

    req.write(data);
    req.end();
  });
}

async function notifyTaskCompleted(task) {
  const url = process.env.WEBHOOK_TASK_COMPLETED_URL;
  if (!url || !task) return;

  const payload = {
    type: "TASK_COMPLETED",
    taskId: task.id || task._id?.toString(),
    title: task.title,
    assigneeId: task.assigneeId,
    assigneeName: task.assigneeName,
    assignerId: task.assignerId,
    assignerName: task.assignerName,
    completedAt: task.completedAt || new Date().toISOString(),
    status: task.status,
  };

  await postJson(url, payload);
}

module.exports = {
  notifyTaskCompleted,
};

