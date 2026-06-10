/* ============================
   Firebase 初期化（新プロジェクト）
============================ */
const firebaseConfig = {
  apiKey: "AIzaSyCJjV6S0Pqnzo4jqKmBPlhsZQVMMDI84yo",
  authDomain: "pta-prototype-2026.firebaseapp.com",
  projectId: "pta-prototype-2026",
  storageBucket: "pta-prototype-2026.appspot.com",
  messagingSenderId: "336765183296",
  appId: "1:336765183296:web:f63e3e532f0ca71e7446a5"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ============================
   表示中データ
============================ */
let currentView = [];
let allData = [];
let rawDocs = {};
let gradeAsc = true;

const tbody = document.querySelector("#list tbody");

/* ============================
   ソート関数
============================ */
function sortByGradeClassNumber(data, asc = true) {
  return [...data].sort((a, b) => {
    if (a.grade !== b.grade) return asc ? a.grade - b.grade : b.grade - a.grade;
    if (a.class !== b.class) return a.class - b.class;
    return (a.studentId || "").localeCompare(b.studentId || "");
  });
}

/* ============================
   Firestore 読み込み
============================ */
function loadData() {
  const year = Number(document.getElementById("yearSelect").value);

  db.collection("pta_memberships")
    .where("year", "==", year)
    .onSnapshot(snap => {
      allData = [];
      rawDocs = {};

      snap.forEach(doc => {
        const d = doc.data();
        rawDocs[doc.id] = d;

        (d.children || []).forEach(child => {
          allData.push({
            docId: doc.id,
            parentName: d.parentName,
            email: d.email,
            phone: d.phone,
            role: d.role || "",
            childName: child.name,
            grade: Number(child.grade),
            class: Number(child.class),
            studentId: child.studentId,
            joinKyosai: !!child.joinKyosai,
            joinhoken: !!d.joinhoken
          });
        });
      });

      const sorted = sortByGradeClassNumber(allData, true);
      render(sorted);
      renderSummary();
      renderClassSummary();
      document.getElementById("searchCount").textContent = `${sorted.length}件`;
    });
}


loadData();

/* ============================
   表示
============================ */
function render(data) {
  currentView = data;
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.parentName}</td>
      <td>${row.email}</td>
      <td>${row.phone}</td>
      <td>${row.childName}</td>
      <td>${row.grade}</td>
      <td>${row.class}</td>
      <td>${row.studentId}</td>
      <td>${row.role || ""}</td>
      <td>${row.joinKyosai ? "〇" : ""}</td>
      <td>${row.joinhoken ? "〇" : ""}</td>
      <td>
        <button onclick="editEntry('${row.docId}')">編集</button>
        <button onclick="deleteEntry('${row.docId}')">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}


/* ============================
   氏名検索
============================ */
document.getElementById("searchName").addEventListener("input", e => {
  const q = e.target.value.trim();
  const filtered = allData.filter(row =>
    row.parentName.includes(q) || row.childName.includes(q)
  );
  const sorted = sortByGradeClassNumber(filtered, true);
  render(sorted);
  document.getElementById("searchCount").textContent = `${sorted.length}件`;
});

/* ============================
   学年・組検索
============================ */
function applyGradeClassSearch() {
  const g = document.getElementById("searchGrade").value.trim();
  const c = document.getElementById("searchClass").value.trim();

  let grade = g === "" ? null : Number(g);
  let cls = c === "" ? null : Number(c);

  if (grade === null && cls === null) {
    const sorted = sortByGradeClassNumber(allData, gradeAsc);
    render(sorted);
    return;
  }

  let filtered = allData.filter(row => {
    const matchGrade = grade === null || row.grade === grade;
    const matchClass = cls === null || row.class === cls;
    return matchGrade && matchClass;
  });

  filtered = sortByGradeClassNumber(filtered, true);
  render(filtered);
}

document.getElementById("searchGrade").addEventListener("input", applyGradeClassSearch);
document.getElementById("searchClass").addEventListener("input", applyGradeClassSearch);

/* ============================
   CSV
============================ */
document.getElementById("downloadCsv").addEventListener("click", () => {
  let csv = "保護者名,メール,電話,子ども,学年,クラス,番号,共済,保険\n";

  currentView.forEach(row => {
    csv += `${row.parentName},${row.email},${row.phone},${row.childName},${row.grade},${row.class},${row.studentId},${row.joinKyosai ? "○" : ""},${row.joinhoken ? "○" : ""}\n`;
  });

  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csv], { type: "text/csv" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pta名簿.csv";
  a.click();
  URL.revokeObjectURL(url);
});


/* ============================
   学年別集計
============================ */
function renderSummary() {
  const summary = {};
  allData.forEach(row => {
    if (!summary[row.grade]) summary[row.grade] = 0;
    summary[row.grade]++;
  });

  let html = "";
  Object.keys(summary).sort((a, b) => a - b).forEach(grade => {
    html += `
      <div class="summary-card">
        <div>${grade}年</div>
        <div>${summary[grade]}名</div>
      </div>
    `;
  });

  document.getElementById("summary").innerHTML = html;
}

/* ============================
   クラス別集計
============================ */
function renderClassSummary() {
  const summary = {};
  allData.forEach(row => {
    const key = `${row.grade}-${row.class}`;
    if (!summary[key]) summary[key] = 0;
    summary[key]++;
  });

  let html = "<h3>クラス別集計</h3><div style='display:flex; gap:15px; flex-wrap:wrap;'>";
  Object.keys(summary).sort().forEach(key => {
    const [grade, cls] = key.split("-");
    html += `
      <div class="summary-card">
        <div>${grade}年${cls}組</div>
        <div>${summary[key]}名</div>
      </div>
    `;
  });
  html += "</div>";
  document.getElementById("classSummary").innerHTML = html;
}

