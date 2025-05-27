console.log('script.js loaded');

// Import ฟังก์ชันที่ต้องการจาก Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA7aFm5MhmdQCEvk0L0itzGVZtgYbi6g8o",
    authDomain: "owl-deli.firebaseapp.com",
    projectId: "owl-deli",
    storageBucket: "owl-deli.appspot.com",
    messagingSenderId: "114202244542",
    appId: "1:114202244542:web:7f5e7fa02fe70ebb4d35ef",
    measurementId: "G-B15CJYZJPV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// DOM elements
const loginBtn = document.getElementById('btn-login');
const logoutBtn = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');

const homePage = document.getElementById('homepage');
const boardPage = document.getElementById('boardpage');
const postPage = document.getElementById('reciver-postpage');

boardPage.style.display = 'none';
postPage.style.display = 'none';

// ฟังก์ชันล็อกอิน
loginBtn.addEventListener('click', async (e) => {
    console.log("Login button clicked");
    e.preventDefault();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        userInfo.textContent = `*Hello, ${user.displayName} (${user.email})`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } catch (error) {
        console.error("Login Error:", error);
    }
});

// ฟังก์ชันล็อกเอาท์
logoutBtn.addEventListener('click', async (e) => {
    console.log("Logout button clicked");
    e.preventDefault();
    try {
        await signOut(auth);
        userInfo.textContent = '';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    } catch (error) {
        console.error("Logout Error:", error);
    }
});

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("Logged in as:", user.email);
        userInfo.textContent = `Hello, ${user.displayName} (${user.email})`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        boardPage.style.display = 'block';
        homePage.style.display = 'none';
    } else {
        currentUser = null;
        console.log("Not logged in");
        userInfo.textContent = '';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
});

const db = getFirestore(app);

document.getElementById('btn-add-order').addEventListener('click', async (e) => {
    boardPage.style.display = 'none';
    postPage.style.display = 'flex';
});

document.getElementById("btn-rpc-add-order").addEventListener("click", async function (e) {
    e.preventDefault();

    const details = document.getElementById("rpc-details").value;
    const startLocation = document.getElementById("slocations").value;
    const endLocation = document.getElementById("elocations").value;
    const contact = document.getElementById("rpc-message").value;
    const price = document.getElementById("rpc-price").value;
    const cost = document.getElementById("rpc-cost").value;
    const payment = document.querySelector('input[name="payment"]:checked')?.value || "unknown";

    const username = currentUser.displayName || currentUser.email || currentUser.uid;
    const delivery_name = "???";
    const status = "waiting";

    try {
        await addDoc(collection(db, "orders"), {
            details,
            from: startLocation,
            to: endLocation,
            contact,
            price,
            cost,
            payment,
            username,
            delivery_name,
            status,
            created_at: new Date(),
        });

        boardPage.style.display = 'block';
        postPage.style.display = 'none';

        location.reload();
    } catch (error) {
        console.error("Error adding order: ", error);
        alert("Error adding order: " + error.message);
    }
});

async function loadOrders() {
    console.log("loadOrders function called");
    const container = document.getElementById("orders-container");
    container.innerHTML = ""; // เคลียร์ของเก่าก่อน

    const querySnapshot = await getDocs(collection(db, "orders"));

    querySnapshot.forEach((doc) => {
        const data = doc.data();

        let cardClass = "post-card order-new";
        if (data.status === "in_process") cardClass = "post-card order-old";
        else if (data.status === "succeeded") cardClass = "post-card order-succeeded";

        const card = document.createElement("div");
        card.className = cardClass;

        let featureButtons = "";
        if (data.status === "waiting") {
            featureButtons = `
      <a href="#" class="btn btn-red btn-cancel" data-id="${doc.id}">Cancel</a>
      <a href="#" class="btn btn-green btn-deliver" data-id="${doc.id}">Deliver This</a>
    `;
        } else if (data.status === "in_process") {
            let succeedBtnHtml = "";
            if (data.username === currentUser.displayName) {
                succeedBtnHtml = `<a href="#" class="btn btn-green btn-succeed" data-id="${doc.id}">Succeeded</a>`;
            }
            featureButtons = `
      <a href="#" class="btn btn-process">In Process</a>
      ${succeedBtnHtml}
    `;
        } else if (data.status === "succeeded") {
            featureButtons = `<p>Order Completed</p>`;
        }

        card.innerHTML = `
    <div class="post-card-header">
      <span class="deliver-name">${data.delivery_name || "???"}</span> to <span class="reciver-name">${data.username || "???"}</span>
    </div>

    <div class="post-card-price">
      <p>Price: <span class="full-price">${data.price || "0"}</span>฿</p>
      <p>, You'll get: <span class="deliver-price">${data.cost || "0"}</span>฿-</p>
    </div>

    <div class="post-card-content">
      <p>Details: <span class="reciver-details">${data.details || "-"}</span></p>
      <p>Address: <span class="address-start">${data.from || "-"}</span></p>
      <p>To Address: <span class="address-goal">${data.to || "-"}</span></p>
    </div>

    <div class="post-card-footer">
      <p>ID: <span class="post-card-id">${doc.id.substring(0, 4)}</span></p>
      <div class="post-card-feature">
        ${featureButtons}
      </div>
    </div>
  `;

        container.appendChild(card);
    });

    // เพิ่ม event listener ให้ปุ่ม Cancel
    document.querySelectorAll(".btn-cancel").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const id = e.target.dataset.id;
            if (confirm("Are you sure to cancel this order?")) {
                console.log(id);
                await deleteDoc(doc(db, "orders", id));
                loadOrders();
                location.reload();
            }
        });
    });

    // เพิ่ม event listener ให้ปุ่ม Deliver This
    document.querySelectorAll(".btn-deliver").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const id = e.target.dataset.id;
            await updateDoc(doc(db, "orders", id), {
                status: "in_process",
                delivery_name: currentUser.displayName || currentUser.email || currentUser.uid
            });
            loadOrders();
            location.reload();
        });
    });

    // เพิ่ม event listener ให้ปุ่ม Succeeded
    document.querySelectorAll(".btn-succeed").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const id = e.target.dataset.id;

            const orderRef = doc(db, "orders", id);
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) return;

            const orderData = orderSnap.data();

            // ย้ายข้อมูลไป collection ใหม่
            await setDoc(doc(db, "completed_orders", id), {
                ...orderData,
                status: "succeeded",
                completed_at: new Date(),
            });

            // ลบออกจาก collection เดิม
            await deleteDoc(orderRef);
            loadOrders();
            location.reload();
        });
    });
}

// โหลดตอนเริ่มหน้า
loadOrders();