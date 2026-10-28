/* Presentational integration. Existing views, forms, API calls and business rules remain in index.html. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const count=(n,singular,plural=singular+'s')=>n+' '+(n===1?singular:plural);
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const spaces=[
  {id:'suivi',title:'Vue d’ensemble',description:'La journée, les tâches et les rappels',views:['dashboard','taches','rappels'],art:[45,291,410,145]},
  {id:'vignoble',title:'Vignoble',description:'Parcelles, carte, parcours et traitements',views:['parcelles','carte','parcours','traitements','calc'],art:[524,287,410,145]},
  {id:'cave',title:'Cave',description:'Barriques, cuvées et ouillage',future:true,futureDescription:'Les contenants, les cuvées et le suivi de l’ouillage seront regroupés ici.',art:[991,307,410,130]},
  {id:'commercial',title:'Commercial',description:'Clients, commandes et ventes',future:true,futureDescription:'Les clients, commandes et disponibilités seront regroupés ici.',art:[43,581,350,145]},
  {id:'stocks',title:'Stocks',description:'Produits et disponibilités',views:['produits'],art:[525,573,410,145]},
  {id:'materiel',title:'Matériel',description:'Véhicules, équipements et entretien',future:true,futureDescription:'Les véhicules, tracteurs, drones et outils du domaine seront regroupés ici, avec leurs fiches et leur suivi d’entretien.',image:'/assets/materiel.7b86d17b48bb.webp',art:[110,195,1320,600],sourceSize:[1536,1024],clipPath:'M110 195H1205V340H1430V740H1060V795H800V735H110Z'},
  {id:'administration',title:'Administration',description:'Équipe, exports et sauvegardes',views:['membres','administration'],art:[993,576,410,145]},
  {id:'wiki',title:'Wiki',description:'Cépages et connaissances de la vigne',views:['wiki'],image:'/assets/wiki-grimoire.06d78bee4bd2.webp'}
 ];
 const labels={...VIEW_TITLES,dashboard:'Aujourd’hui',calc:'Calculateur',produits:'Produits & stock',membres:'Équipe',administration:'Exports & sauvegardes',parametres:'Paramètres'};
 const allowed=view=>{
  if(!currentDomaine)return false;
  if(view==='parametres')return Boolean(currentUser);
  if(view==='administration')return peut('export_registre');
  const button=document.querySelector('#sidebar .sidebar-link[data-view="'+view+'"]');
  return Boolean(button&&button.style.display!=='none');
 };
 const permittedSpaces=()=>spaces.filter(s=>s.future||s.views.some(allowed));
 const currentView=()=>document.querySelector('.view.active')?.id.replace('view-','');
 function userName(){const member=cache.membres.find(m=>m.user_id===currentUser?.id);return member?.prenom||currentUser?.user_metadata?.prenom||currentUser?.email?.split('@')[0]||'Mon compte';}
 function userInitials(){const member=cache.membres.find(m=>m.user_id===currentUser?.id);const surname=member?.nom||currentUser?.user_metadata?.nom||'';return (userName().charAt(0)+surname.charAt(0)).toLocaleUpperCase('fr-FR');}
 function syncHeader(){
  if(!currentDomaine)return;
  $('ov-domain').textContent=currentDomaine.nom;
  const name=userName();$('ov-user-name').textContent=name;$('ov-avatar').textContent=userInitials();$('ov-user').title='Mon compte · '+name;$('ov-user').setAttribute('aria-label','Mon compte · '+name);
  const canReadReminders=allowed('rappels'),pendingReminders=canReadReminders?cache.rappels.filter(r=>!r.fait).length:0;
  $('ov-reminders').hidden=!canReadReminders;$('ov-reminder-dot').hidden=pendingReminders===0;
  $('ov-reminders').setAttribute('aria-label','Consulter les rappels · '+count(pendingReminders,'rappel')+' en cours');$('ov-reminders').title=count(pendingReminders,'rappel')+' en cours';
  const dark=getCurrentTheme()==='dark';$('ov-theme').innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(dark?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>':'<path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.3 8.3 0 1 0 20 14.5z"/>')+'</svg>';
  const themeLabel=document.createElement('span');themeLabel.className='ov-tool-label';themeLabel.setAttribute('aria-hidden','true');themeLabel.textContent='Thème';$('ov-theme').append(themeLabel);
  $('ov-theme').title=dark?'Passer en mode clair':'Passer en mode sombre';$('ov-theme').setAttribute('aria-label',$('ov-theme').title);
 }
 function context(view){
  $('app').dataset.ovView=view;
  const space=spaces.find(s=>s.views?.includes(view));
  $('ov-context').hidden=view==='espaces';$('ov-tabs').hidden=!space;
  $('ov-space-name').textContent=space?.title||(view==='parametres'?'Paramètres':'À venir');
  if(view==='parametres')$('ov-settings').setAttribute('aria-current','page');else $('ov-settings').removeAttribute('aria-current');
  $('ov-tabs').innerHTML=space?space.views.filter(allowed).map(v=>`<button data-ov-view="${v}" ${v===view?'aria-current="page"':''}>${labels[v]}</button>`).join(''):'';
  syncHeader();
 }
 function resetViews(view){
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id==='view-'+view));
  document.querySelectorAll('#sidebar .sidebar-link').forEach(el=>el.classList.remove('active'));
  context(view);window.scrollTo(0,0);
 }
 function art(space){
  if(space.image&&!space.art)return `<div class="ov-art" aria-hidden="true"><img src="${space.image}" alt="" loading="lazy" decoding="async"></div>`;
  // Frame the approved artwork without redrawing it or repeating its mockup text/badge.
  const [x,y,w,h]=space.art,[sourceWidth,sourceHeight]=space.sourceSize||[1448,1086];
  const clip=space.clipPath?`<path d="${space.clipPath}"/>`:`<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  return `<div class="ov-art" aria-hidden="true"><svg viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid ${space.image?'meet':'slice'}"><defs><clipPath id="ov-art-${space.id}">${clip}</clipPath></defs><image href="${space.image||'/assets/espaces.972b33f112e2.png'}" width="${sourceWidth}" height="${sourceHeight}" clip-path="url(#ov-art-${space.id})"/></svg></div>`;
 }
 function spaceCard(space,featured=false){
  const library=space.id==='wiki',wide=featured||library;
  const cta=library?'Ouvrir le grimoire':allowed('dashboard')?'Ouvrir le tableau de bord':'Voir le suivi';
  return `<button class="ov-card${featured?' ov-domain-card':library?' ov-wiki-card':''}" data-ov-space="${space.id}" aria-label="${space.title}${space.future?' — À venir':''}">
   ${space.future?'<span class="ov-future">À venir</span>':''}${art(space)}
   <div class="ov-card-copy"><div>${featured?'<span class="ov-domain-eyebrow">Votre point quotidien</span>':''}<h2>${space.title}</h2><p>${space.description}</p></div>
    ${wide?`<span class="ov-domain-link">${cta}<span aria-hidden="true">→</span></span>`:'<span class="ov-arrow" aria-hidden="true">→</span>'}
   </div></button>`;
 }
 function ownTasks(){return cache.taches.filter(t=>(!estSaisonnier()||getTacheAssignes(t.id).includes(currentUser.id))&&['a_faire','en_cours'].includes(t.statut));}
 function renderHome(){
  if(!currentDomaine)return;
  const taches=ownTasks(),rappels=allowed('rappels')?cache.rappels.filter(r=>!r.fait):[];
  const meta=[];
  if(peut('parcelles_voir')){meta.push(count(cache.parcelles.length,'parcelle'));meta.push(new Intl.NumberFormat('fr-FR',{maximumFractionDigits:4}).format(cache.parcelles.reduce((s,p)=>s+Number(p.surface||0),0))+' ha');}
  meta.push(count(taches.length,'tâche')+' à suivre');if(allowed('rappels'))meta.push(count(rappels.length,'rappel'));
  const pending=[...taches.slice(0,3).map(t=>({title:t.titre||t.nom||'Tâche à suivre',subtitle:t.date_prevue?fmtDate(t.date_prevue):'Travail à suivre',view:'taches'})),...rappels.slice(0,3).map(r=>({title:r.titre||r.texte||r.contenu||'Rappel à consulter',subtitle:'Rappel du domaine',view:'rappels'}))].slice(0,3);
  const today=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const visibleSpaces=permittedSpaces(),overview=visibleSpaces.find(s=>s.id==='suivi'),wiki=visibleSpaces.find(s=>s.id==='wiki');
  $('view-espaces').innerHTML=`
   <div class="ov-home-head"><div><h1>Votre domaine</h1><p>${escape(today.charAt(0).toUpperCase()+today.slice(1))} · ${escape(currentDomaine.nom)}</p><div class="ov-home-meta">${meta.map(s=>`<span>${escape(s)}</span>`).join('')}</div></div></div>
   ${overview?spaceCard(overview,true):''}
   <div class="ov-grid" aria-label="Les espaces du domaine">${visibleSpaces.filter(s=>!['suivi','wiki'].includes(s.id)).map(s=>spaceCard(s)).join('')}</div>
   ${wiki?spaceCard(wiki):''}
   <section class="ov-follow"><div class="ov-follow-head"><div><h2>À ne pas manquer</h2><small>Le travail et les rappels du domaine</small></div><button class="ov-text" data-ov-view="${allowed('dashboard')?'dashboard':'taches'}">Tout le suivi →</button></div><div class="ov-follow-grid">${pending.map(item=>`<button class="ov-follow-item" data-ov-view="${item.view}"><small>${escape(item.subtitle)}</small><strong>${escape(item.title)}</strong></button>`).join('')||'<p class="ov-empty">Aucun travail ni rappel en attente.</p>'}</div></section>
   <div class="ov-home-actions"><div class="ov-links">${allowed('carte')?'<button data-ov-view="carte">⌖ Ouvrir la carte</button>':''}${allowed('calc')?'<button data-ov-view="calc">Préparer un traitement</button>':''}</div>${canCreate()?'<button class="ov-primary" data-ov-action="new">+ Nouvelle action</button>':''}</div>
   <footer class="ov-footer"><div class="ov-links"><button data-ov-action="profile">Mon compte</button></div><span>Ordo Vitis · Le cahier du vigneron</span></footer>`;
 }
 function home(){if(!currentDomaine)return;close();resetViews('espaces');renderHome();document.title='Votre domaine · Ordo Vitis';}
 function navigate(view){
  if(!allowed(view)){toast('Cette rubrique n’est pas accessible avec vos droits.');return false;}
  close();
  if(view==='parametres'){settings();return true;}
  if(view==='administration'){administration();return true;}
  const button=document.querySelector('#sidebar .sidebar-link[data-view="'+view+'"]');
  button.click();context(view);window.scrollTo(0,0);
  // Leaflet needs to know its new container size after switching layouts.
  if(view==='carte')window.dispatchEvent(new Event('resize'));
  return true;
 }
 function openSpace(id){const s=spaces.find(s=>s.id===id);if(!s)return;if(s.future){future(s);return;}const v=s.views.find(allowed);if(v)navigate(v);}
 function administration(){
  if(!allowed('administration'))return;resetViews('administration');setPageTitle('administration');$('page-title').textContent='Exports & sauvegardes';
  $('view-administration').innerHTML=`<div class="ov-admin-grid">${allowed('membres')?'<button data-ov-view="membres"><strong>L’équipe du domaine</strong><span>Membres, rôles et invitations.</span></button>':''}<button data-ov-action="export"><strong>Exporter le registre</strong><span>Retrouver l’export CSV existant.</span></button><button data-ov-action="backup"><strong>Sauvegarde complète</strong><span>Conserver une copie des données de votre domaine.</span></button></div>`;
 }
 function future(s){close();resetViews('futur');$('page-title').textContent=s.title;$('page-date').textContent='À venir';document.title=s.title+' · Ordo Vitis';$('view-futur').innerHTML=`<div class="ov-info"><h2>Le futur espace ${escape(s.title)}</h2><p>${escape(s.futureDescription)} Cet espace indique la place prévue dans la nouvelle organisation ; ses fonctions ne sont pas encore intégrées à l’application.</p><button class="ov-outline" data-ov-action="home">← Revenir aux espaces</button></div>`;}
 let dialogTrigger=null;
 function dialog(title,body){$('ov-dialog-title').textContent=title;$('ov-dialog-body').innerHTML=body;if(!$('ov-dialog').open){dialogTrigger=document.activeElement;$('ov-dialog').showModal();}}
 // Compact controls are hidden while the dialog is open. Restore focus once CSS
 // has made the trigger visible again, without stealing focus from a new page/form.
 $('ov-dialog').addEventListener('close',()=>{
  const trigger=dialogTrigger;dialogTrigger=null;
  if($('ov-dialog').contains(document.activeElement))document.activeElement.blur();
  requestAnimationFrame(()=>{if(trigger?.isConnected&&!document.querySelector('.modal-overlay.active')&&(document.activeElement===document.body||$('ov-dialog').contains(document.activeElement))&&trigger.getClientRects().length&&getComputedStyle(trigger).visibility!=='hidden')trigger.focus({preventScroll:true});});
 });
 function close(){if($('ov-dialog').open)$('ov-dialog').close();}
 function choose(){dialog('Changer d’espace',`<div class="ov-dialog-list">${permittedSpaces().map(s=>`<button data-ov-space="${s.id}">${s.title}<small>${s.future?'À venir':s.description}</small></button>`).join('')}</div>`);}
 const settingsSections=[['compte','Mon compte'],['securite','Sécurité'],['apparence','Apparence'],['domaine','Le domaine']];
 let settingsSection='compte';
 function selectSettingsSection(section){
  if(currentView()!=='parametres'||!settingsSections.some(([id])=>id===section))return;
  const focusInPanel=Boolean(document.activeElement.closest('.ov-settings-panel'));
  settingsSection=section;
  document.querySelectorAll('#view-parametres [data-ov-settings]').forEach(button=>{if(button.dataset.ovSettings===section)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  document.querySelectorAll('.ov-settings-panel').forEach(panel=>panel.hidden=panel.id!=='ov-settings-'+section);
  if(focusInPanel){const heading=$('ov-settings-'+section).querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}
 }
 function syncSettingsTheme(){document.querySelectorAll('#view-parametres [data-ov-theme]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ovTheme===getCurrentTheme())));}
 function renderSettings(section=settingsSection){
  if(!allowed('parametres'))return;
  const member=cache.membres.find(m=>m.user_id===currentUser.id);
  const fullName=[member?.prenom||currentUser.user_metadata?.prenom,member?.nom||currentUser.user_metadata?.nom].filter(Boolean).join(' ')||userName();
  const role=currentDomaine.role==='admin'?'Administrateur':currentDomaine.role==='saisonnier'?'Saisonnier':'Salarié permanent';
  $('view-parametres').innerHTML=`<div class="ov-settings-layout">
   <nav class="ov-settings-nav" aria-label="Rubriques des paramètres">${settingsSections.map(([id,title])=>`<button data-ov-settings="${id}">${title}</button>`).join('')}</nav>
   <div class="ov-settings-content">
    <section class="ov-settings-panel" id="ov-settings-compte" aria-labelledby="ov-account-title">
     <div class="ov-settings-heading"><span class="ov-avatar ov-settings-avatar" aria-hidden="true">${escape(userInitials())}</span><div><h2 id="ov-account-title">Mon compte</h2><p>Vos informations personnelles et votre connexion.</p></div></div>
     <dl class="ov-settings-details"><div><dt>Nom affiché</dt><dd>${escape(fullName)}</dd></div><div><dt>Adresse mail de connexion</dt><dd>${escape(currentUser.email||'Non renseignée')}</dd></div></dl>
     <button class="ov-outline" data-ov-settings="securite">Sécurité du compte →</button>
     <div class="ov-settings-session"><div><h3>Session</h3><p>Fermer votre session sur cet appareil.</p></div><button class="ov-outline" data-ov-action="logout">Se déconnecter</button></div>
    </section>
    <section class="ov-settings-panel" id="ov-settings-securite" aria-labelledby="ov-security-title" hidden>
     <div class="ov-settings-heading"><div><h2 id="ov-security-title">Sécurité du compte</h2><p>Les prochains réglages pour gérer vos identifiants.</p></div></div>
     <div class="ov-setting-row"><div><h3>Changer d’adresse mail</h3><p>Choisir une nouvelle adresse pour vous connecter.</p></div><span class="ov-soon">À venir</span></div>
     <div class="ov-setting-row"><div><h3>Changer de mot de passe</h3><p>Renouveler votre mot de passe depuis cette page.</p></div><span class="ov-soon">À venir</span></div>
     <p class="ov-settings-note">Ces options seront ajoutées dans une prochaine étape. Vos identifiants actuels restent inchangés.</p>
    </section>
    <section class="ov-settings-panel" id="ov-settings-apparence" aria-labelledby="ov-appearance-title" hidden>
     <div class="ov-settings-heading"><div><h2 id="ov-appearance-title">Apparence</h2><p>Choisissez le thème qui vous convient sur cet appareil.</p></div></div>
     <div class="ov-theme-choices" role="group" aria-label="Thème de l’application">${[['light','Mode clair'],['dark','Mode sombre']].map(([theme,title])=>`<button data-ov-theme="${theme}" aria-pressed="false"><span class="ov-theme-preview ov-preview-${theme}" aria-hidden="true"><i></i><i></i><i></i></span><span>${title}</span><span class="ov-theme-check" aria-hidden="true">✓</span></button>`).join('')}</div>
     <p class="ov-settings-note">Ce choix est enregistré dans ce navigateur.</p>
    </section>
    <section class="ov-settings-panel" id="ov-settings-domaine" aria-labelledby="ov-estate-title" hidden>
     <div class="ov-settings-heading"><div><h2 id="ov-estate-title">Le domaine</h2><p>Votre domaine et les accès liés à votre rôle.</p></div></div>
     <dl class="ov-settings-details"><div><dt>Domaine</dt><dd>${escape(currentDomaine.nom)}</dd></div><div><dt>Votre rôle</dt><dd>${escape(role)}</dd></div></dl>
     <div class="ov-settings-links">
      ${allowed('membres')?'<button data-ov-view="membres"><span><strong>L’équipe du domaine</strong><small>Membres, rôles et invitations</small></span><span aria-hidden="true">→</span></button>':''}
      ${allowed('administration')?'<button data-ov-view="administration"><span><strong>Exports & sauvegardes</strong><small>Registre et copie des données</small></span><span aria-hidden="true">→</span></button>':''}
      ${allowed('wiki')?'<button data-ov-view="wiki"><span><strong>Wiki de la vigne</strong><small>Cépages et connaissances</small></span><span aria-hidden="true">→</span></button>':''}
     </div>
    </section>
   </div></div>`;
  selectSettingsSection(section);syncSettingsTheme();
 }
 function settings(){
  if(!allowed('parametres'))return;
  close();resetViews('parametres');setPageTitle('parametres');$('page-title').textContent='Paramètres';$('page-date').textContent='Votre compte, vos préférences et votre domaine';document.title='Paramètres · Ordo Vitis';renderSettings('compte');$('main-content').focus({preventScroll:true});
 }
 function account(){navigate('parametres');}
 function profile(){navigate('parametres');}
 function search(){
  dialog('Rechercher un module','<label for="ov-search" class="ov-dialog-note">Retrouver une rubrique de l’application</label><input id="ov-search" class="ov-search" placeholder="Parcelles, matériel, tâches…"><div class="ov-dialog-list" id="ov-results"></div>');
  const input=$('ov-search'),normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const show=()=>{
   const query=normalize(input.value);
   const views=Object.entries(labels).filter(([v,title])=>allowed(v)&&normalize(title).includes(query)).map(([v,title])=>`<button data-ov-view="${v}">${title}</button>`);
   const futureSpaces=permittedSpaces().filter(s=>s.future&&normalize(s.title).includes(query)).map(s=>`<button data-ov-space="${s.id}">${s.title}<small>À venir</small></button>`);
   $('ov-results').innerHTML=views.concat(futureSpaces).join('')||'<p class="ov-empty">Aucune rubrique trouvée.</p>';
  };
  input.oninput=show;show();input.focus();
 }
 const actions=[['parcelles_creer','parcelles','Nouvelle parcelle',()=>openParcelleModal()],['taches_creer','taches','Nouvelle tâche',()=>openTacheModal()],['traitements_creer','traitements','Nouveau traitement',()=>openTraitementModal()],['calculateur_utiliser','calc','Préparer un traitement',()=>navigate('calc')],['produits_modifier','produits','Nouveau produit',()=>openProduitModal()]];
 const canCreateReminder=()=>allowed('rappels')&&(estAdmin()||peut('traitements_creer'));
 const canCreate=()=>actions.some(([permission,view])=>peut(permission)&&allowed(view))||canCreateReminder();
 function newAction(){dialog('Nouvelle action',`<div class="ov-dialog-list">${actions.map(([permission,view,title],i)=>peut(permission)&&allowed(view)?`<button data-ov-create="${i}">${title}</button>`:'').join('')}${canCreateReminder()?'<button data-ov-action="reminder">Nouveau rappel</button>':''}</div>`);}
 document.addEventListener('click',event=>{
  const element=event.target.closest('button[data-ov-view],button[data-ov-space],button[data-ov-action],button[data-ov-create],button[data-ov-settings],button[data-ov-theme]');if(!element)return;
  if(element.dataset.ovSettings){selectSettingsSection(element.dataset.ovSettings);return;}
  if(element.dataset.ovTheme){const theme=element.dataset.ovTheme;if(!['light','dark'].includes(theme))return;try{localStorage.setItem('ov-theme',theme);}catch{}applyTheme(theme);return;}
  if(element.dataset.ovView)navigate(element.dataset.ovView);
  else if(element.dataset.ovSpace)openSpace(element.dataset.ovSpace);
  else if(element.dataset.ovCreate!==undefined){const action=actions[Number(element.dataset.ovCreate)];if(action&&peut(action[0])&&allowed(action[1])){close();action[3]();}}
  else {const action=element.dataset.ovAction;if(action==='new')newAction();if(action==='home')home();if(action==='account')account();if(action==='profile')profile();if(action==='theme')toggleTheme();if(action==='logout'){close();doLogout();}if(action==='reminder'&&canCreateReminder()){close();openRappelModal();}if(action==='export'&&peut('export_registre')){close();exportData();}if(action==='backup'&&peut('export_registre')){close();openSauvegardeComplete();}}
 });
 // Existing permission decisions remain authoritative for the new navigation.
 document.querySelectorAll('#sidebar .sidebar-link').forEach(btn=>btn.addEventListener('click',event=>{if(!allowed(btn.dataset.view)){event.preventDefault();event.stopImmediatePropagation();}},true));
 const oldTitle=setPageTitle;setPageTitle=function(view){oldTitle(view);context(view);};
 const oldRights=appliquerDroitsUI;appliquerDroitsUI=function(){oldRights();syncHeader();if(currentView()==='espaces')renderHome();if(currentView()==='parametres')renderSettings();};
 const oldScreen=showScreen;showScreen=function(screen){oldScreen(screen);if(screen==='app')queueMicrotask(home);else close();};
 const oldTheme=applyTheme;applyTheme=function(theme){oldTheme(theme);syncHeader();syncSettingsTheme();};
 const oldLoad=loadAllData;loadAllData=async function(){await oldLoad();syncHeader();if(currentView()==='espaces')renderHome();if(currentView()==='parametres')renderSettings();};
 const oldDashboard=renderDashboard;renderDashboard=function(){oldDashboard();if(currentView()==='espaces')renderHome();};
 const oldReminders=renderRappels;renderRappels=function(){oldReminders();syncHeader();if(currentView()==='espaces')renderHome();};
 const oldTasks=renderTaches;renderTaches=function(){oldTasks();if(currentView()==='espaces')renderHome();};
 gotoView=navigate;
 window.OVSpaces={home,navigate,openSpace,choose,account,profile,search,close,allowed,renderHome,syncHeader};
 if(currentDomaine&&$('app').classList.contains('active'))home();
})();
