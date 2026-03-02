let quill;
document.addEventListener("DOMContentLoaded", () => {
  const Link = Quill.import("formats/link");
  const originalSanitize = Link.sanitize;
  Link.sanitize = function (url) {
    if (!url) return "";
    let value = url.trim();

    if (/^(https?:\/\/|mailto:|tel:|#|\/)/.test(value)) {
    } else if (value.indexOf(".") > -1 && value.indexOf(" ") === -1) {
      value = "https://" + value;
    }

    return originalSanitize ? originalSanitize(value) : value;
  };

  quill = new Quill("#editor-container", {
    theme: "snow",
    placeholder: "Write your article content here...",
    modules: {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    },
  });

  function imageHandler() {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        await uploadAndInsertImage(file);
      }
    };
  }

  quill.root.addEventListener("paste", async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    if (
      clipboardData &&
      clipboardData.files &&
      clipboardData.files.length > 0
    ) {
      e.preventDefault();
      const file = clipboardData.files[0];
      if (file.type.startsWith("image/")) {
        await uploadAndInsertImage(file);
      }
    }
  });

  async function uploadAndInsertImage(file) {
    const range = quill.getSelection(true);

    quill.insertText(range.index, "Uploading image...", "bold", true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabaseClient.storage
        .from("blog-images")
        .upload(filePath, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabaseClient.storage.from("blog-images").getPublicUrl(filePath);

      quill.deleteText(range.index, "Uploading image...".length);
      quill.insertEmbed(range.index, "image", publicUrl);
    } catch (error) {
      // console.error("Upload failed:", error);
      quill.deleteText(range.index, "Uploading image...".length);
      alert("Image upload failed: " + error.message);
    }
  }

  const urlRegex =
    /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}(\/[^\s]*)?)/g;

  quill.on("text-change", function (delta, oldDelta, source) {
    if (source !== "user") return;

    const range = quill.getSelection();
    if (!range) return;

    const leaf = quill.getLeaf(range.index - 1)[0];
    if (!leaf || !leaf.text) return;

    const lastChar = leaf.text.slice(-1);
    if (!/\s/.test(lastChar)) return;

    const [line, offset] = quill.getLine(range.index);
    const text = line.domNode.textContent;

    const words = text.split(/\s+/);

    const lastWord = words[words.length - 2];

    if (lastWord && urlRegex.test(lastWord)) {
      let urlToCheck = lastWord;
      if (!urlToCheck.match(/^https?:\/\//i)) {
        if (urlToCheck.match(/^www\./) || urlToCheck.indexOf(".") > -1) {
          urlToCheck = "https://" + urlToCheck;
        }
      }

      const index = range.index - lastWord.length - 1;
      const format = quill.getFormat(index, lastWord.length);

      if (!format.link) {
        quill.formatText(index, lastWord.length, "link", urlToCheck, "api");
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const dashboard = document.getElementById("dashboard-section");
  const authMsg = document.createElement("div");

  try {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();
    if (error || !session) {
      window.location.href = "login.html";
      return;
    }

    // Valid session
    if (dashboard) dashboard.classList.remove("hidden");
    fetchPosts();

    // Watch auth state — only redirect on explicit sign-out, not initial load
    supabaseClient.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        window.location.href = "login.html";
      }
    });
  } catch (err) {
    if (dashboard) dashboard.classList.add("hidden");
    authMsg.innerHTML = `<div style="text-align:center; padding: 4rem; max-width: 600px; margin: 0 auto; margin-top: 10%;">
      <h2 style="font-family: var(--font-heading); color: var(--text-main); margin-bottom: 1rem;">Network Error</h2>
      <p style="color: var(--text-muted); line-height: 1.6;">Failed to connect to the authentication server at Supabase. This is typically caused by aggressive ad-blockers (like uBlock Origin, Brave Shields) or university/corporate Wi-Fi networks blocking outgoing API connections.</p>
      <br><p style="color: #ef4444; font-weight: 600;">Error: ${err.message}</p>
    </div>`;
    document.body.appendChild(authMsg);
  }
});
window.switchView = function (viewId) {
  const views = [
    "dashboard",
    "blogs",
    "analytics",
    "subscribers",
    "messages",
    "comments",
    "files",
    "settings",
  ];
  views.forEach((id) => {
    document.getElementById(`view-${id}`).classList.add("hidden");
    document.getElementById(`nav-${id}`).classList.remove("active");
  });

  document.getElementById(`view-${viewId}`).classList.remove("hidden");
  document.getElementById(`nav-${viewId}`).classList.add("active");

  if (viewId === "dashboard") {
    allPageViews = [];
    loadDashboardAnalytics(currentRange);
  }
  if (viewId === "blogs") {
    fetchPosts();
  }
  if (viewId === "analytics") {
    fetchAnalytics();
  }
  if (viewId === "subscribers") {
    fetchSubscribers();
  }
  if (viewId === "messages") {
    fetchMessages();
  }
  if (viewId === "comments") {
    fetchComments();
  }
  if (viewId === "files") {
    fetchFiles();
  }
};

