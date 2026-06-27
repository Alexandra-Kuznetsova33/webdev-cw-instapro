import { POSTS_PAGE, USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user, getToken } from "../index.js";
import { likePost, dislikePost, getPosts } from "../api.js";
import { escapeHTML } from "../helpers.js";

let likeClickHandler = null; 

export function renderPostsPageComponent({ appEl, userId }) {
  const postsHtml = posts
    .map((post) => {
      const likesCount = post.likes ? post.likes.length : 0;
      const isLiked = user ? post.isLiked : false;
      const dateStr = new Date(post.createdAt).toLocaleString();

      return `
      <li class="post">
        <div class="post-header" data-user-id="${post.user.id}">
          <img src="${post.user.imageUrl}" class="post-header__user-image">
          <p class="post-header__user-name">${escapeHTML(post.user.name)}</p>
        </div>
        <div class="post-image-container">
          <img class="post-image" src="${post.imageUrl}" style="cursor: pointer;" data-post-id="${post.id}">
        </div>
        <div class="post-likes">
          <button data-post-id="${post.id}" class="like-button">
            <img src="./assets/images/${isLiked ? "like-active" : "like-not-active"}.svg">
          </button>
          <p class="post-likes-text">
            Нравится: <strong>${likesCount}</strong>
          </p>
        </div>
        <p class="post-text">
          <span class="user-name">${escapeHTML(post.user.name)}</span>
          ${escapeHTML(post.description)}
        </p>
        <p class="post-date">
          ${dateStr}
        </p>
      </li>
    `;
    })
    .join("");

  const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <ul class="posts">${postsHtml}</ul>
    </div>`;

  appEl.innerHTML = appHtml;

  renderHeaderComponent({
    element: document.querySelector(".header-container"),
  });

  for (let userEl of document.querySelectorAll(".post-header")) {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  }

  const postsContainer = document.querySelector(".posts");
  if (postsContainer) {
    if (likeClickHandler) {
      postsContainer.removeEventListener("click", likeClickHandler);
    }

    likeClickHandler = async (e) => {
      const likeButton = e.target.closest(".like-button");
      if (!likeButton) return;
      e.stopPropagation();

      if (!user) {
        alert("Войдите, чтобы ставить лайки");
        return;
      }

      const postId = likeButton.dataset.postId;
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const token = getToken();
      try {
        if (post.isLiked) {
          await dislikePost({ token, postId });
        } else {
          await likePost({ token, postId });
        }

        let updatedPosts;
        if (userId) {
          const allPosts = await getPosts({ token });
          updatedPosts = allPosts.filter((p) => p.user.id === userId);
        } else {
          updatedPosts = await getPosts({ token });
        }

        posts.length = 0;
        updatedPosts.forEach((p) => posts.push(p));

        renderPostsPageComponent({ appEl, userId });
      } catch (error) {
        console.error("Ошибка лайка:", error);
        alert("Не удалось обновить лайк");
      }
    };

    postsContainer.addEventListener("click", likeClickHandler);
  }

  document.querySelectorAll('.post-image').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation(); 
      const postId = img.dataset.postId;
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; align-items: center;
        justify-content: center; z-index: 1000; cursor: pointer;
      `;
      const modalImg = document.createElement('img');
      modalImg.src = post.imageUrl;
      modalImg.style.maxWidth = '90%';
      modalImg.style.maxHeight = '90%';
      modalImg.style.objectFit = 'contain';
      overlay.appendChild(modalImg);
      
      overlay.addEventListener('click', () => overlay.remove());
      document.body.appendChild(overlay);
    });
  });
}
