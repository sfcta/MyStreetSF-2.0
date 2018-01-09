---
layout: default
title: Gallery - MyStreet SFCTA
section: PROJECT GALLERY
thumbnail: scrnshot.png
css:
  - '/main.css'
---
# Project Gallery

---
### Notable projects from around our city:

<table><tr>
<td><img src="/images/thumbnail.jpg" width="250"/><br/><b>Marquee Project #1</b></td>
<td><img src="/images/thumbnail.jpg" width="250"/><br/><b>Marquee Project #2</b></td>
<td><img src="/images/thumbnail.jpg" width="250"/><br/><b>Marquee Project #3</b></td>
</tr></table>

<br/>

---

# Project List
### in no particular order, for now

{% for prj in site.data.projects %}- [{{prj.project_name}}](/projects{{ prj.internal_link | datapage_url: dir | remove: ".html" }}/)
{% endfor%}
