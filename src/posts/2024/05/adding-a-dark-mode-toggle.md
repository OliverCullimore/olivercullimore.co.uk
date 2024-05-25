---
title: "Adding a dark mode toggle"
date: 2024-05-25
tags: ["post","Web","HTML","CSS","JavaScript"]
description: "I decided to add a dark mode toggle to my site which persists between pages and uses the browser’s default setting; all without adding external dependencies. I settled on using JavaScript to detect t…"
thumbnail: "/images/posts/9c4157a6-adding-a-dark-mode-toggle-thumbnail.png"
---

## The Challenge


I decided to add a dark mode toggle to my site which persists between pages and uses the browser’s default setting; all without adding external dependencies.


## The Solution


I settled on using JavaScript to detect the browser’s default settings, toggle between the modes and persist it between pages using local storage. I then utilised CSS variables to define dark mode as the default and light mode to override the variables.

The code for all this can be found in the CodePen below:


<figure><iframe src="https://codepen.io/olivercullimore/embed/xxNEXRa?default-tab=html%2Cresult" width="1200" height="600"></iframe><figcaption></figcaption></figure>

