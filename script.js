// Client-Side Script

// Get stored credentials
let storedToken = localStorage.getItem("jwtToken");
let storedUsername = localStorage.getItem("username");

// Safely set username if element exists
const usernameElement = document.getElementById("username");
if (usernameElement) {
  usernameElement.textContent = storedUsername || "";
}

// Main DOM load
document.addEventListener("DOMContentLoaded", () => {
  const baseUrl = window.location.origin;

  const postsList = document.getElementById("posts-list");
  if (postsList) fetchPosts(baseUrl);

  const storedRole = localStorage.getItem("userRole");
  if (storedToken && storedRole === "admin") showAdminFeatures();

  const form = document.getElementById("new-post-form");
  if (form) {
    form.addEventListener("submit", (event) => createPost(event, baseUrl));
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => loginUser(event, baseUrl));
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", (event) =>
      registerUser(event, baseUrl)
    );
  }

  handleAuthUI();
});

// Post detail handler
window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("post");

  if (postId) showPostDetail(postId);
});

// Fetch posts
async function fetchPosts(baseUrl) {
  const res = await fetch(`${baseUrl}/posts`);
  const data = await res.json();

  const postsList = document.getElementById("posts-list");
  if (!postsList) return;

  const isAdmin = localStorage.getItem("userRole") === "admin";

  postsList.innerHTML = data
    .map((post, index) => {
      return `
        <div id="${post._id}" class="post">
          <img src="${post.imageUrl}" alt="Image" />

          <div class="post-title">
            ${
              index === 0
                ? `<h1><a href="/post/${post._id}">${post.title}</a></h1>`
                : `<h3><a href="/post/${post._id}">${post.title}</a></h3>`
            }
          </div>

          ${
            index === 0
              ? `<span><p>${post.author}</p><p>${post.timestamp}</p></span>`
              : ""
          }

          <div class="admin-buttons">
            ${
              isAdmin
                ? `<button class="btn" onclick="deletePost('${post._id}', '${baseUrl}')">Delete</button>
                   <button class="btn" onclick="showUpdateForm('${post._id}', \`${post.title}\`, \`${post.content}\`)">Update</button>`
                : ""
            }
          </div>

          ${index === 0 ? "<hr><h2>All Articles</h2>" : ""}
        </div>
      `;
    })
    .join("");
}

// Create Post
async function createPost(event, baseUrl) {
  event.preventDefault();

  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const imageUrl = document.getElementById("image-url").value;

  if (!title || !content || !imageUrl) {
    alert("Please fill in all fields.");
    return;
  }

  const newPost = {
    title,
    content,
    imageUrl,
    author: storedUsername,
    timestamp: new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  try {
    const response = await fetch(`${baseUrl}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify(newPost),
    });

    if (!response.ok) {
      console.error("Error creating post:", response.status);
      alert("Create post failed.");
    } else {
      alert("Post created!");
      document.getElementById("new-post-form").reset();
      fetchPosts(baseUrl);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert("Create post failed.");
  }
}

// Delete Post
async function deletePost(postId, baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (response.ok) {
      alert("Post deleted!");
      fetchPosts(baseUrl);
    } else {
      alert("Delete failed.");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("Delete failed.");
  }
}

// Show Update Form
function showUpdateForm(postId, title, content) {
  const postElement = document.getElementById(postId);
  if (!postElement) return;

  const formHtml = `
    <form id="update-form-${postId}" class="update-form">
      <input type="text" id="update-title-${postId}" value="${title}" />
      <textarea id="update-content-${postId}">${content}</textarea>
      <button type="submit">Update</button>
    </form>
  `;

  postElement.insertAdjacentHTML("beforeend", formHtml);

  document
    .getElementById(`update-form-${postId}`)
    .addEventListener("submit", (event) => updatePost(event, postId));
}

// Update Post
async function updatePost(event, postId) {
  event.preventDefault();

  const title = document.getElementById(`update-title-${postId}`).value;
  const content = document.getElementById(`update-content-${postId}`).value;

  if (!title || !content) {
    alert("Please fill in all fields.");
    return;
  }

  const baseUrl = window.location.origin;

  try {
    const response = await fetch(`${baseUrl}/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${storedToken}`,
      },
      body: JSON.stringify({ title, content }),
    });

    if (response.ok) {
      alert("Post updated!");
      fetchPosts(baseUrl);
    } else {
      alert("Update failed.");
    }
  } catch (error) {
    console.error("Update error:", error);
    alert("Update failed.");
  }
}

// Register User
async function registerUser(event, baseUrl) {
  event.preventDefault();

  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  const role = document.getElementById("register-role").value;

  if (!username || !password || !role) {
    alert("Please fill in all fields.");
    return;
  }

  const res = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, role }),
  });

  const data = await res.json();

  if (data.success) {
    alert("Registered!");
    document.getElementById("register-form").reset();
  } else {
    alert("Registration failed.");
  }
}

// Login User
async function loginUser(event, baseUrl) {
  event.preventDefault();

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    alert("Please fill in all fields.");
    return;
  }

  const res = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (data.success) {
    localStorage.setItem("jwtToken", data.token);
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("username", username);

    alert("Login successful!");
    location.reload();
  } else {
    alert("Login failed.");
  }
}

// Admin UI visibility
function showAdminFeatures() {
  const newPostDiv = document.getElementById("new-post-div");
  if (newPostDiv) newPostDiv.style.display = "flex";

  document.querySelectorAll(".btn").forEach((btn) => {
    btn.style.display = "block";
  });
}

// Login/Register/Logout Display
function handleAuthUI() {
  const registerDiv = document.getElementById("register-div");
  const loginDiv = document.getElementById("login-div");
  const logoutDiv = document.getElementById("logout-div");

  if (!registerDiv || !loginDiv || !logoutDiv) return;

  if (storedToken) {
    registerDiv.style.display = "none";
    loginDiv.style.display = "none";
    logoutDiv.style.display = "flex";

    document
      .getElementById("logout-button")
      ?.addEventListener("click", () => {
        localStorage.clear();
        location.reload();
      });
  } else {
    registerDiv.style.display = "flex";
    loginDiv.style.display = "flex";
    logoutDiv.style.display = "none";
  }
}

