---
layout: fullscreen
title: MyStreet SFCTA
section: "&nbsp;MAP&nbsp;"
css:
  - '/main.css'
---
<div id="container">

  <div id="panel">
    <div id="preheader">
      <hr/>
      <h3 class="apptitle">MyStreet SF</h3>
      <hr/>
    </div>

    <div class="information-panel"><div v-cloak>

      <br/>
      <h2> ${ infoTitle } </h2>
      <p> ${ infoDetails }</p>
      <div class="details-link" v-html="infoUrl"></div>

    </div></div>

    <div class="bottom-panel">

      <div class="pickers">
        <h5>NARROW BY PROJECT TYPE:</h5>
        <button v-bind:class="{ active: isAMActive, yellow: isAMActive}"
                class="small ui grey button">
                 Transit</button>
        <button v-bind:class="{ active: false, yellow: false}"
                class="small ui grey button">
                 Streets</button>
        <button v-bind:class="{ active: false, yellow: false}"
                class="small ui grey button">
                 Area Plans</button>

        <br/>

        <h5>FIND A PROJECT:</h5>
        <div class="ui icon inverted input" style="width:100%">
          <input type="text" placeholder="Search...">
          <i class="search icon"></i>
        </div>
        <br/>
        <br/>
      </div>
      <br>

      <!-- logo panel -->
      <hr style="margin: 0px 0px"/>

      <table id="table-logo"><tr>
        <td class="td-logo">
          <h4 class="agency"><b><a target="_blank" href="http://www.sfcta.org/">SAN FRANCISCO COUNTY TRANSPORTATION AUTHORITY</a></b></h4>
        </td>
        <td class="td-logo">
          <a class="agency-link" target="_blank" href="http://www.sfcta.org/">
            <img class="img-logo" src="/images/sfcta-logo-144.png" width="60">
          </a>
        </td>
      </tr></table>
    </div>
  </div>

  <div id="sfmap"></div>

</div>

<script src="/lib/main.bundle.js"></script>
