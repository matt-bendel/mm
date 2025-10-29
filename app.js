// ====== Moonlit Bandanas — Shared App JS ======
/*
  Put this file next to your HTML files and include it with:
  <script src="/app.js"></script>

  Replace the Firebase config below ONCE.
*/

// -------- Firebase Config --------
const MB = (function(){
    const hasWindow = typeof window !== 'undefined';
    const searchParams = hasWindow ? new URLSearchParams((window.location && window.location.search) || '') : null;
    let debugFromQuery = null;
    if (searchParams && searchParams.has('debug')){
      const raw = searchParams.get('debug');
      debugFromQuery = !(raw && /^(0|false|off|no)$/i.test(raw));
    }
    const defaultDebug = hasWindow && (
      (window.location && window.location.protocol === 'file:') ||
      /^(localhost|127\.|0\.0\.0\.0)/.test((window.location && window.location.hostname) || '')
    );
    let debugMode = defaultDebug;
    if (debugFromQuery !== null) debugMode = debugFromQuery;
    if (hasWindow && typeof window.MB_FORCE_DEBUG !== 'undefined'){
      debugMode = !!window.MB_FORCE_DEBUG;
    }
    const DEBUG_MODE = !!debugMode;
    const DEBUG_NO_COOKIES = DEBUG_MODE;
    const volatileStore = {};
    const storage = {
      set(key, value){
        if (value === undefined){ this.remove(key); return; }
        if (DEBUG_MODE){
          volatileStore[key] = value;
          return;
        }
        try{
          if (hasWindow && window.localStorage) window.localStorage.setItem(key, value);
        }catch(e){}
      },
      get(key){
        if (DEBUG_MODE){
          return Object.prototype.hasOwnProperty.call(volatileStore, key) ? volatileStore[key] : '';
        }
        try{
          return (hasWindow && window.localStorage) ? (window.localStorage.getItem(key) || '') : '';
        }catch(e){
          return '';
        }
      },
      remove(key){
        if (DEBUG_MODE){
          delete volatileStore[key];
          return;
        }
        try{
          if (hasWindow && window.localStorage) window.localStorage.removeItem(key);
        }catch(e){}
      },
      clear(prefix){
        if (DEBUG_MODE){
          Object.keys(volatileStore).forEach(k=>{
            if (!prefix || k.startsWith(prefix)) delete volatileStore[k];
          });
          return;
        }
        try{
          if (!(hasWindow && window.localStorage)) return;
          if (!prefix){
            window.localStorage.clear();
            return;
          }
          const toRemove = [];
          for (let i=0;i<window.localStorage.length;i++){
            const k = window.localStorage.key(i);
            if (k && k.startsWith(prefix)) toRemove.push(k);
          }
          toRemove.forEach(k=> window.localStorage.removeItem(k));
        }catch(e){}
      }
    };

    if (DEBUG_MODE){
      storage.clear('mb_');
    }

    const firebaseConfig = {
      apiKey: "AIzaSyDNqVMgr5CHIe-ajgikCaJp0kzB2CpbOWs",
      authDomain: "murdermystery-cd241.firebaseapp.com",
      databaseURL: "https://murdermystery-cd241-default-rtdb.firebaseio.com",
      projectId: "murdermystery-cd241",
      storageBucket: "murdermystery-cd241.firebasestorage.app",
      messagingSenderId: "724748560349",
      appId: "1:724748560349:web:4ba1d4f5ed874419167834",
      measurementId: "G-7RS065D3HZ"
    };
    
    // expose config (optional)
    const getConfig = ()=> firebaseConfig;
  
    // Initialize Firebase once per page
    function initFirebase(){
      if (!window.firebase) throw new Error("Firebase SDK not loaded");
      if (firebase.apps && firebase.apps.length) return firebase.app();
      return firebase.initializeApp(firebaseConfig);
    }
  
    // -------- Utilities --------
    const $ = (id)=> document.getElementById(id);
    const hashSHA256 = async (text)=>{
      const enc = new TextEncoder().encode(text);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    };
    function setCookie(name,value,days){
      if (DEBUG_NO_COOKIES) return;
      const d=new Date(); d.setTime(d.getTime()+days*864e5);
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
    }
    function getCookie(name){
      if (DEBUG_NO_COOKIES) return '';
      const m=document.cookie.match(new RegExp('(^| )'+name+'=([^;]+)'));
      return m? decodeURIComponent(m[2]) : '';
    }
    function uid(room,name){ return btoa(`${name}::${room}`).replace(/=+$/,''); }
  
    // Default data
    const DEFAULT_TASKS = [
      "Learn two names and one hobby.",
      "Trade a small trinket or token with someone.",
      "Share one rumor or clue you’ve heard.",
      "Publicly vouch for or accuse exactly one person.",
      "Find someone who matches a clue and ask them about it."
    ];
    const DEFAULT_CHAR_OBJS = [
      {name:"V. M. Pyre", desc:"A traveling fire performer who picks up odd jobs setting safe flame effects for events. Pyre regularly tests candle prototypes for Ember Hollow and keeps Raven Cask supplied with clean-burning wicks for tasting nights. Pyre and Thorn Ever once settled a messy tab together, which earned them a quiet reputation for being reliable when money is tight."},
      {name:"Ashen Vale", desc:"A level-headed apothecary who stocks practical remedies and tracks who needs a check-in. Ashen reminds Mist Graves to keep a night cord handy and swaps herb bundles with Ivy Haze during early market hours. When supplies run short, Ashen coordinates with Crypt Alder to restock without drama."},
      {name:"Gloom Ivy", desc:"A lantern carver who favors sturdy casings and bright, even light. Ivy buys glass panes from Cinder Wight and experiments with Sable Nyx to see how fragrance travels in different lighting. Ivy and Rune Lantern exchange simple fixes for wicks and hinges to keep shops safe."},
      {name:"Hex Rowan", desc:"A confident host for cards and dice who keeps rules clear and posted. Hex sets up at Ebon Thatch’s inn and asks Patch Wylde to shuffle and cut so players trust the deck. On busy nights, Hex asks Slate Crowe to jot down payouts to avoid misunderstandings."},
      {name:"Noct Rune", desc:"A quiet note taker who walks late routes with Lumen Wolfe and writes short, factual summaries each dawn. Noct files incident notes with Slate Crowe and keeps an eye on alley lamps from Rune Lantern’s workshop. When Dusk Mariner drops off sealed envelopes, Noct logs the handoff without opening them."},
      {name:"Cinder Wight", desc:"A patient glassblower who prefers stable heat, clear glass, and clean lines. Cinder supplies Ivy with panes that fit snugly and sells Ember Hollow jars sturdy enough for transport. During tastings at Ebon Thatch, Cinder sticks to water and leaves early to prep the morning kiln."},
      {name:"Marrow Quinn", desc:"A careful sketcher who is known for clean diagrams, labels, and practical notes. Marrow checks in with Ashen Vale about anatomy references for small injuries and works with Crypt Alder to keep labeled storage in order. When others argue, Marrow listens and sketches layouts to help people agree on next steps."},
      {name:"Ebon Thatch", desc:"A steady innkeeper who keeps seating fair and accounts simple. Ebon sets Hex Rowan’s games away from the bottleneck, puts Patch Wylde near the door, and tries Raven Cask’s new brews on quiet nights. When tensions rise, Ebon moves people around before problems start."},
      {name:"Sable Nyx", desc:"A perfumer who focuses on pleasant, practical blends for crowded rooms. Sable tests how scent travels in Gloom Ivy’s lantern light and buys unusual ingredients from Dusk Mariner when the ferry comes in. Sable keeps small samples for Ember Hollow to trial with long-burn candles."},
      {name:"Thorn Ever", desc:"A straightforward bookkeeper who balances tabs, posts totals, and closes accounts calmly. Thorn respects Slate Crowe’s record system and once helped V. M. Pyre straighten out an old debt with fair terms. When people disagree about who owes what, Thorn lays out the numbers without judgment."},
      {name:"Cob Webber", desc:"A practical maker of latches, traps, and hooks for storerooms and shops. Cob fits cellar locks for Ebon Thatch and builds sturdy hardware for Rune Lantern’s workbench. Night Jar often buys packaging hooks from Cob for fragile curios that don’t travel well."},
      {name:"Hallow Reed", desc:"A folk singer with a clear voice and steady tempo. Hallow performs with Piper Shade on quieter evenings and occasionally asks Echo Vane for factual checks before turning rumors into lyrics. Hallow keeps sets short when the room is tense and gives space to conversations when needed."},
      {name:"Mist Graves", desc:"A kind, reserved sleepwalker who keeps a night cord on the wrist to stay safe. Mist checks in with Ashen Vale about sleep habits and appreciates Noct Rune’s practical notes about safer routes home. Mist stores extra rope from Dusk Mariner for foggy nights."},
      {name:"Piper Shade", desc:"A flute seller and reliable accompanist who keeps time without stealing the spotlight. Piper plays with Hallow Reed on request and buys durable lamps from Rune Lantern for late packing. Piper and Ebon Thatch coordinate start times so music never interrupts announcements."},
      {name:"Rune Lantern", desc:"A lantern repairer and tinkerer who keeps affordable lamps on hand for homes and shops. Rune tests wicks for Ember Hollow and shows Gloom Ivy how to avoid heat warping on tighter casings. When Mist Graves asked for a dim nightlight, Rune built a simple, dependable model."},
      {name:"Bramble Kite", desc:"A messenger who moves notes around town quickly and keeps routes flexible during weather changes. Bramble uses Slate Crowe’s simple code marks for deliveries and relies on Dusk Mariner when fog shortens routes. When a message risks being misunderstood, Bramble asks for clarity before running it."},
      {name:"Frost Morn", desc:"An early-rising ice seller who organizes drop-offs before the sun warms cellars. Frost stores blocks at Ebon Thatch, supplies Ember Hollow during hot spells, and takes tea with Lumen Wolfe after the last run. When carts break down, Frost checks with Cob Webber for quick fixes."},
      {name:"Ember Hollow", desc:"A thorough candlemaker who labels wicks, scents, and burn times. Ember works with Cinder Wight for reliable jars and keeps a small list of ‘feedback tasters’ including Sable Nyx and V. M. Pyre. Echo Vane sometimes passes notes to test how rumors spread with different candle placements."},
      {name:"Wisp Harrow", desc:"A story collector who writes down what people say and separates hearsay from fact. Wisp listens to Hallow Reed’s sets for clean summaries and checks details with Echo Vane before noting them publicly. When Thorn Ever needs timeline clarity, Wisp provides dates and names without commentary."},
      {name:"Crypt Alder", desc:"A quartermaster who tracks incoming goods and what went missing. Crypt syncs with Slate Crowe’s records weekly and confirms with Raven Cask when shipments arrive. If someone complains, Crypt compares both lists, then asks Noct Rune whether any late-night issues were logged."},
      {name:"Omen Lark", desc:"A friendly street reader whose ‘predictions’ are usually tips about crowd flow and timing. Omen teases Hex Rowan about lucky streaks and suggests face-friendly mask shapes to Gourd Wilder. When Ebon Thatch expects a rush, Omen quietly nudges people toward spare seating."},
      {name:"Raven Cask", desc:"A brewer who experiments in small, labeled batches. Raven tests flavors with Ebon Thatch and keeps a tasting notebook V. M. Pyre references when open flames are part of a show. When supplies run low, Raven double-checks orders with Crypt Alder before changing a recipe."},
      {name:"Night Jar", desc:"A curio buyer and reseller who takes small risks on odd finds. Night Jar trades marked decks with Patch Wylde and orders secure hooks from Cob Webber for fragile items. When a piece carries a story, Night Jar asks Wisp Harrow to record it for the listing."},
      {name:"Lumen Wolfe", desc:"A volunteer night patrol who prefers straightforward routes and early starts. Lumen compares patrol notes with Noct Rune and buys long-burn candles from Ember Hollow for steady light. On cold mornings, Lumen meets Frost Morn for tea and route planning."},
      {name:"Patch Wylde", desc:"A card worker who keeps decks tidy, cuts cleanly, and favors posted rules. Patch partners with Hex Rowan on busier nights and prefers a chair near Ebon Thatch’s door to watch traffic. When disputes rise, Patch pauses the table and defers to Ebon’s seating judgment."},
      {name:"Echo Vane", desc:"A rumor collector who checks sources before repeating anything. Echo sometimes edits Hallow Reed’s lyrics to avoid naming names and shares neutral placement notes with Ember Hollow for crowd flow. Echo and Wisp Harrow trade dates and times to align their notes."},
      {name:"Dusk Mariner", desc:"A ferry operator on the bog path who runs ropes that hold in shifting fog. Dusk supplies spare lines to Mist Graves and passes sealed envelopes to Noct Rune for logging. When the weather turns, Dusk coordinates with Bramble Kite to keep deliveries moving."},
      {name:"Ivy Haze", desc:"An herb gatherer who brings labeled bundles to Ashen Vale and leaf samples to Gloom Ivy for testing under heat. Ivy shares tea with Wisp Harrow on slow afternoons and keeps small sachets for Raven Cask to trial in new brews."},
      {name:"Slate Crowe", desc:"A record keeper who logs meetings, deliveries, and decisions with simple cross-references. Slate checks Thorn Ever’s tallies monthly and gives Bramble Kite signaling marks for routine messages. When confusion arises, Slate pulls the right page and points to the line."},
      {name:"Gourd Wilder", desc:"A mask artisan focused on comfortable fit and clear sight lines. Gourd takes orders from Night Jar, builds shop guards for Cob Webber, and asks Omen Lark about crowd patterns before carving showy pieces. When performers complain, Gourd adjusts straps and pads without fuss."}
    ];
    const DEFAULT_CLUES = [
      {id:"E1", title:"The Dimming of Candles", body:"In the glassblower’s stall, a trio of candles guttered all at once, as though a mouth had drawn in the room’s breath. Witnesses swore the figure who passed by wore a ring that drank the light. They left no soot, only a whisper of clove."},
      {id:"E2", title:"The Whispering Step", body:"Near the square of empty masks, a watcher heard footfalls that seemed to land after their own echoes. The gait was even, decisive, and oddly weightless—as if the night itself cushioned each stride."},
      {id:"E3", title:"Threads by the Well", body:"By the old wishing well, a single thread of deep red snagged on weathered stone, the shade of a harvest moon. No cloak nearby bore that hue—perhaps it belonged to a sash tied close to the heart."},
      {id:"E4", title:"The Breath That Wasn’t", body:"Flutes lay in their case, and yet a mourning note hung in the air as if blown by no mouth at all. The player who lingered exhaled fog though the night was warm, and smiled without teeth."},
      {id:"E5", title:"The Lantern That Blinked", body:"A tinker’s lantern fluttered near a laughing circle—then steadied when a single figure drew near and asked no questions. Lies make it flicker, the tinker swears."},
      {id:"E6", title:"A Toast to Nowhere", body:"Someone raised an empty cup and murmured a phrase not quite language, not quite song. Those within earshot forgot a name they had just learned. The smell of old cellars followed."},
      {id:"E7", title:"Left Hand of Dusk", body:"Chalk tallies were scrawled backward on a ledger margin, lines neat yet mirrored. Whoever wrote them favored the left hand and the calm of twilight."},
      {id:"E8", title:"The Silver Coin Gone Cold", body:"A coin traded thrice in an hour turned cold enough to mist a mirror. The last to hold it tucked it away with clinical care, as though cataloging a specimen."},
      {id:"L1", title:"The Heir in the Crowd", body:"When the bells tolled, a shadow took shelter in another’s laughter. The heir does not stand alone; they orbit a brighter star to dim their edges."},
      {id:"L2", title:"The Smile That Stops", body:"A chuckle rang out, crisp as cracked ice, but ended sharply—habit, not humor. Hands drifted to pockets where keys or coins clicked in nervous code."},
      {id:"L3", title:"Scent of Wet Stone", body:"On the path to the bog ferries, a scent of wet stone trailed someone who avoids shallow water, preferring docks’ deeper quiet."},
      {id:"L4", title:"The Double Shadow", body:"Two silhouettes overlapped beneath a single lantern: one tall and still, the other shifting, impatient. Only one turned when hailed."},
      {id:"L5", title:"The Hat with No Owner", body:"A brim with a feather of ash-gray was left on a chair that always faces the door. No one claimed it—but more than one person looked too long at its seat."},
      {id:"L6", title:"Ink Under the Nail", body:"A knuckle brushed paper and left a crescent of black under the nail—old ink that no wash could fully banish."},
      {id:"D1", title:"Red Herring: The Laughing Mask", body:"A maskmaker insisted a mask smiled on its own when a brewer sang off-key. Sweet nonsense, perhaps, or theater."},
      {id:"D2", title:"Red Herring: The Garlic Fable", body:"Someone swore they saw a cloaked patron recoil from garlic… but the cloves were candied. Theatrical groaning followed."}
    ];
  
    // Modal helpers (each page includes its own <dialog>, but we expose a generic binder)
    function bindModal(closeBtnId, dialogId='resultModal'){
      const modal = $(dialogId);
      const closeBtn = $(closeBtnId);
      if (modal && closeBtn) closeBtn.addEventListener('click', ()=> modal.close());
      return {
        popup:(title, html)=>{
          if (!modal) return alert(title + "\n\n" + html.replace(/<[^>]+>/g,''));
          const head = modal.querySelector('#modalTitle') || modal.querySelector('.modal-head');
          const body = modal.querySelector('#modalBody') || modal.querySelector('.modal-body');
          if (head) head.textContent = title;
          if (body) body.innerHTML = html;
          modal.showModal();
        }
      };
    }
  
    // DB helpers
    let db = null;
    function getDB(){ if (!db) db = firebase.database(); return db; }
  
    async function publishPopup(room, payload){
      try{
        await getDB().ref(`rooms/${room}/state/lastPopup`).set({
          title: payload?.title || 'Notice',
          html: payload?.html || payload?.body || '',
          ts: Date.now()
        });
      }catch(err){
        console.warn('popup publish failed', err);
      }
    }
  
    async function verifyRoomPassword(room, pass){
      const snap = await getDB().ref(`rooms/${room}/passHash`).get();
      if (!snap.exists()) throw new Error('Room not found');
      return (await hashSHA256(pass)) === snap.val();
    }
  
    async function claimCharacter(room, pass, realName){
      const R = room.toUpperCase();
      const ok = await verifyRoomPassword(R, pass);
      if (!ok) throw new Error('Incorrect password');
      const rolesSnap = await getDB().ref(`rooms/${R}/characters`).get();
      if (!rolesSnap.exists()) throw new Error('No characters in this room');
      const entries = Object.entries(rolesSnap.val());
      const unclaimed = entries.filter(([id,c])=>!c.claimedBy).map(([id,c])=>({id,name:c.name}));
      if (!unclaimed.length) throw new Error('All characters are taken');
      const pick = unclaimed[Math.floor(Math.random()*unclaimed.length)];
      const ref = getDB().ref(`rooms/${R}/characters/${pick.id}`);
      const res = await new Promise((resolve, reject)=>{
        ref.transaction(curr=>{
          if (!curr) return curr;
          if (curr.claimedBy) return;
          return {...curr, claimedBy: realName, claimedAt: Date.now()};
        }, (error, committed, snapshot)=>{
          if (error) return reject(error);
          resolve({committed, snapshot});
        }, false);
      });
      if (!res.committed) return claimCharacter(R, pass, realName);
      const myUid = uid(R, realName);
      await new Promise((resolve, reject)=>{
        getDB().ref(`rooms/${R}/users/${myUid}`).transaction(curr=>{
          if (curr) return curr;
          return { name: realName, charId: pick.id, specialRole: null,
                   tasks: DEFAULT_TASKS.map(t=>({text:t, done:false})), dead:false };
        }, (error, committed)=> error?reject(error):resolve(committed), false);
      });
      return pick;
    }
  
    async function getState(room){
      const snap = await getDB().ref(`rooms/${room}/state`).get();
      return snap.exists()? snap.val(): {gameStarted:false, round:1, voting:{open:false,closed:false,candidates:null,votes:null,endsAt:null}};
    }
  
    // Role details + visibility
    function roleDetailsText(role){
      switch(role){
        case 'Elder Vampire': return "Primary killer. One target per round, +1 extra kill each round. Knows the Lesser Vampire and the Thrall.";
        case 'Lesser Vampire': return "Succeeds Elder upon Elder's death. Knows Elder and Thrall. No thrall of their own.";
        case 'Thrall': return "Once-per-game compelled kill on Elder's command; freed if Elder dies.";
        case 'Night Warden': return "Open hunter (nerf blaster). May eliminate one target per round (anyone).";
        case 'Mirrorcloak': return "Hidden avenger. If attacked by vampire/thrall, attacker dies instantly.";
        case 'Gravespeaker': return "Medium. After each death, may consult the dead; each spirit publicly clears one innocent.";
        default: return null;
      }
    }
    function userIsDead(u, chars){
      return !!(u?.dead || (u?.charId && chars && chars[u.charId]?.dead));
    }
    function aliveStatus(u, chars){
      return userIsDead(u, chars) ? ' (dead)' : ' (alive)';
    }
    function renderRoleDetails(me, users, chars, state){
      if (!me?.specialRole) return '';
      const originalElderUid = state?.originalElderUid || null;
      const ascendedElderUid = state?.ascendedElderUid || null;
      let body = `<div><b>Role:</b> ${me.specialRole}</div>`;
      body += `<div class="muted" style="margin-top:6px">${roleDetailsText(me.specialRole)||''}</div>`;
      if (me.specialRole === 'Elder Vampire' || me.specialRole === 'Lesser Vampire'){
        let elderList = [], lesser=null, thrall=null;
        for (const [uid,u] of Object.entries(users||{})){
          if (u.specialRole === 'Elder Vampire') elderList.push({uid,u});
          if (u.specialRole === 'Lesser Vampire') lesser = {uid,u};
          if (u.specialRole === 'Thrall') thrall = {uid,u};
        }
        const lines=[];
        elderList.forEach(({uid,u})=>{
          const tag = uid === originalElderUid ? 'Elder Vampire' : (uid === ascendedElderUid ? 'Ascended Elder' : 'Elder Vampire');
          lines.push(`${tag}: <b>${u.name}</b>${aliveStatus(u, chars)}`);
        });
        if (lesser) lines.push(`Lesser Vampire: <b>${lesser.u.name}</b>${aliveStatus(lesser.u, chars)}`);
        if (thrall) lines.push(`Thrall: <b>${thrall.u.name}</b>${aliveStatus(thrall.u, chars)}`);
        if (lines.length) body += `<div style="margin-top:10px">${lines.map(x=>'- ' + x).join('<br>')}</div>`;
        return `<div class="role-summary">${body}</div>`;
      }
      if (me.specialRole === 'Thrall'){
        const elderUid = originalElderUid || Object.entries(users||{}).find(([uid,u])=> u.specialRole === 'Elder Vampire')?.[0];
        const elder = elderUid ? users[elderUid] : null;
        const freed = elder ? userIsDead(elder, chars) : false;
        const line = elder ? `Elder Vampire: <b>${elder.name}</b>${aliveStatus(elder, chars)}${freed?' - you are <b>SET FREE</b>.':''}` : 'Elder Vampire: (unknown)';
        body += `<div style="margin-top:10px">- ${line}</div>`;
        return `<div class="role-summary">${body}</div>`;
      }
      return `<div class="role-summary">${body}</div>`;
    }

    // Voting helpers
    // Voting helpers
    function updateCountdownPill(pillEl, endsAt){
      if (!pillEl) return;
      if (pillEl.__mbTimer){ clearInterval(pillEl.__mbTimer); pillEl.__mbTimer = null; }

      
      const tick = ()=>{
        const ms = Math.max(0, (endsAt||0) - Date.now());
        const m = Math.floor(ms/60000);
        const s = Math.floor((ms%60000)/1000).toString().padStart(2,'0');
        pillEl.textContent = endsAt ? `Timer: ${m}:${s}` : 'Timer: --';
        if (ms<=0 && pillEl.__mbTimer){
          clearInterval(pillEl.__mbTimer);
          pillEl.__mbTimer = null;
        }
      };

      tick();
      if (endsAt){
        pillEl.__mbTimer = setInterval(tick, 1000);
      }
    }

    function computeTally(users, chars, votes){
      const tally = {};
      Object.entries(votes||{}).forEach(([voter,choice])=>{
        const u = users[voter];
        const aliveVoter = u && !userIsDead(u, chars);
        if (aliveVoter) tally[choice] = (tally[choice]||0)+1;
      });
      return tally;
    }
    function elderTargetsArray(state){
      const targets = state?.elderTargets || {};
      const rounds = ['1','2','3','4'];
      return rounds.map((r,ix)=>{
        const rec = targets[r] || targets[ix+1] || null;
        if (!rec) return {round: ix+1, uid:null};
        return {round: ix+1, uid: rec.uid || null};
      });
    }
    async function ensureElderPromotion(room, context){
      const users = context.users || {};
      const chars = context.chars || {};
      const state = context.state || {};
      const updates = {};
      const elders = [];
      let lesserEntry = null;
      let thrallEntry = null;
      for (const [uid,u] of Object.entries(users)){
        if (u.specialRole === 'Elder Vampire') elders.push([uid,u]);
        if (u.specialRole === 'Lesser Vampire') lesserEntry = [uid,u];
        if (u.specialRole === 'Thrall') thrallEntry = [uid,u];
      }
      if (!state.originalElderUid && elders.length){
        updates[`rooms/${room}/state/originalElderUid`] = elders[0][0];
        state.originalElderUid = elders[0][0];
      }
      const elderAlive = elders.some(([uid,u])=> !userIsDead(u, chars));
      if (!elderAlive && lesserEntry){
        const [lesserUid, lesserUser] = lesserEntry;
        if (!userIsDead(lesserUser, chars)){
          if (lesserUser.specialRole !== 'Elder Vampire'){
            updates[`rooms/${room}/users/${lesserUid}/specialRole`] = 'Elder Vampire';
            users[lesserUid] = {...lesserUser, specialRole:'Elder Vampire'};
          }
          if (state.ascendedElderUid !== lesserUid){
            updates[`rooms/${room}/state/ascendedElderUid`] = lesserUid;
            state.ascendedElderUid = lesserUid;
          }
        }
      }
      if (thrallEntry && state.originalElderUid){
        // Ensure thrall freed flag stored for reuse (optional for UI)
        const [thrallUid] = thrallEntry;
        const elder = users[state.originalElderUid];
        const freed = elder ? userIsDead(elder, chars) : false;
        if (!!state.thrallFreed !== !!freed){
          updates[`rooms/${room}/state/thrallFreed`] = !!freed;
          state.thrallFreed = !!freed;
        }
      }
      if (Object.keys(updates).length){
        await getDB().ref().update(updates);
        return true;
      }
      return false;
    }
  
    async function closeVotingAndResolve(room, popup){
      const stateSnap = await getDB().ref(`rooms/${room}/state`).get();
      const state = stateSnap.val() || {};
      const voting = state.voting || {};
      if (!voting.open) return;
  
      await getDB().ref(`rooms/${room}/state/voting/open`).set(false);
      await getDB().ref(`rooms/${room}/state/voting/closed`).set(true);
  
      const [usersSnap, charsSnap] = await Promise.all([
        getDB().ref(`rooms/${room}/users`).get(),
        getDB().ref(`rooms/${room}/characters`).get()
      ]);
      const users = usersSnap.val()||{};
      const chars = charsSnap.val()||{};
      const aliveUsers = Object.entries(users).filter(([uid,u])=> !(u.dead || (u.charId && chars[u.charId]?.dead)));
      const aliveCount = aliveUsers.length;
      const tally = computeTally(users, chars, voting.votes || {});
      let bestKey=null, bestCount=-1;
      Object.entries(tally).forEach(([k,c])=>{ if (c>bestCount){ bestKey=k; bestCount=c; } });
      const needed = Math.ceil(aliveCount * 0.5);
      let html = `<div>Alive voters: <b>${aliveCount}</b> - Threshold to eliminate: <b>${needed}</b></div><br>`;
      for (const [k,c] of Object.entries(tally)){
        const u = users[k];
        const label = u ? u.name : k;
        html += `- ${label}: <b class="tally">${c}</b><br>`;
      }
      if (bestKey && bestCount >= needed){
        const u = users[bestKey];
        if (u){
          await getDB().ref(`rooms/${room}/users/${bestKey}/dead`).set(true);
          if (u.charId) await getDB().ref(`rooms/${room}/characters/${u.charId}/dead`).set(true);
          html += `<br><b>Eliminated:</b> ${u.name} (by vote)`;
        }
      }else{
        html += `<br><b>No elimination.</b>`;
      }
      if (popup) popup('Mob Justice - Results', html);
      await publishPopup(room, {title:'Mob Justice - Results', html});
      await checkWinConditions(room, popup);
    }
  
    async function checkWinConditions(room, popup){
      const [usersSnap, charsSnap, stateSnap] = await Promise.all([
        getDB().ref(`rooms/${room}/users`).get(),
        getDB().ref(`rooms/${room}/characters`).get(),
        getDB().ref(`rooms/${room}/state`).get()
      ]);
      if (!usersSnap.exists()) return;
      const users = usersSnap.val();
      const chars = charsSnap.exists()? charsSnap.val(): {};
      const state = stateSnap.exists()? stateSnap.val(): {round:1};
      await ensureElderPromotion(room, {users, chars, state});
  
      const allUsers = Object.entries(users);
      const aliveUsers = allUsers.filter(([uid,u])=> !userIsDead(u, chars));
      const aliveVamps = aliveUsers.filter(([uid,u])=> ['Elder Vampire','Lesser Vampire'].includes(u.specialRole));
      const aliveNonVamps = aliveUsers.filter(([uid,u])=> !['Elder Vampire','Lesser Vampire'].includes(u.specialRole));
  
      if (aliveVamps.length === 0){
        const html = `<div>The Elder and Lesser vampires are dead. The village prevails!</div>`;
        if (popup) popup('Village Victory', html);
        await publishPopup(room, {title:'Village Victory', html});
        return;
      }
      if (aliveVamps.length >= aliveNonVamps.length){
        const html = `<div>The night belongs to fangs and shadow.</div>`;
        if (popup) popup('Vampires Triumph', html);
        await publishPopup(room, {title:'Vampires Triumph', html});
        return;
      }
      if (state.round >= 5){
        const targetSlots = elderTargetsArray(state);
        const assignedTargets = targetSlots.filter(t=> t.uid);
        const uniqueTargets = [...new Set(assignedTargets.map(t=>t.uid))];
        const allAssigned = targetSlots.length === 4 && targetSlots.every(t=>t.uid);
        const allDead = uniqueTargets.length === assignedTargets.length && uniqueTargets.every(uid=>{
          const u = users[uid];
          return u ? userIsDead(u, chars) : false;
        });
        if (allAssigned && allDead && aliveVamps.length > 0){
          const html = `<div>The vampire plots succeeded—the marked victims all fell before the final dawn.</div>`;
          if (popup) popup('Vampires Triumph', html);
          await publishPopup(room, {title:'Vampires Triumph', html});
          return;
        }
        if (allAssigned && !allDead && state.round >= 5){
          const html = `<div>Dawn breaks and the remaining villagers stand firm. The vampires failed to claim every marked soul.</div>`;
          if (popup) popup('Village Victory', html);
          await publishPopup(room, {title:'Village Victory', html});
        }
      }
    }
  
    // CSV parser
    function parseCSV(text){
      const rows=[]; let cur=''; let row=[]; let inq=false;
      for (let i=0;i<text.length;i++){
        const ch=text[i], nxt=text[i+1];
        if (ch==='\"'){
          if (inq && nxt==='\"'){ cur+='\"'; i++; }
          else inq=!inq;
        }else if (ch===',' && !inq){
          row.push(cur); cur='';
        }else if ((ch==='\n' || ch==='\r') && !inq){
          if (cur.length||row.length){ row.push(cur); rows.push(row); cur=''; row=[]; }
          if (ch==='\r' && nxt==='\n') i++;
        }else cur+=ch;
      }
      if (cur.length||row.length) { row.push(cur); rows.push(row); }
      return rows;
    }
  
    return {
      initFirebase, getDB, $, hashSHA256, setCookie, getCookie, uid,
      DEFAULT_TASKS, DEFAULT_CHAR_OBJS, DEFAULT_CLUES,
      verifyRoomPassword, claimCharacter, getState,
      roleDetailsText, renderRoleDetails, updateCountdownPill,
      computeTally, closeVotingAndResolve, checkWinConditions,
      parseCSV, bindModal, publishPopup,
      elderTargetsArray, userIsDead,
      storage,
      isDebug: ()=>DEBUG_MODE
    };
  })();
  