/* ============================
   加入状況フィルタ
============================ */
document.getElementById("filterKyosai").onclick = () => {
  const filtered = allData.filter(r => r.joinKyosai);
  render(filtered);
  searchCount.textContent = `${filtered.length}件`;
};

document.getElementById("filterhoken").onclick = () => {
  const filtered = allData.filter(r => r.joinhoken);
  render(filtered);
  searchCount.textContent = `${filtered.length}件`;
};

document.getElementById("filterReset").onclick = () => {
  render(allData);
  searchCount.textContent = `${allData.length}件`;
};

/* ============================
   編集モーダル
============================ */
window.editEntry = function (docId) {
  const data = rawDocs[docId];
  if (!data) return;

  document.getElementById("editParent").value = data.parentName || "";
  document.getElementById("editEmail").value = data.email || "";
  document.getElementById("editPhone").value = data.phone || "";
  document.getElementById("editRole").value = data.role || "";

  // 保険（保護者のみ）
  const hokenVal = data.joinhoken ? "yes" : "no";
  document.querySelector(`input[name="editJoinhoken"][value="${hokenVal}"]`).checked = true;

  const box = document.getElementById("editChildren");
  box.innerHTML = "";

  (data.children || []).forEach((child, index) => {
    const div = document.createElement("div");
    div.classList.add("child-edit-block");

    div.innerHTML = `
      <label>氏名</label>
      <input class="child-name" value="${child.name || ""}"><br>

      <label>学年</label>
      <input class="child-grade" type="number" value="${child.grade || ""}"><br>

      <label>クラス</label>
      <input class="child-class" type="number" value="${child.class || ""}"><br>

      <label>学籍番号</label>
      <input class="child-id" value="${child.studentId || ""}"><br>

      <div class="edit-join-row">
        <span class="edit-join-label">共済：</span>
        <label class="radio-label"><input type="radio" name="editJoinKyosai_${index}" value="yes"> 加入する</label>
        <label class="radio-label"><input type="radio" name="editJoinKyosai_${index}" value="no"> 加入しない</label>
      </div>

      <button type="button" class="removeChild">削除</button>
      <hr>
    `;

    div.querySelector(".removeChild").addEventListener("click", () => {
      div.remove();
    });

    box.appendChild(div);
  });

  // 子ども追加
  document.getElementById("addChildEdit").onclick = () => {
  const index = document.querySelectorAll(".child-edit-block").length;
  const div = document.createElement("div");
  div.classList.add("child-edit-block");

  div.innerHTML = `
    <label>氏名</label>
    <input class="child-name" value=""><br>

    <label>学年</label>
    <input class="child-grade" type="number" value=""><br>

    <label>クラス</label>
    <input class="child-class" type="number" value=""><br>

    <label>学籍番号</label>
    <input class="child-id" value=""><br>

    <div class="edit-join-row">
      <span class="edit-join-label">共済：</span>
      <label class="radio-label">
        <input type="radio" name="editJoinKyosai_${index}" value="yes"> 加入する
      </label>
      <label class="radio-label">
        <input type="radio" name="editJoinKyosai_${index}" value="no" checked> 加入しない
      </label>
    </div>

    <button type="button" class="removeChild">削除</button>
    <hr>
  `;

  div.querySelector(".removeChild").addEventListener("click", () => {
    div.remove();
  });

  document.getElementById("editChildren").appendChild(div);
};

  // 保存
  document.getElementById("saveEdit").onclick = async () => {
    const updated = {
      parentName: document.getElementById("editParent").value.trim(),
      email: document.getElementById("editEmail").value.trim(),
      phone: document.getElementById("editPhone").value.trim(),
      role: document.getElementById("editRole").value,
      joinhoken: document.querySelector('input[name="editJoinhoken"]:checked')?.value === "yes",
      children: []
    };

    const blocks = document.querySelectorAll(".child-edit-block");
    blocks.forEach((block, index) => {
      const name = block.querySelector(".child-name").value.trim();
      if (!name) return;

      updated.children.push({
        name,
        grade: block.querySelector(".child-grade").value,
        class: block.querySelector(".child-class").value,
        studentId: block.querySelector(".child-id").value,
        joinKyosai: document.querySelector(`input[name="editJoinKyosai_${index}"]:checked`)?.value === "yes"
      });
    });

    const year = Number(document.getElementById("yearSelect").value);
    await db.collection("pta_memberships").doc(docId).update(updated);    closeEdit();
  };

  // モーダル表示（ここだけで OK）
  document.getElementById("editModal").style.display = "flex";
};


/* ============================
   モーダル閉じる
============================ */
window.closeEdit = function () {
  document.getElementById("editModal").style.display = "none";
};

/* ============================
   削除
============================ */
window.deleteEntry = async function (docId) {
  if (!confirm("本当に削除しますか？")) return;
  const year = document.getElementById("yearSelect").value;
  await db.collection("pta_memberships").doc(docId).delete();
};





document.getElementById("sortByGrade").addEventListener("click", () => {
  gradeAsc = !gradeAsc;  // 昇順/降順トグル（いらなければ消してもOK）

  const sorted = sortByGradeClassNumber(allData, gradeAsc);
  render(sorted);
  document.getElementById("searchCount").textContent = `${sorted.length}件`;
});

/* ============================
   年度変更
============================ */
document.getElementById("yearSelect").addEventListener("change", loadData);
