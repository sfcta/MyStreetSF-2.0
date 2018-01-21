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
      </div>

      <div id="search-panel">
        <hr style="margin-bottom:-5px;" />

        <div id="longchart">
            <div class="ui active dimmer">
              <div class="ui text loader">Loading</div>
            </div>
        </div>
      </div>

      <div class="bottom-panel">

      <div class="pickers">
          <!--
            <h5 style="margin-top:10px">CHOOSE YEAR:</h5>
            <vue-slider v-bind="timeSlider" v-model="sliderValue"></vue-slider>

            <h5>CHOOSE TIME PERIOD:</h5>
            <button v-on:click="pickAM"
                    v-bind:class="{ active: isAMActive, yellow: isAMActive}"
                     class="mini ui grey button">
                     AM</button>
            <button v-on:click="pickPM"
                    v-bind:class="{ active: isPMActive, yellow: isPMActive }"
                     class="mini ui grey button">
                     PM</button>
            -->
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
              <img class="img-logo" src="/images/sfcta-logo-144.png" width="64">
            </a>
          </td>
        </tr></table>
      </div>
  </div>

  <div id="sfmap"></div>

</div>

<script src="/lib/main.bundle.js"></script>
