import { renderHeaderComponent } from "./header-component.js";
import { renderUploadImageComponent } from "./upload-image-component.js";

export function renderAddPostPageComponent({ appEl, onAddPostClick }) {
  let imageUrl = "";

  const render = () => {
    const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <div class="form">
        <h3 class="form-title">Новый пост</h3>
        <div class="form-inputs">
          <div class="upload-image-container"></div>
          <textarea id="description-input" class="input textarea" placeholder="Описание"></textarea>
          <button class="button" id="add-button">Добавить</button>
        </div>
      </div>
    </div>`;

    appEl.innerHTML = appHtml;

    renderHeaderComponent({ element: document.querySelector(".header-container") });

    const uploadImageContainer = appEl.querySelector(".upload-image-container");
    if (uploadImageContainer) {
      renderUploadImageComponent({
        element: uploadImageContainer,
        onImageUrlChange(newImageUrl) {
          imageUrl = newImageUrl;
        },
      });
    }

    document.getElementById("add-button").addEventListener("click", () => {
      const description = document.getElementById("description-input").value.trim();
      if (!description) {
        alert("Введите описание");
        return;
      }
      if (!imageUrl) {
        alert("Выберите изображение");
        return;
      }
      onAddPostClick({ description, imageUrl });
    });
  };

  render();
}