let allPosts = [];

// Search filter for blog articles
const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allPosts.filter((p) =>
      p.title.toLowerCase().includes(term),
    );
    renderTable(filtered);
  });
}

async function signOut() {
  await supabaseClient.auth.signOut();
}

async function fetchPosts() {
  let posts = [];
  try {
    const { data, error } = await supabaseClient
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching posts:", error);
      return;
    }
    posts = data || [];
  } catch (err) {
    console.warn("Network error fetching posts:", err.message);
    return;
  }

  allPosts = posts;
  updateStats(posts);
  renderTable(posts);
  loadDashboardAnalytics(currentRange);
  if (!document.getElementById("view-analytics").classList.contains("hidden")) {
    fetchAnalytics();
  }
}

async function fetchAnalytics() {
  const container = document.getElementById("analytics-dashboard");

  if (!container) return;

  let rawViews = [];
  try {
    const { data, error: viewError } = await supabaseClient
      .from("page_views")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (viewError) {
      container.innerHTML = `<div class="error-msg">Error loading analytics: ${viewError.message}</div>`;
      return;
    }
    rawViews = data || [];
  } catch (err) {
    container.innerHTML = `<div class="error-msg">Network Error loading analytics: ${err.message}</div>`;
    return;
  }

  const views = rawViews.filter((v) => {
    const isLocalPath =
      v.page_path &&
      (v.page_path.includes("127.0.0.1") || v.page_path.includes("localhost"));
    const isLocalRef =
      v.referrer &&
      (v.referrer.includes("127.0.0.1") || v.referrer.includes("localhost"));
    return !isLocalPath && !isLocalRef;
  });

  if (views.length === 0) {
    container.innerHTML =
      '<div style="text-align: center; padding: 4rem; color: var(--text-muted);">No production traffic recorded yet.</div>';
    return;
  }

  const totalViews = views.length;
  const uniqueUsers = new Set(views.map((v) => v.tracking_id)).size;

  const today = new Date().toDateString();
  const viewsToday = views.filter(
    (v) => new Date(v.created_at).toDateString() === today,
  ).length;

  const pages = {};

  const referrers = {};

  const devices = { Desktop: 0, Mobile: 0 };

  views.forEach((v) => {
    const path = v.page_path || "/";
    if (!pages[path]) {
      pages[path] = {
        title: formatPathTitle(path),
        views: 0,
        visitors: new Set(),
      };
    }
    pages[path].views++;
    if (v.tracking_id) pages[path].visitors.add(v.tracking_id);

    let ref = v.referrer;
    if (!ref || ref === "Direct" || ref === "") {
      ref = "Direct / None";
    } else {
      try {
        const url = new URL(ref);
        ref = url.hostname.replace("www.", "");
      } catch (e) {
        ref = "Unknown";
      }
    }
    referrers[ref] = (referrers[ref] || 0) + 1;

    if (v.user_agent) {
      const ua = v.user_agent.toLowerCase();
      if (
        ua.includes("mobile") ||
        ua.includes("android") ||
        ua.includes("iphone")
      ) {
        devices.Mobile++;
      } else {
        devices.Desktop++;
      }
    } else {
      devices.Desktop++;
    }
  });

  const articleRows = [];
  const pageRows = [];

  Object.entries(pages).forEach(([path, stats]) => {
    const isArticle = path.includes("/pulse") || path.includes("?slug=");
    const data = {
      path,
      title: stats.title,
      views: stats.views,
      unique: stats.visitors.size,
    };
    if (isArticle) articleRows.push(data);
    else pageRows.push(data);
  });

  articleRows.sort((a, b) => b.views - a.views);
  pageRows.sort((a, b) => b.views - a.views);
  const topReferrers = Object.entries(referrers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  let html = "";

  html += `
      <div class="stats-container">
          <div class="stat-box">
             <div class="stat-icon"><i data-lucide="activity"></i></div>
             <div><div class="stat-value">${totalViews}</div><div class="stat-label">Real Views (Last 200)</div></div>
          </div>
          <div class="stat-box">
             <div class="stat-icon"><i data-lucide="users"></i></div>
             <div><div class="stat-value">${uniqueUsers}</div><div class="stat-label">Active Users</div></div>
          </div>
          <div class="stat-box">
             <div class="stat-icon" style="background:#dcfce7; color:#16a34a"><i data-lucide="calendar"></i></div>
             <div><div class="stat-value">${viewsToday}</div><div class="stat-label">Views Today</div></div>
          </div>
      </div>
    `;

  html += `<div class="analytics-section-title"><i data-lucide="file-text" size="20"></i> Top Articles</div>`;
  if (articleRows.length > 0) {
    html += `<div class="content-grid">`;
    articleRows.slice(0, 6).forEach((p) => {
      html += `
            <div class="article-tile">
                <div class="tile-header">${p.title}</div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom: auto;">${p.path}</div>
                <div class="tile-stats">
                    <div class="tile-stat-item"><span class="tile-stat-value">${p.views}</span> Views</div>
                    <div class="tile-stat-item"><span class="tile-stat-value">${p.unique}</span> Unique</div>
                </div>
            </div>
            `;
    });
    html += `</div>`;
  } else {
    html += `<p style="color:var(--text-muted); margin-bottom: 2rem;">No article data available.</p>`;
  }

  html += `
      <div class="split-grid" style="margin-top: 2rem;">
          <!-- Top Pages -->
          <div>
               <div class="analytics-section-title"><i data-lucide="layout" size="20"></i> Top Pages</div>
               <div class="list-group">
                  ${pageRows
                    .slice(0, 5)
                    .map(
                      (p) => `
                      <div class="list-item">
                          <div style="display:flex; flex-direction:column;">
                               <span style="font-weight:600">${p.title}</span>
                               <span style="font-size:0.8rem; color:var(--text-muted)">${p.path}</span>
                          </div>
                          <div style="text-align:right">
                               <div style="font-weight:700">${p.views}</div>
                               <div style="font-size:0.75rem; color:var(--text-muted)">views</div>
                          </div>
                      </div>
                  `,
                    )
                    .join("")}
                  ${pageRows.length === 0 ? '<div style="padding:1rem">No page data.</div>' : ""}
               </div>
          </div>
  
          <!-- Audience / Referrers -->
          <div>
               <div class="analytics-section-title"><i data-lucide="globe" size="20"></i> Top Sources</div>
               <div class="list-group">
                  ${topReferrers
                    .map(([ref, count]) => {
                      const percent = Math.round((count / totalViews) * 100);
                      return `
                      <div class="list-item">
                          <div class="progress-bg" style="width: ${percent}%"></div>
                          <div class="list-content">
                              <span>${ref}</span>
                              <span style="font-weight:600">${count}</span>
                          </div>
                      </div>
                      `;
                    })
                    .join("")}
                  ${topReferrers.length === 0 ? '<div style="padding:1rem">No referrer data.</div>' : ""}
               </div>
               
               <!-- Device Stats -->
               <div class="analytics-section-title" style="margin-top: 2rem;"><i data-lucide="smartphone" size="20"></i> Devices</div>
                <div class="list-group">
                   <div class="list-item"><span>Desktop</span> <span style="font-weight:600">${devices.Desktop}</span></div>
                   <div class="list-item"><span>Mobile</span> <span style="font-weight:600">${devices.Mobile}</span></div>
                </div>
          </div>
      </div>
    `;

  container.innerHTML = html;
  if (typeof lucide !== "undefined") lucide.createIcons();
}

function formatPathTitle(path) {
  if (!path || path === "/" || path === "/index.html") return "Home";

  const urlObj = new URL(path, "https://example.com");
  const slug = urlObj.searchParams.get("slug");

  if (slug) {
    return slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  let p = urlObj.pathname.replace(".html", "").replace(/^\/+|\/+$/g, "");
  if (p === "") return "Home";

  return p
    .split("/")
    .map((w) => w.replace(/-/g, " "))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" › ");
}

async function fetchVisitorStats() {
  const { count, error } = await supabaseClient
    .from("visitors")
    .select("*", { count: "exact", head: true });

  if (!error) {
    const el = document.getElementById("total-visitors");
    if (el) el.textContent = count;
  }
}

async function updateStats(posts) {
  const postsEl = document.getElementById("total-posts");
  if (postsEl) postsEl.textContent = posts.length;
}

// Dashboard Analytics with Date Filtering
let dashboardChart = null;
let allPageViews = [];
let currentRange = "today";

async function loadDashboardAnalytics(range) {
  currentRange = range || currentRange;

  // Update active button
  document.querySelectorAll(".date-filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.range === currentRange);
  });

  // Fetch all page views if not cached
  if (allPageViews.length === 0) {
    try {
      const { data, error } = await supabaseClient
        .from("page_views")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) return;

      allPageViews = (data || []).filter((v) => {
        const isLocal =
          (v.page_path &&
            (v.page_path.includes("127.0.0.1") ||
              v.page_path.includes("localhost"))) ||
          (v.referrer &&
            (v.referrer.includes("127.0.0.1") ||
              v.referrer.includes("localhost")));
        return !isLocal;
      });
    } catch (err) {
      console.warn("Network error fetching dashboard analytics:", err.message);
      return;
    }
  }

  // Calculate date range
  const now = new Date();
  let startDate;

  switch (currentRange) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "year":
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case "all":
    default:
      startDate = new Date(0);
      break;
  }

  const filtered = allPageViews.filter(
    (v) => new Date(v.created_at) >= startDate,
  );

  // Stats
  const totalViews = filtered.length;
  const uniqueVisitors = new Set(filtered.map((v) => v.tracking_id)).size;

  // Group by date
  const dailyMap = {};
  filtered.forEach((v) => {
    const d = new Date(v.created_at).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!dailyMap[d]) dailyMap[d] = { views: 0, visitors: new Set() };
    dailyMap[d].views++;
    if (v.tracking_id) dailyMap[d].visitors.add(v.tracking_id);
  });

  const days = Object.keys(dailyMap);
  const avgDaily = days.length > 0 ? Math.round(totalViews / days.length) : 0;

  // Update stat cards
  const pvEl = document.getElementById("dash-page-views");
  if (pvEl) pvEl.textContent = totalViews;
  const uvEl = document.getElementById("dash-unique-visitors");
  if (uvEl) uvEl.textContent = uniqueVisitors;
  const avgEl = document.getElementById("dash-avg-daily");
  if (avgEl) avgEl.textContent = avgDaily;

  // Chart
  const chartLabels = days.reverse();
  const chartData = chartLabels.map((d) => dailyMap[d].views);

  const ctx = document.getElementById("dashboardChart");
  if (ctx) {
    if (dashboardChart) dashboardChart.destroy();
    dashboardChart = new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: "Page Views",
            data: chartData,
            backgroundColor: "rgba(37, 99, 235, 0.7)",
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  // Top pages
  const pages = {};
  filtered.forEach((v) => {
    const path = v.page_path || "/";
    if (!pages[path]) pages[path] = { views: 0 };
    pages[path].views++;
  });

  const topPagesEl = document.getElementById("dash-top-pages");
  if (topPagesEl) {
    const sorted = Object.entries(pages)
      .sort(([, a], [, b]) => b.views - a.views)
      .slice(0, 5);
    if (sorted.length === 0) {
      topPagesEl.innerHTML =
        '<div style="color: var(--text-muted);">No data for this period.</div>';
    } else {
      topPagesEl.innerHTML = sorted
        .map(
          ([path, data]) =>
            `<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
              <span style="font-weight: 500; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${formatPathTitle(path)}</span>
              <span style="font-weight: 700; color: var(--text-main);">${data.views}</span>
            </div>`,
        )
        .join("");
    }
  }

  // Top referrers
  const refs = {};
  filtered.forEach((v) => {
    let ref = v.referrer;
    if (!ref || ref === "" || ref === "Direct") ref = "Direct";
    else {
      try {
        ref = new URL(ref).hostname.replace("www.", "");
      } catch (e) {
        ref = "Unknown";
      }
    }
    refs[ref] = (refs[ref] || 0) + 1;
  });

  const topRefsEl = document.getElementById("dash-top-referrers");
  if (topRefsEl) {
    const sorted = Object.entries(refs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    if (sorted.length === 0) {
      topRefsEl.innerHTML =
        '<div style="color: var(--text-muted);">No data for this period.</div>';
    } else {
      topRefsEl.innerHTML = sorted
        .map(
          ([ref, count]) =>
            `<div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
              <span style="font-weight: 500;">${ref}</span>
              <span style="font-weight: 700; color: var(--text-main);">${count}</span>
            </div>`,
        )
        .join("");
    }
  }

  // Daily breakdown table
  const dailyBody = document.getElementById("dash-daily-body");
  if (dailyBody) {
    const sortedDays = Object.entries(dailyMap).sort(
      ([a], [b]) => new Date(b) - new Date(a),
    );
    if (sortedDays.length === 0) {
      dailyBody.innerHTML =
        '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">No data for this period.</td></tr>';
    } else {
      dailyBody.innerHTML = sortedDays
        .map(
          ([date, data]) =>
            `<tr>
              <td style="font-weight: 500;">${date}</td>
              <td>${data.views}</td>
              <td>${data.visitors.size}</td>
            </tr>`,
        )
        .join("");
    }
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
}

// Date filter button clicks
document.querySelectorAll(".date-filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    allPageViews = []; // Force refresh data on filter change
    loadDashboardAnalytics(btn.dataset.range);
  });
});

