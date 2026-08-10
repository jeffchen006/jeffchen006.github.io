(() => {
  const playerButtons = document.querySelectorAll(".publication-video");

  playerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const videoId = button.dataset.videoId;
      const videoTitle = button.dataset.videoTitle;

      if (!videoId || !videoTitle) {
        return;
      }

      if (window.location.protocol === "file:") {
        const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&autoplay=1`;
        window.open(watchUrl, "_blank", "noopener,noreferrer");
        return;
      }

      const player = document.createElement("iframe");
      player.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0`;
      player.title = videoTitle;
      player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      player.referrerPolicy = "strict-origin-when-cross-origin";
      player.allowFullscreen = true;

      button.replaceWith(player);
    });
  });

  const setupSocialQrDialog = (dialogId) => {
    const dialog = document.querySelector(`#${dialogId}`);

    if (!dialog) {
      return;
    }

    const buttons = document.querySelectorAll(`[aria-controls="${dialogId}"]`);
    const closeButton = dialog.querySelector(".social-qr-dialog-close");
    let activeButton = null;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        activeButton = button;
        dialog.showModal();
      });
    });

    closeButton?.addEventListener("click", () => {
      dialog.close();
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });

    dialog.addEventListener("close", () => {
      activeButton?.focus();
      activeButton = null;
    });
  };

  setupSocialQrDialog("wechat-dialog");
  setupSocialQrDialog("instagram-dialog");
})();
