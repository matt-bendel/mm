// ====== Moonlit Bandanas - Shared App JS ======
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
      "Share one rumor or clue you've heard.",
      "Publicly vouch for or accuse exactly one person.",
      "Find someone who matches a clue and ask them about it."
    ];
    const DEFAULT_CHAR_OBJS = [
  {name:"V. M. Pyre", ties:"Friends with Sable Nyx; rivals with Cob Webber.", quirk:"Randomly slips into a deep Transylvanian accent for a few seconds.", secret:"Once committed arson for insurance fraud.", goals:["Show five people your lighter.", "Get two people to light the lighter for you.", "Brag about swallowing fire but refuse to prove it.", "Accidentally tell three people about your arson secret."]},
  {name:"Sable Nyx", ties:"Friends with V. M. Pyre; dislikes Bhad Omen.", quirk:"Constantly talks about wanting a new piercing or tattoo.", secret:"All tattoos are fake.", goals:["Ask people if they have any tattoos.", "Show off your tattoos to everyone who will listen (play up the pain).", "Draw a hideous flash doodle and invite people to get it tattooed.", "Accidentally wipe off a tattoo in front of someone and act horrified."]},
  {name:"Bhad Omen", ties:"Dislikes Sable Nyx; friends with Dusk Mariner.", quirk:"Gasps and pretends to be sucked into visions at random.", secret:"A complete fraud.", goals:["Offer one nonsense fortune.", "Reverse your earlier fortune.", "Plant a bad omen in someone's head.", "Admit your fakeness to at least three guests."]},
  {name:"Cob Webber", ties:"Rivals with V. M. Pyre; supplies Ashen Vale with bug ingredients.", quirk:"Gasps whenever someone says 'be/bee/b' then pretends nothing happened.", secret:"Deathly afraid of bees.", goals:["Ask five people if they heard a buzzing sound, then refuse to explain.", "Pretend to watch an imaginary bug intently until someone notices.", "Tell everyone you love bees.", "Pretend a bee lands on you and loudly freak out."]},
  {name:"Dusk Mariner", ties:"Student of Marrow Quinn; friends with Bhad Omen.", quirk:"Can never remember where the boat is parked.", secret:"Fears water and cannot swim.", goals:["Offer passage to someone, then say you lost your boat.", "Ask several people if they like to fish.", "Insert the phrase 'sea legs' into conversation as often as possible.", "Share your fear aloud with someone."]},
  {name:"Ashen Vale", ties:"Treats Mist Graves; buys from Cob Webber and Viney Haze.", quirk:"Carries a random book and starts reading mid-conversation.", secret:"Working on an illegal love potion.", goals:["Invent a gross potion ingredient and ask everyone if they have it.", "Check in with Mist Graves and suggest a new disgusting potion.", "Tell three people about your Ebon Thatch suspicions.", "See who will agree to take your love potion when it's finished."]},
  {name:"Gloom Ivy", ties:"Cousin of Viney Haze; works with Jack O. Lantern.", quirk:"Loves mushrooms and becomes defensive if other foods are praised.", secret:"Slipped deadly mushrooms into an ex's meal and never got caught.", goals:["Complain about the lack of mushrooms to as many people as possible.", "Ask five people if they would do psychedelics with you, then run away if they say yes.", "Stand like a Goomba and make sound effects for five seconds.", "Tell people your secret, then pretend to forget once they respond."]},
  {name:"Jack O. Lantern", ties:"Works with Gloom Ivy; friends with Lumen Wolfe.", quirk:"Always carrying a candle and asking people to smell it.", secret:"Has no sense of smell.", goals:["Ask three people to let you smell them.", "Ask five people for opinions on your candle.", "Give away your candle and replace it.", "Break down and admit your lack of smell to someone."]},
  {name:"Lumen Wolfe", ties:"Friends with Jack O. Lantern; trusts Crypt I. C.", quirk:"Never likes going places alone; always asks for a buddy.", secret:"To be determined - make one up and stick to it.", goals:["Offer to escort someone somewhere.", "Ask someone to escort you somewhere.", "Tell someone how much you like the moon.", "Share your secret."]},
  {name:"Hex B. Gone", ties:"Drinks and gambles at Guiness Cask's bar; owes Thorn E. Spike.", quirk:"Flips a coin to answer yes/no questions.", secret:"Owns loaded dice and cheated to earn a fortune.", goals:["Make a ridiculous bet with someone.", "Tell three guests how you'll get rich soon.", "Play rock-paper-scissors and get unreasonably upset if you lose.", "Accidentally admit your cheating, then bribe them to stay quiet."]},
  {name:"Thorn E. Spike", ties:"Tracks debts for the town; gossips with Echo Vane (not Wisp Herr).", quirk:"Always has a pencil behind their ear.", secret:"In immense debt to a mysterious patron.", goals:["Ask people who owes someone a favor.", "Get someone to promise you something, even if it's small.", "Invent a debt and loudly forgive it.", "Request collateral from someone to help with your loan."]},
  {name:"Guiness Cask", ties:"Sells to the entire town; buys ice from Frost Morn.", quirk:"Compulsive and obvious liar.", secret:"Saw someone recoil from garlic at the bar.", goals:["Tell three small lies people might catch.", "Tell three obvious lies and insist they are true.", "Give a toast to someone.", "Share your secret with as many people as possible."]},
  {name:"Wisp Herr", ties:"Competes with Echo Vane; confidante to Cinder Weilda.", quirk:"Loudly says 'excuse me' even when already at a comfortable distance.", secret:"Every good storyteller embellishes a tad.", goals:["Get someone to share an interesting character detail.", "Tell that detail to a new person.", "Say 'that's so you' when it makes no sense.", "Admit you fib occasionally - clickbait works."]},
  {name:"Echo Vane", ties:"Confidante to Thorn E. Spike; competes with Wisp Herr.", quirk:"Repeats themselves often.", secret:"Not all of your stories are factual.", goals:["Get someone to share an interesting character detail.", "Tell that detail to a new person.", "Say 'that's so you' when it makes no sense.", "Admit you fib occasionally - clickbait works."]},
  {name:"Noct Rune", ties:"Studied with Slate Crowe; reports to Crypt I. C.", quirk:"Avoids reading and asks others to read for them.", secret:"Can speak any language but can't read at all.", goals:["Find out how many people are right-handed.", "Ask three people their favorite book.", "Correct grammar whenever possible.", "Drop multilingual words to show how educated you are."]},
  {name:"Crypt I. C.", ties:"Works with Al B. Back; gets reports from Noct Rune.", quirk:"Spends days off in the cemetery.", secret:"Keeps secret items off the log - black market dealings.", goals:["Pick up a random item and ask if someone lost it.", "Compliment the condition of something in the room.", "Complain about the condition of something else in the room.", "Accidentally confess your secret to someone besides your patrons."]},
  {name:"Cinder Weilda", ties:"Friends with Ember Hollow; gossips with Wisp Herr.", quirk:"Always inspecting and commenting on any nearby glass.", secret:"Wants to start a glass art store and needs a partner.", goals:["Point out something glass in every conversation.", "Give someone a glass-themed compliment.", "Complain about plastic cups to everyone.", "Find a partner for your new store."]},
  {name:"Ember Hollow", ties:"Friends with Cinder Weilda; admires Night Jar.", quirk:"Makes an 'ah' sound after each drink.", secret:"Hides a poisonous blade.", goals:["Ask someone about their tattoos.", "Get a bandage from a guest (not a host).", "Give Cinder Weilda a high five.", "Admit your secret to someone."]},
  {name:"Night Jar", ties:"Gets masks from Al B. Back; friends with Echo Vane.", quirk:"Stands silently in shadows when not engaged.", secret:"Sells replicas as genuine relics.", goals:["Offer to appraise someone's trinket and make it up.", "Convince someone your outfit piece is designer.", "Identify a skeptic.", "Return a trinket with dramatic flourish."]},
  {name:"Marrow Quinn", ties:"Taught Dusk Mariner; admires Noct Rune.", quirk:"Fascinated by physical traits.", secret:"Keeps a secret sketchbook of abstract art.", goals:["Find out who is left-handed.", "Ask who has a scar and where.", "Ask everyone if their earlobes are attached.", "Drop your sketchbook and act horrified when it's seen."]},
  {name:"Raven Thatch", ties:"Friends with Frost Morn; overcharges Piper Shade.", quirk:"Always offering candy and begging for good reviews.", secret:"Runs a brothel out of the inn.", goals:["Invite two people to your inn, act offended if they decline, but claim you're booked if they accept.", "Complain about high hotel rates to everyone.", "Ask everyone if continental breakfast should be free.", "Invite three people to your secret business using a funny code name."]},
  {name:"Frost Morn", ties:"Friends with Raven Thatch; stocks Guiness Cask's bar with ice.", quirk:"Always talking about how cold they are - shivering included.", secret:"Hates mirrors.", goals:["Ask everyone their opinion on mirrors.", "Shiver randomly in conversation.", "Walk around with a blanket.", "Share your secret and invent a backstory if needed."]},
  {name:"Piper Shade", ties:"Sings with Boney Eilish; barters with Bhad Omen.", quirk:"Whistles constantly, even badly.", secret:"Wants to go solo.", goals:["Get as many people as possible to try whistling.", "Ask Boney Eilish to perform a duet (bonus if it happens).", "Ask everyone their favorite music genre.", "Admit to Hallow that you want to go solo."]},
  {name:"Boney Eilish", ties:"Duets with Piper Shade; resents Ebon Thatch.", quirk:"Randomly breaks into song mid-sentence.", secret:"Also wants to go solo.", goals:["Ask everyone their favorite song.", "Share random song lyrics you just found.", "Ask three people to match pitch with you.", "Admit to Piper you want to try going solo."]},
  {name:"Mist Graves", ties:"Treated by Ashen Vale; admires Lumen Wolfe.", quirk:"Always tired, yawns loudly without apologizing.", secret:"Sleepwalks and wakes in strange places.", goals:["Ask two people if they saw you out last night without explaining.", "Ask someone to share their dreams with you.", "Ask everyone for tips on getting better sleep.", "Fall asleep during a group discussion."]},
  {name:"Zom Bee", ties:"Admires Wisp Herr; works for Slate Crowe.", quirk:"Always hunting for the latest news.", secret:"Shoplifts and pickpockets in free time.", goals:["Get someone's phone number or email.", "Borrow someone's phone briefly (without snooping).", "Chat with one person, then interrupt them three times with fake calls.", "Admit your secret to the person who lent you their phone."]},
  {name:"Slate Crowe", ties:"Hires Zom Bee; studied with Noct Rune.", quirk:"Extremely disorganized and always misplacing things.", secret:"Altered records to protect someone.", goals:["Take a head count of everyone present.", "Note the time randomly during conversation.", "Ask for - or run - a pointless vote.", "Admit your secret out of guilt to someone."]},
  {name:"Viney Haze", ties:"Cousin of Gloom Ivy; sells to Ashen Vale.", quirk:"Hates candy and anything sweet.", secret:"Carries dangerous plant powder at all times.", goals:["Offer to season someone's drink.", "Ask a group who sneezes at sage.", "Hand over a pressed herb token that's really just a leaf.", "Accidentally spill your secret, then beg them to keep it."]},
  {name:"Al. B. Back", ties:"Makes masks for Night Jar; sells at Crypt I. C.'s store.", quirk:"Loves making masks that look too real.", secret:"Owns a mask that looks disturbingly lifelike.", goals:["Compliment two masks or costumes.", "Ask someone if they'd let you craft a mask of them.", "Ask someone if they think you're wearing a mask right now.", "Loudly defend your creepy masks to anyone who will listen."]}
    ];
    DEFAULT_CHAR_OBJS.forEach(o=>{
      if (!o.desc){
        const parts = [];
        if (o.ties) parts.push(`Ties: ${o.ties}`);
        if (o.quirk) parts.push(`Quirk: ${o.quirk}`);
        if (o.secret) parts.push(`Secret: ${o.secret}`);
        o.desc = parts.join(' | ');
      }
    });
    const DEFAULT_CLUES = [
      {id:"E1", title:"The Dimming of Candles", body:"In the glassblower's stall, a trio of candles guttered all at once, as though a mouth had drawn in the room's breath. Witnesses swore the figure who passed by wore a ring that drank the light. They left no soot, only a whisper of clove."},
      {id:"E2", title:"The Whispering Step", body:"Near the square of empty masks, a watcher heard footfalls that seemed to land after their own echoes. The gait was even, decisive, and oddly weightlessas if the night itself cushioned each stride."},
      {id:"E3", title:"Threads by the Well", body:"By the old wishing well, a single thread of deep red snagged on weathered stone, the shade of a harvest moon. No cloak nearby bore that hueperhaps it belonged to a sash tied close to the heart."},
      {id:"E4", title:"The Breath That Wasn't", body:"Flutes lay in their case, and yet a mourning note hung in the air as if blown by no mouth at all. The player who lingered exhaled fog though the night was warm, and smiled without teeth."},
      {id:"E5", title:"The Lantern That Blinked", body:"A tinker's lantern fluttered near a laughing circle then steadied when a single figure drew near and asked no questions. Lies make it flicker, the tinker swears."},
      {id:"E6", title:"A Toast to Nowhere", body:"Someone raised an empty cup and murmured a phrase not quite language, not quite song. Those within earshot forgot a name they had just learned. The smell of old cellars followed."},
      {id:"E7", title:"Left Hand of Dusk", body:"Chalk tallies were scrawled backward on a ledger margin, lines neat yet mirrored. Whoever wrote them favored the left hand and the calm of twilight."},
      {id:"E8", title:"The Silver Coin Gone Cold", body:"A coin traded thrice in an hour turned cold enough to mist a mirror. The last to hold it tucked it away with clinical care, as though cataloging a specimen."},
      {id:"L1", title:"The Heir in the Crowd", body:"When the bells tolled, a shadow took shelter in another's laughter. The heir does not stand alone; they orbit a brighter star to dim their edges."},
      {id:"L2", title:"The Smile That Stops", body:"A chuckle rang out, crisp as cracked ice, but ended sharplyhabit, not humor. Hands drifted to pockets where keys or coins clicked in nervous code."},
      {id:"L3", title:"Scent of Wet Stone", body:"On the path to the bog ferries, a scent of wet stone trailed someone who avoids shallow water, preferring docks' deeper quiet."},
      {id:"L4", title:"The Double Shadow", body:"Two silhouettes overlapped beneath a single lantern: one tall and still, the other shifting, impatient. Only one turned when hailed."},
      {id:"L5", title:"The Hat with No Owner", body:"A brim with a feather of ash-gray was left on a chair that always faces the door. No one claimed itbut more than one person looked too long at its seat."},
      {id:"L6", title:"Ink Under the Nail", body:"A knuckle brushed paper and left a crescent of black under the nailold ink that no wash could fully banish."},
      {id:"D1", title:"Red Herring: The Laughing Mask", body:"A maskmaker insisted a mask smiled on its own when a brewer sang off-key. Sweet nonsense, perhaps, or theater."},
      {id:"D2", title:"Red Herring: The Garlic Fable", body:"Someone swore they saw a cloaked patron recoil from garlic... but the cloves were candied. Theatrical groaning followed."}
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
      const stateSnap = await getDB().ref(`rooms/${R}/state/gameStarted`).get();
      if (stateSnap.exists() && stateSnap.val()){
        throw new Error('Game already in progress');
      }
      const charMap = rolesSnap.val() || {};
      const entries = Object.entries(charMap);
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
          const pickedChar = res.snapshot ? res.snapshot.val() : charMap[pick.id];
          const goalSource = (pickedChar && Array.isArray(pickedChar.goals) && pickedChar.goals.length) ? pickedChar.goals : DEFAULT_TASKS;
          return { name: realName, charId: pick.id, specialRole: null,
                   tasks: goalSource.map(goal=>({text:goal, done:false})), dead:false };
        }, (error, committed)=> error?reject(error):resolve(committed), false);
      });
      return pick;
    }
  
    async function getState(room){
      const snap = await getDB().ref(`rooms/${room}/state`).get();
      return snap.exists()? snap.val(): {gameStarted:false, round:1, roundTimerStartedAt:null, roundTimerDuration:20*60*1000, voting:{open:false,closed:false,candidates:null,votes:null,endsAt:null}};
    }
  
    // Role details + visibility
    function roleDetailsText(role){
      switch(role){
        case 'Elder Vampire': return "Primary killer with a growing budget (R1=1, R2=2, R3=3, R4=4). Knows the Lesser Vampire. If the Elder falls, the Lesser ascends and continues with any remaining allotment.";
        case 'Lesser Vampire': return "Heir to the Elder. Knows the Elder and inherits any remaining kill budget the moment the Elder is eliminated; otherwise the Lesser keeps a low profile.";
        case 'Vampire Hunter': return "Public role. Carries the Nerf blaster and may eliminate one target per round (friend or foe).";
        case 'Mirrorcloak': return "Secret avenger. The first vampire or hunter who attacks the Mirrorcloak dies instead. One-time use.";
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
        let elderList = [], lesser=null;
        for (const [uid,u] of Object.entries(users||{})){
          if (u.specialRole === 'Elder Vampire') elderList.push({uid,u});
          if (u.specialRole === 'Lesser Vampire') lesser = {uid,u};
        }
        const lines=[];
        elderList.forEach(({uid,u})=>{
          const tag = uid === originalElderUid ? 'Elder Vampire' : (uid === ascendedElderUid ? 'Ascended Elder' : 'Elder Vampire');
          lines.push(`${tag}: <b>${u.name}</b>${aliveStatus(u, chars)}`);
        });
        if (lesser) lines.push(`Lesser Vampire: <b>${lesser.u.name}</b>${aliveStatus(lesser.u, chars)}`);
        if (lines.length) body += `<div style="margin-top:10px">${lines.map(x=>'- ' + x).join('<br>')}</div>`;
        return `<div class="role-summary">${body}</div>`;
      }
      return `<div class="role-summary">${body}</div>`;
    }

    // Voting helpers
    // Voting helpers
    function updateCountdownPill(pillEl, endsAt, label){
      if (!pillEl) return;
      if (pillEl.__mbTimer){ clearInterval(pillEl.__mbTimer); pillEl.__mbTimer = null; }
      const textLabel = label || 'Timer';
      if (!endsAt){
        pillEl.textContent = `${textLabel}: --`;
        return;
      }
      const tick = ()=>{
        const ms = Math.max(0, endsAt - Date.now());
        const m = Math.floor(ms/60000);
        const s = Math.floor((ms%60000)/1000).toString().padStart(2,'0');
        pillEl.textContent = `${textLabel}: ${m}:${s}`;
        if (ms<=0 && pillEl.__mbTimer){
          clearInterval(pillEl.__mbTimer);
          pillEl.__mbTimer = null;
        }
      };

      pillEl.__mbTimer = setInterval(tick, 1000);
      tick();
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
      for (const [uid,u] of Object.entries(users)){
        if (u.specialRole === 'Elder Vampire') elders.push([uid,u]);
        if (u.specialRole === 'Lesser Vampire') lesserEntry = [uid,u];
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
      const roundNumber = Number(state.round || 1);
  
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
      if (roundNumber >= 5){
        const targetSlots = elderTargetsArray(state);
        const assignedTargets = targetSlots.filter(t=> t.uid);
        const uniqueTargets = [...new Set(assignedTargets.map(t=>t.uid))];
        const allAssigned = targetSlots.length === 4 && targetSlots.every(t=>t.uid);
        const allDead = uniqueTargets.length === assignedTargets.length && uniqueTargets.every(uid=>{
          const u = users[uid];
          return u ? userIsDead(u, chars) : false;
        });
        if (allAssigned && allDead && aliveVamps.length > 0 && roundNumber >= 5){
          const html = `<div>The vampire plots succeeded-the marked victims all fell before the final dawn.</div>`;
          if (popup) popup('Vampires Triumph', html);
          await publishPopup(room, {title:'Vampires Triumph', html});
          return;
        }
        if (allAssigned && !allDead && roundNumber >= 5){
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
  





