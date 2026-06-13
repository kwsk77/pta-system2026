// Firebase 初期化（compat）
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


// 子ども追加
document.getElementById("addChild").addEventListener("click", () => {
  const childrenDiv = document.getElementById("children");
  const firstChild = childrenDiv.querySelector(".child");
  const newChild = firstChild.cloneNode(true);

  // 入力値クリア
  newChild.querySelectorAll("input").forEach(input => {
    input.value = "";
    if (input.type === "radio") input.checked = false;
  });

  childrenDiv.appendChild(newChild);

  // 子どもごとに joinKyosai の name を振り直す
  [...document.querySelectorAll(".child")].forEach((child, index) => {
    child.querySelectorAll('input[name^="joinKyosai"]').forEach(r => {
      r.name = `joinKyosai_${index}`;
    });
  });
});


// 送信処理
document.getElementById("ptaForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  const parentName = form.parentName.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const role = form.role.value;

  if (!parentName) return alert("保護者名を入力してください。");
  if (!email) return alert("メールアドレスを入力してください。");

 /* const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;\
  if (!emailPattern.test(email)) return alert("メールアドレスの形式が正しくありません。");*/
//プロトタイプなので制限を外しておく

  if (!phone) return alert("電話番号を入力してください。");

  // 子ども情報
  const children = [...document.querySelectorAll(".child")].map((c, index) => ({
    name: c.querySelector("[name='childName[]']").value.trim(),
    grade: c.querySelector("[name='grade[]']").value.trim(),
    class: c.querySelector("[name='class[]']").value.trim(),
    studentId: c.querySelector("[name='studentId[]']").value.trim(),
    joinKyosai: document.querySelector(`input[name="joinKyosai_${index}"]:checked`)?.value === "yes"
  }));

  const validChildren = children.filter(c =>
    c.name && c.grade && c.class && c.studentId
  );

  if (validChildren.length === 0) {
    return alert("最低でも1人の子どもの情報を入力してください。");
  }

  const joinhoken = document.querySelector('input[name="joinhoken"]:checked')?.value === "yes";

  const data = {
    parentName,
    email,
    phone,
    role,
    children: validChildren,
    joinhoken,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    year: 2026
  };

  await db.collection("pta_memberships").add(data);

  window.location.href = "thanks.html";
});


// 子ども削除
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("removeChild")) {
    const allChildren = document.querySelectorAll(".child");
    if (allChildren.length === 1) {
      alert("子どもは最低1人必要です。");
      return;
    }
    e.target.closest(".child").remove();
  }
});
