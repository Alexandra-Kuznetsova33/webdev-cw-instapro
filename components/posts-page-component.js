import { POSTS_PAGE, USER_POSTS_PAGE } from "../routes.js";
import { renderHeaderComponent } from "./header-component.js";
import { posts, goToPage, user, getToken } from "../index.js";
import { likePost, dislikePost, getPosts } from "../api.js";
import { escapeHTML } from "../helpers.js";

let likeClickHandler = null; // для удаления предыдущего обработчика

export function renderPostsPageComponent({ appEl, userId }) {
  // Рендеринг постов
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
          <img class="post-image" src="${post.imageUrl}">
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

  // Переход на страницу пользователя
  for (let userEl of document.querySelectorAll(".post-header")) {
    userEl.addEventListener("click", () => {
      goToPage(USER_POSTS_PAGE, {
        userId: userEl.dataset.userId,
      });
    });
  }

  // Лайки
  const postsContainer = document.querySelector(".posts");
  if (postsContainer) {
    // Удаляем предыдущий обработчик, если был
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

        // Загружаем актуальные посты и фильтруем, если на странице пользователя
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
}