function renderTable(posts) {
  const tbody = document.getElementById("posts-body");
  const emptyState = document.getElementById("empty-state");
  tbody.innerHTML = "";

  if (posts.length === 0) {
    emptyState.style.display = "block";
    return;
  } else {
    emptyState.style.display = "none";
  }

  posts.forEach((post) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>
                <div style="font-weight: 600; font-size: 1rem;">${post.title}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">/pulse/${post.slug || ""}</div>
            </td>
            <td>${new Date(post.created_at).toLocaleDateString()}</td>
            <td>${post.views || 0}</td>
            <td style="text-align: right;">
                <button class="icon-btn" title="Stats" onclick="openStatsModal('${post.slug}', '${post.title.replace(/'/g, "\\'")}', ${post.views || 0})" style="margin-right: 0.5rem;"><i data-lucide="bar-chart-2" size="16"></i></button>
                <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="editPost('${post.id}')"><i data-lucide="pencil" size="14"></i> Edit</button>
                <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-left: 0.5rem;" onclick="deletePost('${post.id}')"><i data-lucide="trash-2" size="14"></i></button>
            </td>
        `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

let statsChart = null;

async function openStatsModal(slug, title, totalViews) {
  const modal = document.getElementById("stats-modal");
  document.getElementById("stats-modal-title").textContent = title;
  document.getElementById("stats-total-views").textContent = totalViews;
  document.getElementById("stats-unique-visitors").textContent = "Loading...";
  modal.classList.add("active");

  const pagePath = `/pulse/?slug=${slug}`;
  const { data: views, error } = await supabaseClient
    .from("page_views")
    .select("created_at, tracking_id")
    .ilike("page_path", `${pagePath}%`)
    .order("created_at", { ascending: true });

  if (error) {
    // console.error("Error fetching stats:", error);
    document.getElementById("stats-unique-visitors").textContent = "N/A";
    return;
  }

  const uniqueVisitors = new Set(views.map((v) => v.tracking_id)).size;
  document.getElementById("stats-unique-visitors").textContent = uniqueVisitors;

  const grouped = {};
  views.forEach((v) => {
    const date = new Date(v.created_at).toLocaleDateString();
    grouped[date] = (grouped[date] || 0) + 1;
  });

  const labels = Object.keys(grouped);
  const dataPoints = Object.values(grouped);

  const ctx = document.getElementById("viewsChart").getContext("2d");
  if (statsChart) statsChart.destroy();

  statsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Views",
          data: dataPoints,
          backgroundColor: "#2563eb",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

window.closeStatsModal = function () {
  document.getElementById("stats-modal").classList.remove("active");
};

document.getElementById("search-input").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const filtered = allPosts.filter((p) => p.title.toLowerCase().includes(term));
  renderTable(filtered);
});

const modal = document.getElementById("post-modal");
const form = document.getElementById("post-form");
const imageInput = document.getElementById("p-image");
const imagePreview = document.getElementById("image-preview");

imageInput.addEventListener("input", () => {
  const url = imageInput.value;
  if (url) {
    imagePreview.src = url;
    imagePreview.style.display = "block";
  } else {
    imagePreview.style.display = "none";
    imagePreview.src = "";
  }
});

function openModal(isEdit = false) {
  modal.classList.add("active");
  document.getElementById("modal-title").textContent = isEdit
    ? "Edit Article"
    : "Create Article";

  if (!isEdit) {
    form.reset();
    document.getElementById("post-id").value = "";
    quill.root.innerHTML = "";
    imagePreview.style.display = "none";
    imagePreview.src = "";
  }
}

function closeModal() {
  modal.classList.remove("active");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, 3000);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("post-id").value;
  const title = document.getElementById("p-title").value;
  const excerpt = document.getElementById("p-excerpt").value;

  const content = quill.root.innerHTML;

  const image_url = document.getElementById("p-image").value;
  const file_url = document.getElementById("p-file").value;
  const btn = document.getElementById("save-btn");

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    alert("You must be logged in to save posts.");
    return;
  }

  const originalText = btn.textContent;
  btn.textContent = "Saving...";
  btn.disabled = true;

  const postData = { title, excerpt, content, image_url, file_url };

  let error = null;

  if (id) {
    const { error: err } = await supabaseClient
      .from("posts")
      .update(postData)
      .eq("id", id);
    error = err;
  } else {
    postData.slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: newPost, error: err } = await supabaseClient
      .from("posts")
      .insert([postData])
      .select()
      .single();
    error = err;

    if (!err && newPost) {
      await supabaseClient.from("comments").insert([
        {
          post_id: newPost.id,
          user_name: "Khushaank Gupta",
          content:
            "Thank you for visiting this post and reading it! 🙏 Hope you enjoyed it. Follow for more insights and updates on finance, AI, and technology!",
        },
      ]);
    }
  }

  if (error) {
    alert(error.message);
  } else {
    showToast(
      id ? "Article updated successfully" : "Article published successfully",
    );
    closeModal();
    fetchPosts();
  }

  btn.textContent = originalText;
  btn.disabled = false;
});

async function editPost(id) {
  const { data } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  if (data) {
    document.getElementById("post-id").value = data.id;
    document.getElementById("p-title").value = data.title;
    document.getElementById("p-excerpt").value = data.excerpt;
    document.getElementById("p-image").value = data.image_url || "";

    quill.root.innerHTML = data.content || "";

    if (data.image_url) {
      imagePreview.src = data.image_url;
      imagePreview.style.display = "block";
    } else {
      imagePreview.style.display = "none";
    }

    openModal(true);
  }
}

async function deletePost(id) {
  if (confirm("Delete this article? This cannot be undone.")) {
    const { error } = await supabaseClient.from("posts").delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      showToast("Article deleted.");
      fetchPosts();
    }
  }
}

const defaultSettings = {
  blogTitle: "Khushaank's Blog",
  authorName: "Khushaank",
  tagline: "Thoughts on tech and design...",
  compactView: false,
  autosave: "60",
};

function loadSettings() {
  const saved =
    JSON.parse(localStorage.getItem("adminSettings")) || defaultSettings;

  if (document.getElementById("set-blog-title")) {
    document.getElementById("set-blog-title").value =
      saved.blogTitle || defaultSettings.blogTitle;
    document.getElementById("set-author-name").value =
      saved.authorName || defaultSettings.authorName;
    document.getElementById("set-tagline").value =
      saved.tagline || defaultSettings.tagline;
    document.getElementById("set-compact-view").checked =
      saved.compactView || false;
    document.getElementById("set-autosave").value = saved.autosave || "60";
  }

  applySettings(saved);
}

window.saveSettings = function () {
  const settings = {
    blogTitle: document.getElementById("set-blog-title").value,
    authorName: document.getElementById("set-author-name").value,
    tagline: document.getElementById("set-tagline").value,
    compactView: document.getElementById("set-compact-view").checked,
    autosave: document.getElementById("set-autosave").value,
  };

  localStorage.setItem("adminSettings", JSON.stringify(settings));
  applySettings(settings);
  showToast("Settings saved successfully!");
};

function applySettings(settings) {
  const tableTable = document.getElementById("posts-table");
  if (tableTable) {
    if (settings.compactView) {
      tableTable.classList.add("compact-view");
    } else {
      tableTable.classList.remove("compact-view");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
});

async function fetchSubscribers() {
  const tbody = document.getElementById("subscribers-body");
  const totalEl = document.getElementById("total-subscribers");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="3" style="text-align: center; padding: 2rem;">Loading...</td></tr>';

  const { data: subscribers, error } = await supabaseClient
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // console.error("Error fetching subscribers:", error);
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: red;">Error: ${error.message}</td></tr>`;
    return;
  }

  if (totalEl) totalEl.textContent = subscribers.length;

  if (subscribers.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="3" style="text-align: center; padding: 2rem;">No subscribers yet.</td></tr>';
    return;
  }

  tbody.innerHTML = subscribers
    .map((sub) => {
      const date = new Date(sub.created_at).toLocaleDateString();
      return `
      <tr>
        <td>${sub.email}</td>
        <td>${date}</td>
        <td style="text-align: right;">
           <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="deleteSubscriber('${sub.id}')">Remove</button>
        </td>
      </tr>
    `;
    })
    .join("");
}

