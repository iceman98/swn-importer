(()=>{"use strict";class t extends Application{constructor(t){super(),this.importer=t,this.initializeState()}static get defaultOptions(){const t=super.defaultOptions;return mergeObject(t,{popOut:!0,minimizable:!0,resizable:!0,height:"auto",id:"swn-importer-dialog",template:"modules/swn-importer/templates/dialog.html",title:"Import Sector Without Numbers sector"})}initializeState(){this.state={importEnabled:!1}}getData(){return this.state}activateListeners(t){const e=t.find("#swn-importer-file-input")[0],n=t.find("#swn-importer-import-button")[0];t.on("change","#swn-importer-file-input",(t=>{const r=e.files;(null==r?void 0:r.length)?n.removeAttribute("disabled"):n.setAttribute("disabled","disabled")})),t.on("click","#swn-importer-import-button",(t=>{var n;const r=URL.createObjectURL(null===(n=e.files)||void 0===n?void 0:n.item(0));this.importer.importFile(r,{}),this.close()})),t.on("click","#swn-importer-cancel-button",(t=>{this.close()}))}}class e{static getLabel(t){return game.i18n.localize(this.LOCALIZATION_NAMESPACE+"."+t)}static formatLabel(t,e){return game.i18n.format(this.LOCALIZATION_NAMESPACE+"."+t,e)}static getEntityFlags(t){const e={};return e[this.MODULE_ID+".id"]=t.id,e[this.MODULE_ID+".type"]=t.type,e}static getAsList(t){return t?t instanceof Array?t:[t]:[]}static filterByTagId(t,e){return t.filter((t=>t.getFlag(this.MODULE_ID,"id")===e))}static forEachEntityType(t,e,n){let r;switch(e){case"all":r=["asteroidBase","asteroidBelt","blackHole","deepSpaceStation","gasGiantMine","moon","moonBase","orbitalRuin","planet","refuelingStation","researchBase","sector","spaceStation","system"];break;case"only-basic":r=["asteroidBase","asteroidBelt","deepSpaceStation","gasGiantMine","moon","moonBase","orbitalRuin","planet","refuelingStation","researchBase","spaceStation"];break;case"only-systems":r=["blackHole","system"]}r.forEach((e=>{const r=t[e];n(e,r)}))}static forEachEntity(t,e,n){this.forEachEntityType(t,e,((t,e)=>{e.forEach(((e,r,a)=>{n(r,e,t)}))}))}static getSectorCoordinates(t,e){return(t<10?"0"+t:t.toString())+(e<10?"0"+e:e.toString())}static getImagePath(t){return`modules/${this.MODULE_ID}/images/${t}`}static getTemplatePath(t){return`modules/${this.MODULE_ID}/templates/${t}`}static getMapValues(t){const e=[];return t.forEach(((t,n,r)=>{e.push(t)})),e}}e.MODULE_ID="swn-importer",e.LOCALIZATION_NAMESPACE="SWN-IMPORTER";const n=2*7500**.5,r=n/2,a=.55*100;class i{constructor(){this.dialog=new t(this)}removeExistingData(){var t,e,n,r;(null===(t=game.user)||void 0===t?void 0:t.isGM)&&(null===(e=game.folders)||void 0===e||e.forEach((t=>t.delete())),null===(n=game.journal)||void 0===n||n.forEach((t=>t.delete())),null===(r=game.scenes)||void 0===r||r.forEach((t=>t.delete())))}initUI(t){var n;if(null===(n=game.user)||void 0===n?void 0:n.isGM){const n=`\n                <button id='swn-import-button' title='${e.getLabel("IMPORT-BUTTON-TOOLTIP")}'>\n                    <i class='fas fa-cloud-download-alt'></i>\n                    ${e.getLabel("IMPORT-BUTTON-NAME")}\n                </button>\n            `;t.find(".header-actions").append(n),t.on("click","#swn-import-button",(t=>this.openImportDialog()))}}openImportDialog(){this.dialog.render(!0)}importFile(t,n){var r;(null===(r=game.user)||void 0===r?void 0:r.isGM)&&fetch(t).then((t=>t.json())).then((t=>{const n={asteroidBase:new Map(Object.entries(t.asteroidBase)),asteroidBelt:new Map(Object.entries(t.asteroidBelt)),blackHole:new Map(Object.entries(t.blackHole)),deepSpaceStation:new Map(Object.entries(t.deepSpaceStation)),gasGiantMine:new Map(Object.entries(t.gasGiantMine)),moon:new Map(Object.entries(t.moon)),moonBase:new Map(Object.entries(t.moonBase)),note:null,orbitalRuin:new Map(Object.entries(t.orbitalRuin)),planet:new Map(Object.entries(t.planet)),refuelingStation:new Map(Object.entries(t.refuelingStation)),researchBase:new Map(Object.entries(t.researchBase)),sector:new Map(Object.entries(t.sector)),spaceStation:new Map(Object.entries(t.spaceStation)),system:new Map(Object.entries(t.system))};return e.forEachEntity(n,"all",((t,e,n)=>{e.id=t,e.type=n})),this.processSector(n)})).then((t=>{var n,r;new Dialog({title:e.getLabel("RESULT-DIALOG-TITLE"),content:e.formatLabel("RESULT-DIALOG-CONTENT",{sectorName:null===(n=t.sectorData)||void 0===n?void 0:n.sector.values().next().value.name,journals:null===(r=t.entityJournals)||void 0===r?void 0:r.length}),buttons:{ok:{icon:'<i class="fas fa-check"></i>',label:e.getLabel("ACCEPT-BUTTON")}},default:"ok"}).render(!0)}))}preprocessEntity(t,e){t[e].forEach(((t,n,r)=>{t.id=n,t.type=e}))}processSector(t){const e={};return Promise.resolve(t).then((n=>(e.sectorData=n,e.groupedEntities=this.getGroupedEntities(t),this.createSectorJournalFolder(n)))).then((n=>(e.sectorJournalFolder=n,this.createSystemJournalFolders(t,n)))).then((n=>(e.systemJournalFolders=n,this.createJournals(t,e.sectorJournalFolder,n)))).then((n=>(e.entityJournals=n,this.createScene(t,n)))).then((t=>(e.scene=t,this.updateJournalContent(e.sectorData,e.groupedEntities,e.entityJournals)))).then((t=>Promise.resolve(e)))}updateJournalContent(t,e,n){const r=[];return e.forEach(((t,a,i)=>{t.forEach((t=>{r.push(this.getJournalUpdate(e,a,t.id,n))}))})),r.push(this.getSectorJournalUpdate(t,n)),Promise.all(r.filter((t=>null!=t))).then((t=>JournalEntry.updateDocuments(t)))}getSectorJournalUpdate(t,n){const r=[];e.forEachEntity(t,"only-systems",((t,e,n)=>{r.push(e)}));const a=t.sector.values().next().value,i=this.getEntityTemplate("sector"),o=this.getEntityTemplateData(r,a,a,n),s=e.filterByTagId(n,a.id);if(s.length){const t=s[0];return renderTemplate(i,o).then((e=>({_id:t.id,content:e})))}return null}getJournalUpdate(t,n,r,a){const i=t.get(n);if(null!=i){const t=i.filter((t=>t.id===r));if(t.length){const r=t[0],o=e.filterByTagId(a,r.id);if(o.length){const t=o[0],e=i.filter((t=>t.id===n));if(e.length){const n=e[0];return this.getJournalContent(i,n,r,a).then((e=>({_id:t.id,content:e})))}}}}return null}getJournalContent(t,e,n,r){const a=this.getEntityTemplate(n.type),i=this.getEntityTemplateData(t,e,n,r);return renderTemplate(a,i)}getEntityTemplateData(t,n,r,a){const i=t.filter((t=>t.parent===r.id)).map((t=>{const n={name:t.name,type:this.getTypeName(t.type),orbiting:!1,link:this.getJournalLink(a,t.id)};if("x"in t){const r=t;n.position=e.getSectorCoordinates(r.x-1,r.y-1)}return n}));return{...r,type:this.getTypeName(r.type),orbiting:!("moonBase"===r.type||"researchBase"===r.type),parentIsEntity:!("system"===r.parentEntity||"blackHole"===r.parentEntity),parentLink:this.getJournalLink(a,r.parent),parentType:this.getTypeName(r.parentEntity),systemLink:this.getJournalLink(a,n.id),systemType:this.getTypeName(n.type),sunType:"system"===r.parentEntity?"SUN":"BLACK HOLE",sunName:n.name,children:i}}getJournalLink(t,n){const r=e.filterByTagId(t,n);return r.length?r[0].link:null}getEntityTemplate(t){return"sector"===t?e.getTemplatePath("sector.html"):"system"===t||"blackHole"===t?e.getTemplatePath("sun.html"):e.getTemplatePath("entity.html")}createScene(t,n){const r=t.sector.values().next().value,a=this.getSectorNotes(t,n),i={active:!0,backgroundColor:"#01162c",drawings:this.getSectorLabels(t),flags:e.getEntityFlags(r),grid:200,gridAlpha:.3,gridColor:"#99caff",gridDistance:1,gridType:CONST.GRID_TYPES.HEXODDQ,gridUnits:e.getLabel("HEX-UNIT-NAME"),height:this.getSceneHeight(r.rows),img:e.getImagePath("starField.png"),name:e.formatLabel("SCENE-NAME",{name:r.name}),padding:0,notes:a,width:this.getSceneWidth(r.columns)};return Scene.create(i)}getSectorLabels(t){const n=[],r=t.sector.values().next().value;for(let t=0;t<r.rows;t++)for(let a=0;a<r.columns;a++){const r=this.getHexCenterPosition(a,t),i={x:r.x,y:Math.floor(r.y+77.94228634059948),text:e.getSectorCoordinates(a,t),fontSize:16};n.push(i)}return n}getSectorNotes(t,e){const n=[];return this.getGroupedEntities(t).forEach(((r,a,i)=>{const o=this.getSystemById(t,a);o&&n.push(...this.getSystemNotes(o,e,r))})),n}getSystemNotes(t,e,n){const r=[],a=n.filter((e=>e!=t));for(let n=0;n<a.length;n++){const i=this.createEntityNote(t,e,a[n],a.length,n);i&&r.push(i)}const i=this.createEntityNote(t,e);return i&&r.push(i),r}getSystemById(t,e){const n=[];n.push(...t.system.values()),n.push(...t.blackHole.values());const r=n.filter((t=>t.id===e));return r.length?r[0]:null}getGroupedEntities(t){const n=new Map;t.system.forEach(((t,e,r)=>{n.set(e,[t])})),t.blackHole.forEach(((t,e,r)=>{n.set(e,[t])})),e.forEachEntity(t,"only-basic",((e,r,a)=>{var i;const o=this.getContainingSystemId(t,r);o&&(null===(i=n.get(o))||void 0===i||i.push(r))}));const r=new Map;return n.forEach(((t,e,n)=>{r.set(e,this.getSortedEntityArray(t))})),r}getSortedEntityArray(t){const e=[];if(t.filter((t=>"system"===t.type&&"sector"===t.parentEntity)).forEach((t=>e.push(t))),t.filter((t=>"blackHole"===t.type&&"sector"===t.parentEntity)).forEach((t=>e.push(t))),t.filter((t=>"planet"===t.type&&"system"===t.parentEntity)).forEach((n=>{e.push(n),t.filter((t=>"moon"===t.type&&t.parent===n.id)).forEach((n=>{e.push(n),t.filter((t=>"moonBase"===t.type&&t.parent===n.id)).forEach((t=>e.push(t))),t.filter((t=>"researchBase"===t.type&&t.parent===n.id)).forEach((t=>e.push(t))),t.filter((t=>"orbitalRuin"===t.type&&t.parent===n.id)).forEach((t=>e.push(t))),t.filter((t=>"refuelingStation"===t.type&&t.parent===n.id)).forEach((t=>e.push(t)))})),t.filter((t=>"researchBase"===t.type&&t.parent===n.id)).forEach((t=>e.push(t))),t.filter((t=>"gasGiantMine"===t.type&&t.parent===n.id)).forEach((t=>e.push(t))),t.filter((t=>"refuelingStation"===t.type&&t.parent===n.id)).forEach((t=>e.push(t))),t.filter((t=>"spaceStation"===t.type&&t.parent===n.id)).forEach((t=>e.push(t))),t.filter((t=>"orbitalRuin"===t.type&&t.parent===n.id)).forEach((t=>e.push(t)))})),t.filter((t=>"asteroidBelt"===t.type&&"system"===t.parentEntity)).forEach((n=>{e.push(n),t.filter((t=>"asteroidBase"===t.type&&t.parent===n.id)).forEach((t=>e.push(t))),t.filter((t=>"refuelingStation"===t.type&&t.parent===n.id)).forEach((t=>e.push(t))),t.filter((t=>"spaceStation"===t.type&&t.parent===n.id)).forEach((t=>e.push(t)))})),t.filter((t=>"refuelingStation"===t.type&&"system"===t.parentEntity)).forEach((t=>e.push(t))),t.filter((t=>"refuelingStation"===t.type&&"blackHole"===t.parentEntity)).forEach((t=>e.push(t))),t.filter((t=>"researchBase"===t.type&&"system"===t.parentEntity)).forEach((t=>e.push(t))),t.filter((t=>"researchBase"===t.type&&"blackHole"===t.parentEntity)).forEach((t=>e.push(t))),t.filter((t=>"deepSpaceStation"===t.type&&"system"===t.parentEntity)).forEach((t=>e.push(t))),t.filter((t=>"deepSpaceStation"===t.type&&"blackHole"===t.parentEntity)).forEach((t=>e.push(t))),e.length!=t.length)throw console.log(t,e),new Error("Some entity is not linked with its parent");return e}getSceneWidth(t){return Math.floor(150*t+50)}getSceneHeight(t){return Math.floor((t+1)*n)}createEntityNote(t,e,n,r,a){const i=this.getIconPosition(t,r,a);return i?{entryId:this.getJournalEntry(e,n?n.id:t.id),x:i.x,y:i.y,icon:this.getEntityIcon(n?n.type:t.type),iconSize:32,text:n?n.name:t.name,fontSize:32,textAnchor:i.tooltipPosition,iconTint:this.getIconTint(n?n.type:t.type)}:null}getIconTint(t){return"#ffffff"}getRandomColor(t,e){const n=hexToRGB(colorStringToHex(t));for(let t=0;t<3;t++){const r=Math.floor(Math.random()*e)-e/2;n[t]=n[t]+r,n[t]=Math.min(n[t],255),n[t]=Math.max(n[t],0)}return hexToRGBAString(rgbToHex(n))}getJournalEntry(t,n){const r=e.filterByTagId(t,n);return r.length?r[0].id:null}getEntityIcon(t){return e.getImagePath(t+".png")}getIconPosition(t,e,n){const r=this.getHexCenterPosition(t.x-1,t.y-1);let a={x:0,y:0},i=CONST.TEXT_ANCHOR_POINTS.CENTER;if(null!=e&&null!=n){const t=n*(2*Math.PI/e);i=t<=1/4*Math.PI?CONST.TEXT_ANCHOR_POINTS.RIGHT:t<=3/4*Math.PI?CONST.TEXT_ANCHOR_POINTS.BOTTOM:t<=5/4*Math.PI?CONST.TEXT_ANCHOR_POINTS.LEFT:t<=7/4*Math.PI?CONST.TEXT_ANCHOR_POINTS.TOP:CONST.TEXT_ANCHOR_POINTS.RIGHT,a=this.getEntityOffset(t)}return{x:Math.floor(r.x+a.x),y:Math.floor(r.y+a.y),tooltipPosition:i}}getHexCenterPosition(t,e){let a=0;return t%2==0&&(a=r),{x:Math.floor(150*t+100),y:Math.floor(n*e+r+a)}}getEntityOffset(t){return{x:Math.cos(t)*a,y:Math.sin(t)*a}}getContainingSystem(t,e){const n=this.getContainingSystemId(t,e);if(n){const e=t.system.get(n),r=t.blackHole.get(n);return e||r||null}return null}createJournals(t,n,r){const a=[];return e.forEachEntityType(t,"all",((i,o)=>{a.push(...this.createEntityJournals(t,e.getMapValues(o),n,r))})),JournalEntry.create(a).then((t=>e.getAsList(t)))}createEntityJournals(t,n,r,a){return n.map((n=>({type:"JournalEntry",name:this.getJournalName(n),folder:this.getContainingSystemFolder(t,r,a,n),content:"Placeholder content for "+n.name,flags:e.getEntityFlags(n)})))}getContainingSystemFolder(t,n,r,a){if("sector"===a.type)return n.id;{const n=this.getContainingSystemId(t,a);if(n){const t=e.filterByTagId(r,n);return t.length?t[0].id:void 0}return}}getTypeName(t){switch(t){case"asteroidBase":return e.getLabel("ASTEROID-BASE");case"asteroidBelt":return e.getLabel("ASTEROID-BELT");case"blackHole":return e.getLabel("BLACK-HOLE");case"deepSpaceStation":return e.getLabel("DEEP-SPACE-STATION");case"gasGiantMine":return e.getLabel("GAS-GIANT-MINE");case"moon":return e.getLabel("MOON");case"moonBase":return e.getLabel("MOON-BASE");case"orbitalRuin":return e.getLabel("ORBITAL-RUIN");case"planet":return e.getLabel("PLANET");case"refuelingStation":return e.getLabel("REFUELING-STATION");case"researchBase":return e.getLabel("RESEARCH-BASE");case"sector":return e.getLabel("SECTOR");case"spaceStation":return e.getLabel("SPACE-STATION");case"system":return e.getLabel("SYSTEM");default:return null}}getJournalName(t){const n=this.getTypeName(t.type);return e.formatLabel("ENTITY-JOURNAL-NAME",{type:n,name:t.name})}createSystemJournalFolders(t,n){if(n){const r=[];return t.system.forEach(((t,a,i)=>{const o=e.formatLabel("SYSTEM-FOLDER-NAME",{name:t.name});r.push({name:o,type:"JournalEntry",parent:n,flags:e.getEntityFlags(t)})})),t.blackHole.forEach(((t,a,i)=>{const o=e.formatLabel("BLACK-HOLE-FOLDER-NAME",{name:t.name});r.push({name:o,type:"JournalEntry",parent:n,flags:e.getEntityFlags(t)})})),Folder.create(r).then((t=>e.getAsList(t)))}return Promise.resolve([])}createSectorJournalFolder(t){const n=t.sector.values().next().value,r=e.formatLabel("SECTOR-FOLDER-NAME",{name:n.name});return Folder.create({name:r,type:"JournalEntry",flags:e.getEntityFlags(n)})}getContainingSystemId(t,e){if(e.parentEntity){if("sector"===e.parentEntity)return e.id;if("system"===e.parentEntity||"blackHole"===e.parentEntity)return e.parent;{const n=t[e.parentEntity].get(e.parent);return n?this.getContainingSystemId(t,n):null}}return null}}let o;Hooks.once("init",(async()=>{o=new i})),Hooks.once("ready",(async()=>{})),Hooks.on("renderSceneDirectory",(function(t,e){o.initUI(e)}))})();