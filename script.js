window.addEventListener("load", () => {

setTimeout(() => {

const loader = document.getElementById("loader");
const content = document.getElementById("content");

if (loader) loader.style.display = "none";
if (content) content.style.display = "block";

}, 2000);

});

const glow = document.querySelector(".cursorGlow");

if (glow) {

document.addEventListener("mousemove", (e) => {

glow.style.left = e.clientX + "px";
glow.style.top = e.clientY + "px";

});

}

document.querySelectorAll(".card").forEach(card => {

card.addEventListener("click", function (e) {

const ripple = document.createElement("span");

ripple.className = "ripple";

const size = Math.max(this.clientWidth, this.clientHeight);

ripple.style.width = size + "px";
ripple.style.height = size + "px";

const rect = this.getBoundingClientRect();

ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
ripple.style.top = (e.clientY - rect.top - size / 2) + "px";

this.appendChild(ripple);

setTimeout(() => {

ripple.remove();

}, 700);

});

});

document.querySelectorAll(".card").forEach(card => {

card.addEventListener("click", function () {

this.classList.add("clicked");

});

});