window.deleteSubscriber = async function (id) {
  if (confirm("Are you sure you want to remove this subscriber?")) {
    const { error } = await supabaseClient
      .from("subscribers")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
    } else {
      showToast("Subscriber removed.");
      fetchSubscribers();
    }
  }
};

window.exportSubscribers = async function () {
  const { data: subscribers, error } = await supabaseClient
    .from("subscribers")
    .select("email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    alert("Error fetching data for export: " + error.message);
    return;
  }

  if (!subscribers || subscribers.length === 0) {
    alert("No subscribers to export.");
    return;
  }

  const headers = ["Email", "Joined Date"];
  const rows = subscribers.map((sub) => [
    sub.email,
    new Date(sub.created_at).toISOString(),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n",
  );

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `subscribers_export_${Date.now()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

async function fetchMessages() {
  const tbody = document.getElementById("messages-body");
  const emptyDiv = document.getElementById("messages-empty");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (emptyDiv) emptyDiv.style.display = "none";

  const { data: messages, error } = await supabaseClient
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showToast("Error fetching messages: " + error.message, "error");
    return;
  }

  if (messages.length === 0) {
    if (emptyDiv) emptyDiv.style.display = "block";
    return;
  }

  tbody.innerHTML = messages
    .map((msg) => {
      const date = new Date(msg.created_at).toLocaleString();
      const unreadClass = msg.is_read
        ? ""
        : "font-weight: bold; color: var(--accent);";
      return `
      <tr>
        <td>
          <div style="${unreadClass}">${msg.name}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted)">${msg.email}</div>
        </td>
        <td>
          <div style="font-size: 0.9rem; font-weight: 600; margin-bottom: 2px;">${msg.subject}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${msg.message}</div>
        </td>
        <td style="font-size: 0.8rem;">${date}</td>
        <td style="text-align: right;">
          <button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="toggleMessageRead('${msg.id}', ${msg.is_read})">
            ${msg.is_read ? "Mark Unread" : "Mark Read"}
          </button>
          <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="deleteMessage('${msg.id}')">Delete</button>
        </td>
      </tr>
    `;
    })
    .join("");
}

window.deleteMessage = async function (id) {
  if (confirm("Delete this message?")) {
    const { error } = await supabaseClient
      .from("messages")
      .delete()
      .eq("id", id);
    if (error) showToast("Error: " + error.message, "error");
    else {
      showToast("Message deleted.");
      fetchMessages();
    }
  }
};

window.toggleMessageRead = async function (id, currentStatus) {
  const { error } = await supabaseClient
    .from("messages")
    .update({ is_read: !currentStatus })
    .eq("id", id);
  if (error) showToast("Error: " + error.message, "error");
  else fetchMessages();
};

async function fetchFiles() {
  const grid = document.getElementById("files-grid");
  const emptyDiv = document.getElementById("files-empty");
  if (!grid) return;

  grid.innerHTML =
    '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Loading files...</div>';
  if (emptyDiv) emptyDiv.style.display = "none";

  try {
    // Fetch from root
    const { data: rootFiles, error: rootError } = await supabaseClient.storage
      .from("assets")
      .list("", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });

    // Fetch from attachments folder
    const { data: attachmentsFiles, error: attachmentsError } =
      await supabaseClient.storage.from("assets").list("attachments", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });

    if (rootError && attachmentsError) {
      showToast(
        "Error fetching files: " +
          (rootError.message || attachmentsError.message),
        "error",
      );
      grid.innerHTML = "";
      if (emptyDiv) emptyDiv.style.display = "block";
      return;
    }

    const allFiles = [
      ...(rootFiles || [])
        .filter((f) => f.id)
        .map((f) => ({ ...f, path: f.name })),
      ...(attachmentsFiles || [])
        .filter((f) => f.id)
        .map((f) => ({ ...f, path: `attachments/${f.name}` })),
    ];

    grid.innerHTML = "";

    if (allFiles.length === 0) {
      if (emptyDiv) emptyDiv.style.display = "block";
      grid.appendChild(emptyDiv);
      return;
    }

    allFiles.forEach((file) => {
      const card = document.createElement("div");
      card.className = "table-card fade-in";
      card.style.padding = "1rem";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.gap = "0.75rem";
      card.style.position = "relative";

      const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name);
      const { data: urlData } = supabaseClient.storage
        .from("assets")
        .getPublicUrl(file.path);
      const publicUrl = urlData.publicUrl;

      card.innerHTML = `
        <div style="height: 140px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid var(--border);">
          ${isImage ? `<img src="${publicUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : `<i data-lucide="file-text" size="40" style="color: #cbd5e1"></i>`}
        </div>
        <div style="overflow: hidden;">
          <div style="font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-main);" title="${file.name}">${file.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted)">${file.metadata ? (file.metadata.size / 1024).toFixed(1) : "0"} KB</div>
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: auto;">
          <button class="btn btn-outline" style="flex: 1; padding: 0.4rem; font-size: 0.7rem; justify-content: center;" onclick="copyToClipboard('${publicUrl}')">
            <i data-lucide="copy" size="12"></i> Copy URL
          </button>
          <button class="btn btn-danger" style="padding: 0.4rem; font-size: 0.7rem;" onclick="deleteFile('${file.path}')">
            <i data-lucide="trash-2" size="12"></i>
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
    lucide.createIcons();
  } catch (err) {
    showToast("Error: " + err.message, "error");
  }
}

window.handleFileUpload = async function (input) {
  const file = input.files[0];
  if (!file) return;

  showToast("Uploading " + file.name + "...");
  const { data, error } = await supabaseClient.storage
    .from("assets")
    .upload(file.name, file, { upsert: true });

  if (error) {
    showToast("Upload failed: " + error.message, "error");
  } else {
    showToast("File uploaded successfully!");
    fetchFiles();
  }
  input.value = "";
};

window.deleteFile = async function (name) {
  if (confirm("Delete this file?")) {
    const { error } = await supabaseClient.storage
      .from("assets")
      .remove([name]);
    if (error) showToast("Error: " + error.message, "error");
    else {
      showToast("File deleted.");
      fetchFiles();
    }
  }
};

window.copyToClipboard = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("Link copied to clipboard!");
  });
};

window.handlePostFileUpload = async function (input) {
  const file = input.files[0];
  if (!file) return;

  showToast("Uploading attachment...");
  const fileName = `attachments/${Date.now()}_${file.name}`;
  const { data, error } = await supabaseClient.storage
    .from("assets")
    .upload(fileName, file);

  if (error) {
    showToast("Upload failed: " + error.message, "error");
  } else {
    const { data: urlData } = supabaseClient.storage
      .from("assets")
      .getPublicUrl(fileName);
    document.getElementById("p-file").value = urlData.publicUrl;
    showToast("Attachment uploaded!");
  }
  input.value = "";
};

async function fetchComments() {
  const tbody = document.getElementById("comments-body");
  const emptyDiv = document.getElementById("comments-empty");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (emptyDiv) emptyDiv.style.display = "none";

  const { data: comments, error } = await supabaseClient
    .from("comments")
    .select("*, posts(title)")
    .order("created_at", { ascending: false });

  if (error) {
    showToast("Error fetching comments: " + error.message, "error");
    return;
  }

  if (comments.length === 0) {
    if (emptyDiv) emptyDiv.style.display = "block";
    return;
  }

  tbody.innerHTML = comments
    .map((comment) => {
      const date = new Date(comment.created_at).toLocaleString();
      const postTitle = comment.posts?.title || "Unknown Post";
      const imageHtml = comment.image_url
        ? `<div style="margin-top: 0.5rem;"><a href="${comment.image_url}" target="_blank"><img src="${comment.image_url}" style="max-width: 150px; border-radius: 4px; border: 1px solid var(--border);" /></a></div>`
        : "";
      return `
      <tr>
        <td>
          <div style="font-weight: 600;">${comment.user_name}</div>
        </td>
        <td>
          <div style="font-size: 0.9rem; max-width: 400px; word-wrap: break-word;">${comment.content}</div>
          ${imageHtml}
        </td>
        <td>
          <div style="font-size: 0.85rem; color: var(--text-muted)">${postTitle}</div>
        </td>
        <td style="font-size: 0.8rem;">${date}</td>
        <td style="text-align: right;">
          <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="deleteComment('${comment.id}')">Delete</button>
        </td>
      </tr>
    `;
    })
    .join("");
}

window.deleteComment = async function (id) {
  if (confirm("Are you sure you want to delete this comment?")) {
    const { error } = await supabaseClient
      .from("comments")
      .delete()
      .eq("id", id);
    if (error) showToast("Error: " + error.message, "error");
    else {
      showToast("Comment deleted.");
      fetchComments();
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  document.addEventListener("click", (e) => {
    const desktopToggle = e.target.closest("#desktop-sidebar-toggle");
    const mobileToggle = e.target.closest("#mobile-sidebar-toggle");
    const overlayTarget = e.target.closest("#sidebar-overlay");

    if (desktopToggle && sidebar) {
      if (window.innerWidth > 768) {
        sidebar.classList.toggle("minimized");
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
          mainContent.style.marginLeft = sidebar.classList.contains("minimized")
            ? "76px"
            : "260px";
        }
      } else {
        if (sidebar.classList.contains("active")) {
          sidebar.classList.remove("active");
          if (overlay) overlay.classList.remove("active");
        } else {
          sidebar.classList.add("active");
          if (overlay) overlay.classList.add("active");
        }
      }
    }

    if (mobileToggle && sidebar) {
      sidebar.classList.add("active");
      if (overlay) overlay.classList.add("active");
    }

    if (overlayTarget && sidebar) {
      sidebar.classList.remove("active");
      if (overlay) overlay.classList.remove("active");
    }
  });

  // Handle window resizing
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      if (sidebar) sidebar.classList.remove("active");
      if (overlay) overlay.classList.remove("active");
    }
  });

  // Clicking nav item on mobile closes the sidebar
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        if (sidebar) sidebar.classList.remove("active");
        if (overlay) overlay.classList.remove("active");
      }
    });
  });
});
