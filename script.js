console.log('script.js loaded');

// Import ฟังก์ชันที่ต้องการจาก Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// import { getAuth } from "firebase/auth";

// กำหนด config ของ Firebase
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
        userInfo.textContent = `Hello, ${user.displayName} (${user.email})`;
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

// ตรวจสอบสถานะผู้ใช้เมื่อโหลดหน้า
auth.onAuthStateChanged((user) => {
    if (user) {
        userInfo.textContent = `Hello, ${user.displayName} (${user.email})`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        userInfo.textContent = '';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
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
    e.preventDefault(); // ป้องกันการรีเฟรช

    const details = document.getElementById("rpc-details").value;
    const startLocation = document.getElementById("slocations").value;
    const endLocation = document.getElementById("elocations").value;
    const contact = document.getElementById("rpc-message").value;
    const price = document.getElementById("rpc-price").value;
    const cost = document.getElementById("rpc-cost").value;
    const payment = document.querySelector('input[name="payment"]:checked')?.value || "unknown";

    const username = currentUser.displayName || currentUser.email || currentUser.uid;
    const delivery_name = '???'; // ใส่คนรับงานเริ่มต้น
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

        // alert("Order added! ID: " + docRef.id);
        boardPage.style.display = 'block';
        postPage.style.display = 'none';
    } catch (error) {
        console.error("Error adding order: ", error);
        alert("Error adding order: " + error.message);
    }

    location.reload();
});

async function loadOrders() {
    console.log("loadOrders function called");
    const container = document.getElementById("orders-container");
    const querySnapshot = await getDocs(collection(db, "orders"));

    querySnapshot.forEach((doc) => {
        const data = doc.data();

        const card = document.createElement("div");
        card.className = "post-card order-new";
        card.innerHTML = `
      <div class="post-card-header">
        <span id="deliver-name">${data.delivery_name || "???"}</span> to <span id="reciver-name">${data.username || "???"}</span>
      </div>

      <div class="post-card-price">
        <p>Price: <span id="full-price">${data.price || "0"}</span>฿</p>
        <p>, You'll get: <span id="deliver-price">${data.cost || "0"}</span>฿-</p>
      </div>

      <div class="post-card-content">
        <p>Details: <span id="reciver-details">${data.details || "-"}</span></p>
        <p>Address: <span id="address-start">${data.from || "-"}</span></p>
        <p>To Address: <span id="address-goal">${data.to || "-"}</span></p>
      </div>

      <div class="post-card-footer">
        <p>ID: <span id="post-card-id">${doc.id.substring(0, 4)}</span></p>
        <div class="post-card-feature">
          <a href="#" class="btn btn-red">Cancel</a>
          <a href="#" class="btn btn-green">Deliver This</a>
        </div>
      </div>
    `;
        container.appendChild(card);
    });

}

// เรียกเมื่อโหลดหน้า
loadOrders();