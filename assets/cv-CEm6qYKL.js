import"./modulepreload-polyfill-P2Xu9kJm.js";var e={titre:`Étudiant Bachelor Business International · Commerce & Relation client`,coord:[`07 83 11 74 70`,`<a href="mailto:romanbenoit74@gmail.com">romanbenoit74@gmail.com</a>`,`47 Rue des Mouettes, 74330 Épagny`],profil:`Étudiant en Bachelor Business International, orienté commerce et relation client, avec une expérience terrain en vente, restauration et logistique. À l’aise au contact des clients, motivé par la vente et le travail en équipe, ouvert à l’international grâce à un échange universitaire à Bangkok et à un anglais courant (C1).`,exp:[[`Vendeur`,`Castorama · mission d’intérim`,`Été 2026 · 3 mois`,[`Accueil et conseil des clients en magasin, orientation vers les produits adaptés à leurs projets.`,`Encaissement, mise en rayon et réassort ; maintien de l’organisation et de la propreté du rayon.`]],[`Stagiaire en restauration`,`Côté Sushi`,`2025 · 4 mois`,[`Service en salle, accueil et conseil des clients en environnement rapide.`,`Travail en équipe en période d’affluence.`]],[`Préparateur de commandes`,`Auchan Drive`,`2024 · 6 mois`,[`Préparation et contrôle des commandes clients dans le respect des délais et des consignes qualité.`]],[`Équipier polyvalent`,`McDonald’s Épagny`,`2022 – 2023 · 1 an`,[`Service client, préparation des commandes et polyvalence sur l’ensemble des postes de l’équipe.`]],[`Chantiers jeunes & stage d’observation`,`Ville d’Épagny · Canaille Spirit`,`2020 – 2022`,[`Chantiers jeunes municipaux : nettoyage et entretien d’espaces publics (étés 2021 et 2022).`,`Stage de 3<sup>e</sup> en distribution de jus : visite fournisseur, mise en rayon, étiquetage, aide à la comptabilité.`]]],form:[[`2026 – 2027`,`Bachelor Business International · 3<sup>e</sup> année`,`MBway`],[`2025 – 2026`,`Échange universitaire · 2<sup>e</sup> année BBI`,`Kasetsart University, Bangkok (Thaïlande)`],[`2024 – 2025`,`Bachelor Business International`,`Ipac Bachelor Factory, Seynod · développement commercial et marketing`],[`Juillet 2024`,`Baccalauréat STI2D`,`Mention assez bien`],[`Juillet 2021`,`Brevet d’initiation à l’aéronautique (BIA)`,`Mention assez bien`]],niveaux:{"Relation client & vente":85,"Sens du contact":90,"Esprit d’équipe":90,"Dynamisme & adaptabilité":85,"Excel & PowerPoint":90,"Google Workspace":80,Français:100,Anglais:85,Espagnol:20,"Mandarin & thaï":12},savoirEtre:[`Relation client & vente`,`Sens du contact`,`Esprit d’équipe`,`Dynamisme & adaptabilité`],outils:[`Excel & PowerPoint`,`Google Workspace`],langues:[[`Français`,`maternelle`],[`Anglais`,`C1 · courant`],[`Espagnol`,`A1`],[`Mandarin & thaï`,`notions`]]},t=e=>`<ul>${e.map(e=>`<li>${e}</li>`).join(``)}</ul>`;document.getElementById(`cv`).innerHTML=`
  <header class="tete">
    <img class="photo" src="./assets/photo.jpg" alt="">
    <div>
      <h1>Roman Benoit</h1>
      <p class="titre">${e.titre}</p>
      <p class="coord">${e.coord.join(`<i>·</i>`)}</p>
    </div>
  </header>
  <div class="corps">
    <main>
      <section><h2>Profil</h2><p>${e.profil}</p></section>
      <section><h2>Expériences professionnelles</h2>
        ${e.exp.map(([e,n,r,i])=>`<div class="ligne"><h3><span>${e}</span><span class="quand">${r}</span></h3><p class="ou">${n}</p>${t(i)}</div>`).join(``)}</section>
    </main>
    <aside>
      <section><h2>Compétences</h2>
        <h4>Savoir-être</h4>${t(e.savoirEtre)}
        <h4>Outils</h4>${t(e.outils)}</section>
      <section><h2>Langues</h2>
        <ul class="langues">${e.langues.map(([e,t])=>`<li><b>${e}</b><span>${t}</span></li>`).join(``)}</ul></section>
      <section><h2>Formation</h2>
        ${e.form.map(([e,t,n])=>`<div class="form"><p class="quand">${e}</p><p><b>${t}</b></p><p class="ou">${n}</p></div>`).join(``)}</section>
    </aside>
  </div>`,await document.querySelector(`.photo`).decode().catch(()=>{}),await document.fonts.ready,document.body.dataset.ready=`1`;