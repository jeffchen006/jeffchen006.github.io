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

  const wechatButtons = document.querySelectorAll(".wechat-copy");

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  };

  wechatButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const account = button.dataset.wechat;
      const icon = button.querySelector("i");

      if (!account || !icon) {
        return;
      }

      try {
        await copyText(account);
        button.classList.add("is-copied");
        button.setAttribute("aria-label", `Copied WeChat ID ${account}`);
        button.title = `Copied: ${account}`;
        icon.className = "fas fa-check";

        window.setTimeout(() => {
          button.classList.remove("is-copied");
          button.setAttribute("aria-label", `Copy WeChat ID ${account}`);
          button.title = `WeChat: ${account} (click to copy)`;
          icon.className = "fab fa-weixin";
        }, 1800);
      } catch (error) {
        button.title = `WeChat: ${account}`;
      }
    });
  });
})();
