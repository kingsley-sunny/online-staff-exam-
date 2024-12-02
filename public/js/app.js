// JavaScript
import "flowbite";

document.getElementById("welcome").innerText += " Editors";

function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  navLinks.classList.toggle("active");
}
